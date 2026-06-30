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

// ─── §13.1 Căderi de tensiune ──────────────────────────────────────
// Constants — rezistivitate IEC standard (la 20°C, AC); X tipic per spec §13
const _RHO_CU = 0.01838;  // Ω·mm²/m (IEC; R₂₀=0,01838·L/S, ≈1/54,4)
const _RHO_AL = 0.02875;  // Ω·mm²/m (IEC; ≈1/34,8)
const _X_KM   = 0.08;     // Ω/km (placeholder — viitor: /data/constante.json)
const _SECTIONS = [1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240,300,400,500];
// Uo/U → Un (linia, V) — folosit pentru ΔU%
const _UOU_TO_UN = {'0,6/1':1000,'3,6/6':6000,'6/10':10000,'12/20':20000,'18/30':30000};

export function computeCaderi(comun, inp){
  const Un = _UOU_TO_UN[comun.uou] || 1000;
  const isJT = Un <= 1000;
  const limitDefault = isJT ? 5 : 3;       // JT 5%, MT 3% (IT >35 kV ar fi 1%, dar UI nu permite)
  const limit = (inp.deltaUMax!=='' && inp.deltaUMax!=null) ? +inp.deltaUMax : limitDefault;
  const rho = (comun.material==='aluminiu') ? _RHO_AL : _RHO_CU;
  const cosP = +inp.cosPhi || 0.9;
  const sinP = Math.sqrt(Math.max(0, 1 - cosP*cosP));
  const I = +comun.I || 0;
  const L_m = +inp.L || 0;
  // factor: 3~ → √3, 1~ → 2, c.c. → 2 (R only, X=0)
  const tip = inp.tip || '3~';
  const factor = (tip==='3~') ? Math.sqrt(3) : 2;
  const useX = (tip!=='c.c.');
  const rows = _SECTIONS.map(S => {
    const Rkm = rho * 1000 / S;
    const Xkm = useX ? _X_KM : 0;
    const dU_V = factor * I * (L_m/1000) * (Rkm*cosP + Xkm*sinP);
    const dU_pct = (dU_V / Un) * 100;
    return { sectiune:S, R:+Rkm.toFixed(3), dU:+dU_V.toFixed(1), dUpct:+dU_pct.toFixed(2), ok:dU_pct<=limit };
  });
  const Ssel = +comun.sectiune || null;
  const sel = Ssel ? rows.find(r => r.sectiune===Ssel) : null;
  return { Un, isJT, limit, cosP, sinP, L_m, I, material:comun.material, tip, sel, rows };
}

// ─── §13.2 Secțiune economică ──────────────────────────────────────
// Constante de investiție per metru de cablu — valori orientative (vor migra în /data/constante.json)
const _INVEST_FIX = 100;                              // lei/m — pozare + manoperă (independent de S)
const _INVEST_PER_MM2 = { cupru:1.5, aluminiu:0.7 };  // lei/m/mm² (cablu + material)
function _roundToStandard(s){
  // Convenție electrotehnică: ceiling — alege cea mai mică secțiune standard ≥ s.
  // Nu rotunjim în jos ca să nu subdimensionăm.
  return _SECTIONS.find(x => x >= s) || _SECTIONS[_SECTIONS.length-1];
}
export function computeEconomic(comun, inp){
  const I = +comun.I || 0;
  const material = comun.material || 'cupru';
  const j_ec = +inp.jEc || 2.3;
  const cost_kWh = +inp.costKWh || 0.60;
  const tau = +inp.oraPeAn || 4000;
  const ani = +inp.ani || 30;
  const L_m = +comun.L_m || 0;
  const S_ec_raw = j_ec ? (I / j_ec) : 0;
  const S_ec = _roundToStandard(S_ec_raw);
  const rho = (material==='aluminiu') ? _RHO_AL : _RHO_CU;
  const investPerMm2 = _INVEST_PER_MM2[material] || _INVEST_PER_MM2.cupru;
  // Arată 3 secțiuni: S_ec ± 1 standard
  const idx = _SECTIONS.indexOf(S_ec);
  const showSec = [];
  if (idx > 0) showSec.push(_SECTIONS[idx-1]);
  showSec.push(S_ec);
  if (idx >= 0 && idx < _SECTIONS.length-1) showSec.push(_SECTIONS[idx+1]);
  const rows = showSec.map(S => {
    const invest = (_INVEST_FIX + investPerMm2*S) * L_m;
    const Rkm = rho * 1000 / S;
    const Rtot = Rkm * L_m / 1000;
    const dP_W = 3 * I*I * Rtot;
    const energy_kWh = dP_W * tau / 1000;
    const cost_year = energy_kWh * cost_kWh;
    const pierderi_total = cost_year * ani;
    const total = invest + pierderi_total;
    return { sectiune:S, invest:Math.round(invest), pierderi:Math.round(pierderi_total), total:Math.round(total), isEc:S===S_ec };
  });
  const Smin = +comun.sectiune || null;
  const overMin = Smin!=null ? (S_ec > Smin) : null;
  return { I, material, j_ec, cost_kWh, tau, ani, L_m, S_ec, S_ec_raw:+S_ec_raw.toFixed(1), Smin, overMin, rows };
}

