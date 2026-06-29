// NormCab — motor de lookup NTE 007 general (A.1.4–A.1.13 + factori f1/f2 pământ & aer).
function _n(s){return String(s||'').toLowerCase().replace(/\s+/g,'').replace(/\./g,'');}
function _izol(s){return _n(String(s||'').replace(/[^a-zA-ZăâîșțĂÂÎȘȚ ]+$/,''));}

export function selectTable(tables, pozare, uou){
  return Object.values(tables).find(t => t.pozare===pozare && t.uou===uou) || null;
}
export function selectColumn(tableMeta, inp){
  return tableMeta.columns.filter(col=>{
    if(_izol(col.izolatie)!==_izol(inp.izolatie))return false;
    if(_n(col.manta)!==_n(inp.manta))return false;
    const ct=_n(col.tensiune); if(ct!=='cacc'&&ct!==_n(inp.tensiune))return false;
    const cc=_n(col.cablu), wantMulti=_n(inp.cablu).includes('multi');
    if(!(cc.includes('multifilar')&&cc.includes('monofilar'))){ if(cc.includes('multifilar')!==wantMulti)return false; }
    if(col.pozare!=='—'&&_n(col.pozare)!==_n(inp.pozare))return false;
    return true;
  });
}
function _tnum(t){ const m=String(t||'').match(/(\d+)/); return m?m[1]+'\u00b0C':String(t); }
export function availTemps(cands){
  const out=[]; cands.forEach(c=>{ const t=_tnum(c.temp); if(!out.includes(t)) out.push(t); });
  return out;
}
function interp(map, key, ci){
  if(map[key]&&map[key][ci]!=null)return map[key][ci];
  const ks=Object.keys(map).map(Number).sort((a,b)=>a-b); let lo=null,hi=null;
  ks.forEach(k=>{if(map[k][ci]!=null){if(k<=key)lo=k;if(k>=key&&hi===null)hi=k;}});
  if(lo!=null&&hi!=null&&lo!==hi)return +(map[lo][ci]+(key-lo)/(hi-lo)*(map[hi][ci]-map[lo][ci])).toFixed(3);
  return lo!=null?map[lo][ci]:(hi!=null?map[hi][ci]:null);
}
function f1ground(f1d, theta, tempSol, rho, grad){
  const blk=f1d.blocks[theta]; if(!blk)return null;
  let ci=f1d.colMap.findIndex(c=>c.rho===rho&&c.grad===grad); if(ci<0&&rho===2.5)ci=f1d.colMap.length-1; if(ci<0)return null;
  return interp(blk, tempSol, ci);
}
function f1airLook(f1a, theta, tempAer){
  const blk=f1a.byTheta[String(theta)]; if(!blk)return null;
  const ci=f1a.cols.indexOf(tempAer);
  if(ci>=0&&blk.vals[ci]!=null)return blk.vals[ci];
  // interpolate on tempAer
  const m={}; f1a.cols.forEach((t,i)=>m[t]=[blk.vals[i]]); return interp(m, tempAer, 0);
}
function f2ground(f2d, tableId, nrSist, rho, grad){
  const t=f2d[tableId]; if(!t)return null; const blk=t.blocks[0]; if(!blk)return null;
  const ci=t.colMap.findIndex(c=>c.rho===rho&&c.grad===grad); if(ci<0)return null;
  if(blk.rows[nrSist]&&blk.rows[nrSist][ci]!=null)return blk.rows[nrSist][ci];
  const av=Object.keys(blk.rows).map(Number).filter(s=>blk.rows[s][ci]!=null); if(!av.length)return null;
  const near=av.reduce((p,c)=>Math.abs(c-nrSist)<Math.abs(p-nrSist)?c:p); return blk.rows[near][ci];
}
function f2airLook(f2a, tableId, nrSist){
  const t=f2a[tableId]; if(!t)return null; if(t.byCount[nrSist]!=null)return t.byCount[nrSist];
  const av=t.counts.filter(c=>t.byCount[c]!=null); if(!av.length)return null;
  const near=av.reduce((p,c)=>Math.abs(c-nrSist)<Math.abs(p-nrSist)?c:p); return t.byCount[near];
}
export function computeSarcina(data, inp){
  const tbl = selectTable(data.tables, inp.pozareTabel, inp.uou);
  if(!tbl) return { error:'Nu există tabel pentru pozare='+inp.pozareTabel+' și Uo/U='+inp.uou+' kV' };
  let sel = selectColumn(tbl, inp);
  const temps = availTemps(sel);
  if(temps.length>1 && inp.temp){ sel = sel.filter(c=>_tnum(c.temp)===_tnum(inp.temp)); }
  if(temps.length>1 && !inp.temp){ return { error:'Alege temperatura de funcționare ('+temps.join(' / ')+')', cols:sel.map(c=>c.idx), table:tbl.id, availTemps:temps }; }
  if(sel.length>1){
    // residual indistinguishable columns — offer a disambiguation pick
    if(inp.colPick){ const p=sel.find(c=>c.idx===+inp.colPick); if(p) sel=[p]; }
    if(sel.length>1){
      const ref = tbl.values[inp.material] && (tbl.values[inp.material]['95']||tbl.values[inp.material]['50']);
      return { needChoice:true, table:tbl.id, availTemps:temps,
        choices: sel.map(c=>({ idx:c.idx, f2:c.f2raw, iz: (tbl.values[inp.material] && tbl.values[inp.material]['95']) ? tbl.values[inp.material]['95'][c.idx-1] : null })) };
    }
  }
  if(sel.length!==1) return { error:'Combinație imposibilă pentru '+tbl.id+' — verifică izolație/manta/dispunere', cols:sel.map(c=>c.idx), table:tbl.id, availTemps:temps };
  const col = sel[0]; const theta = parseInt(col.temp) || null;
  let f1=null, f2=null, f2tab=null;
  if(inp.pozareTabel==='pamant'){
    f1 = theta ? f1ground(data.f1g, theta, inp.tempSol, inp.rho, inp.grad) : null;
    f2tab = col.f2raw==='16/17' ? 'A.1.16' : 'A.1.'+col.f2raw;
    f2 = f2ground(data.f2g, f2tab, inp.nrSisteme, inp.rho, inp.grad);
  } else {
    f1 = theta ? f1airLook(data.f1a, theta, inp.tempSol) : null;   // tempSol field reused as temp aer
    f2tab = 'A.1.'+col.f2raw;
    f2 = f2airLook(data.f2a, f2tab, inp.nrSisteme);
  }
  const fTub = (inp.tub==='da') ? (inp.tubFactor || 0.85) : 1;
  const fTotal = (f1==null?1:f1)*(f2==null?1:f2)*fTub;
  const secOrder=['1.5','2.5','4','6','10','16','25','35','50','70','95','120','150','185','240','300','400','500'];
  const rows=[]; let rec=null;
  secOrder.forEach(s=>{ const r=tbl.values[inp.material] && tbl.values[inp.material][s]; if(!r)return; const iz=r[col.idx-1]; if(iz==null)return;
    const izcor=+(iz*fTotal).toFixed(0); const ok=izcor>=inp.I; if(ok&&!rec)rec=s;
    rows.push({sectiune:+s, izBaza:iz, izCor:izcor, ok, rezerva:+(((izcor-inp.I)/inp.I)*100).toFixed(1)}); });
  return { table:tbl.id, col:col.idx, theta, f1, f2, f2tab, fTub, fTotal:+fTotal.toFixed(3), recomandat:rec?+rec:null, rows, izolatie:col.izolatie, availTemps:temps };
}