// ─── §13.3 Protecție la suprasarcină ───────────────────────────────
// Valori nominale standard pentru disjunctoare (MCB/MCCB conform IEC)
const _DISJ_IN = [6,10,13,16,20,25,32,40,50,63,80,100,125,160,200,250,315,400,500,630,800,1000,1250,1600,2000,2500];
function _nextDisj(I){ return _DISJ_IN.find(x=>x>=I) || _DISJ_IN[_DISJ_IN.length-1]; }

export function computeProtectie(comun, inp){
  const IB = +comun.I || 0;
  const IZ = +comun.IZ || 0;
  const i2Factor = +inp.i2Factor || 1.45;
  const IN_user = +inp.IN || 0;
  const IN = IN_user > 0 ? IN_user : _nextDisj(IB);
  const I2 = i2Factor * IN;
  const limit2 = 1.45 * IZ;
  const cond1 = (IB <= IN) && (IN <= IZ);
  const cond2 = (I2 <= limit2);
  // Sugerează cea mai mică secțiune standard la care ambele condiții sunt îndeplinite
  let suggested = null;
  if ((!cond1 || !cond2) && comun.rows) {
    const ok = comun.rows.find(r => r.izCor >= IN && i2Factor * IN <= 1.45 * r.izCor);
    if (ok) suggested = { sectiune: ok.sectiune, IZ: ok.izCor };
  }
  return { IB, IN, IZ, I2:+I2.toFixed(1), limit2:+limit2.toFixed(1), i2Factor, cond1, cond2, ok: cond1 && cond2, suggested, INauto: IN_user===0 };
}

// ─── §13.4 Stabilitate termică (I²t) ───────────────────────────────
// k = constanta materialului per IEC 60364-5-54 (A·s^0.5 / mm²)
const _K_MAT_IZOL = {
  cupru:    { xlpe:143, pe:143, pvc:115, hartie:107 },
  aluminiu: { xlpe:94,  pe:94,  pvc:76,  hartie:71  }
};
function _kVal(material, izolatie){
  const m = (material==='aluminiu') ? 'aluminiu' : 'cupru';
  const iz = String(izolatie||'').toLowerCase();
  if (/xlpe/.test(iz)) return _K_MAT_IZOL[m].xlpe;
  if (/^\s*pe\b/.test(iz) || /\bpe\b/.test(iz) && !/xlpe/.test(iz)) return _K_MAT_IZOL[m].pe;
  if (/pvc/.test(iz)) return _K_MAT_IZOL[m].pvc;
  if (/h[âa]rtie/.test(iz)) return _K_MAT_IZOL[m].hartie;
  return _K_MAT_IZOL[m].xlpe;
}
export function computeTermica(comun, inp){
  const Ik = +inp.Ik || 0;        // kA
  const tk = +inp.tk || 0;         // s
  const material = comun.material || 'cupru';
  const izolatie = comun.izolatie || 'XLPE';
  const k = _kVal(material, izolatie);
  const Ik_A = Ik * 1000;
  const I2t = Ik_A*Ik_A * tk;       // A²·s
  const S_min_raw = (k && Ik && tk>=0) ? (Ik_A * Math.sqrt(tk) / k) : 0;
  // ceiling la cea mai mică secțiune standard ≥ S_min
  const S_min_std = _SECTIONS.find(x => x >= S_min_raw) || _SECTIONS[_SECTIONS.length-1];
  const Sused = +comun.sectiune || null;
  const stable = (Sused != null) ? (Sused >= S_min_std) : null;
  // Tabel: arătăm 3 secțiuni — S_rec±2 / la stânga S_min
  const idx = Sused ? _SECTIONS.indexOf(Sused) : _SECTIONS.indexOf(S_min_std);
  const showIdxs = [];
  for (let i = Math.max(0, idx-2); i <= idx && i < _SECTIONS.length; i++) showIdxs.push(i);
  if (Sused && Sused < S_min_std) {
    // adaugă S_min_std la dreapta dacă nu e deja inclus
    const idxMin = _SECTIONS.indexOf(S_min_std);
    if (!showIdxs.includes(idxMin)) showIdxs.push(idxMin);
  }
  const rows = showIdxs.map(i => {
    const S = _SECTIONS[i];
    const limit = k*k * S*S;
    const ok = I2t <= limit;
    return { sectiune:S, I2t_req:I2t, limit, ok, isStar: Sused === S };
  });
  return {
    Ik, tk, material, izolatie, k, S_min_raw:+S_min_raw.toFixed(1), S_min_std,
    Sused, stable, I2t, rows
  };
}

// ─── §13.5 Forțe electrodinamice ───────────────────────────────────
// F = 0,17 · ip² / a   [N/m, ip kA, a m] — sistem trifazat (spec §13.5)
function _estDiamMm(S){
  if (!S || S <= 0) return null;
  // aproximare empirică pt cabluri 0,6/1 kV armate cu izolație tipică
  return +(12 + 2.2 * Math.sqrt(S)).toFixed(1);
}
export function computeForte(comun, inp){
  const ip = +inp.ip || 0;             // kA
  const a_mm = +inp.a || 0;            // mm
  const a_m = a_mm / 1000;
  const F_adm = +inp.F_adm || 450;     // N/bridă (default — spec ar trebui să dea valoarea reală)
  const Sused = +comun.sectiune || null;
  const D_mm = _estDiamMm(Sused);
  const F = (a_m > 0) ? (0.17 * ip*ip / a_m) : 0;   // N/m
  const L_bride_max = (F > 0) ? (F_adm / F) : 0;     // m
  const ok = L_bride_max > 0;
  return {
    ip, a_mm, F_adm, Sused, D_mm,
    F: +F.toFixed(1),
    L_bride_max: +L_bride_max.toFixed(2),
    ok
  };
}

// ─── §13.6 Pierderi P / energie ────────────────────────────────────
// ΔP = 3·R·I²  [W],  R = ρ·L/S  [Ω],  energie = ΔP·τ  [kWh/an]
export function computePierderi(comun, inp){
  const I = +comun.I || 0;
  const material = comun.material || 'cupru';
  const Sused = +comun.sectiune || null;
  const L_m = +comun.L_m || 0;
  const tau = +inp.tau || 0;
  const cost_kWh = +inp.costKWh || 0;
  const ani = +inp.ani || 0;
  const rho = (material==='aluminiu') ? _RHO_AL : _RHO_CU;
  if (!Sused || L_m <= 0) {
    return { I, material, Sused, L_m, tau, cost_kWh, ani, R_km:null, dP_W:null, dP_kW:null, energy_kWh:null, cost_year:null, cost_total:null, ready:false };
  }
  const Rkm = rho * 1000 / Sused;
  const R_total = Rkm * L_m / 1000;
  const dP_W = 3 * I * I * R_total;
  const energy_kWh = dP_W * tau / 1000;
  const cost_year = energy_kWh * cost_kWh;
  const cost_total = cost_year * ani;
  return {
    I, material, Sused, L_m, tau, cost_kWh, ani,
    R_km: +Rkm.toFixed(3),
    R_total: +R_total.toFixed(4),
    dP_W: Math.round(dP_W),
    dP_kW: +(dP_W/1000).toFixed(2),
    energy_kWh: Math.round(energy_kWh),
    cost_year: Math.round(cost_year),
    cost_total: Math.round(cost_total),
    ready:true
  };
}

// ─── §13.7 Pozare · raze curbură + forțe tragere ───────────────────
// k pe construcție (R_min = k·d); σ pe metodă (F_adm = σ·S)
const _K_CONSTR = {
  'jt-mono':   { k:12, label:'JT mono (XLPE/PVC), ≤ 1 kV' },
  'mt-mono':   { k:15, label:'MT mono (XLPE/PVC), > 1 kV' },
  'multi':     { k:12, label:'Multifilar (orice tensiune)' },
  'hartie':    { k:20, label:'Cablu cu hârtie impregnată' },
  'plumb':     { k:25, label:'Cablu cu manta plumb' }
};
// σ în N/mm² · funcție de metoda × material
const _SIGMA_TRAG = {
  'cap':     { cupru:50, aluminiu:30 },  // cap de tragere — fixat pe conductor
  'ciorap':  { cupru:10, aluminiu:10 },  // ciorap — pe manta (limită orientativă)
  'manual':  { cupru:15, aluminiu:15 }   // tragere manuală (constraint manoperă)
};
const _METODA_LABEL = { cap:'Cap de tragere', ciorap:'Ciorap', manual:'Manual' };

// Construcție implicită bazată pe t1
export function defaultConstructie(comun){
  const iz = String(comun.izolatie||'').toLowerCase();
  if (/h[âa]rtie/.test(iz)) return 'hartie';
  return (comun.uou === '0,6/1') ? 'jt-mono' : 'mt-mono';
}

export function computePozare(comun, inp){
  const material = comun.material || 'cupru';
  const Sused = +comun.sectiune || null;
  const D_mm = _estDiamMm(Sused);
  const constructie = inp.constructie || defaultConstructie(comun);
  const metoda = inp.metoda || 'cap';
  const kEntry = _K_CONSTR[constructie] || _K_CONSTR['mt-mono'];
  const sigmaEntry = _SIGMA_TRAG[metoda] || _SIGMA_TRAG.cap;
  const sigma = sigmaEntry[material] || sigmaEntry.cupru;
  const R_min = D_mm ? Math.round(kEntry.k * D_mm) : null;
  const F_adm = Sused ? Math.round(sigma * Sused) : null;
  return {
    material, Sused, D_mm,
    constructie, constructieLabel: kEntry.label, k: kEntry.k,
    metoda, metodaLabel: _METODA_LABEL[metoda] || metoda, sigma,
    R_min, F_adm,
    ready: !!(Sused && D_mm)
  };
}
