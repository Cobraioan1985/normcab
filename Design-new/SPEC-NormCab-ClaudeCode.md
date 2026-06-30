# NormCab — Specificație pentru Claude Code

Aplicație web de dimensionare conductoare/cabluri electrice conform **NTE 007/08/00**.
Găzduită local pe un VM Proxmox (Debian). Pe același VM vor sta și alte aplicații similare de calcul.

> **Notă de stare (actualizat).** Prototipul `NormCab.dc.html` conține deja, funcțional:
> - modulul **Sarcină admisibilă** cu **motor de lookup complet** (selecție tabel + coloană + factori f₁/f₂/f₃ + recomandare secțiune);
> - **selecția modulelor de lucru** (modal „Proiect nou" + dropdown „⚙ Module"; Sarcină admisibilă mereu activă — §4a);
> - **workflow „Începe / Continuă / Înapoi"** cu **selector de secțiune cross-tabs** (recomandat by default, override din dropdown, propagare în lanț — §4b);
> - modulul **Verificare tabele** (parcurgere A.1.1–A.1.26, status verificat/probleme, note salvate, editare orice celulă);
> - toate tabelele NTE 007 **extrase în JSON** și **verificate** față de normativ (PDF Anexe).
>
> Codarea „de la zero" NU mai e necesară pentru tabele și motor — ele se **portează** din artefactele descrise mai jos.

---

## 1. Stack recomandat

| Strat | Tehnologie | De ce |
|---|---|---|
| Frontend | HTML/CSS/JS static (single-page, taburi) | fără build, durabil; prototipul `NormCab.dc.html` e baza |
| Backend | **Node.js + Express** | un singur limbaj pe tot stack-ul |
| Bază de date | **SQLite** (un fișier `normcab.db`) | zero administrare, perfect pentru VM local |
| XLSX | **exceljs** (Node) | fișiere `.xlsx` reale, editabile ulterior |
| PDF | **puppeteer** (randează template HTML → PDF) | identic cu aplicația, pixel-perfect |
| Server web / proxy | **Caddy** | servește static + proxy spre backend; mai multe aplicații pe același VM |

Structură pe VM:
```
/var/www/normcab/      → frontend static (HTML/CSS/JS + /data/*.json + /assets)
/srv/normcab-api/      → backend Node + SQLite (normcab.db)
Caddy:  / → static ,  /api/* → proxy localhost:PORT
```

Structura aplicației (frontend):
```
index.html                 # shell: rail navy stânga, header consolă, container taburi
/js/app.js                 # router taburi + state „dosar de circuit"
/js/lookup-engine.js       # MOTORUL de calcul (vezi §3) — pur, fără DOM, testabil
/js/modules/*.js           # un fișier per tab (sarcina, caderi, protectie, …)
/data/nte007-sarcina.json  # matricea de coloane A.1.4–A.1.13 + valorile Iz
/data/nte007-f1-a14.json   # factori f₁ temperatură sol (A.1.14)
/data/nte007-f2-grupare.json # factori f₂ grupare pământ (A.1.16–A.1.20)
/data/nte007-f1-aer-a21.json # factori f₁ temperatură aer (A.1.21)
/data/nte007-f2-aer.json   # factori f₂ grupare aer (A.1.22–A.1.23)
/data/tables/A.1.*.html    # tabelele randate (consultare în tab „Tabele" + verificare)
/assets/                   # logo, marcă
```

---

## 2. Baza de date a tabelelor NTE 007 — DEJA EXTRASĂ

Sursa de adevăr = tabelele HTML (`tables/A.1.*.html`), **verificate celulă-cu-celulă** față de PDF-ul oficial al Anexelor (NTE 007). Artefactele JSON sunt **generate** din ele.

### Categorii
- `referinta`: A.1.1–A.1.3 (coduri cabluri), A.1.25 (raze curbură), A.1.26 (forțe tragere)
- `sarcina_admisibila`: **A.1.4–A.1.13** (matrice Iz; rânduri = secțiuni, coloane = tip cablu)
- `factori_corectie`: A.1.14–A.1.24 (f₁ temperatură, f₂ grupare, factor încărcare etc.)

### Fișierele JSON (formatul real, de portat ca atare)
**`nte007-sarcina.json`** — obiect cheie = id tabel:
```jsonc
{
  "A.1.8": {
    "id": "A.1.8", "pozare": "pamant", "uou": "6/10", "ncol": 17,
    "columns": [
      { "idx": 2, "izolatie": "Hârtie impregnată", "manta": "Plumb",
        "temp": "70°C", "tensiune": "C.A.", "cablu": "multifilar",
        "pozare": "—", "nCable": 1, "f2raw": "20" },
      // … o intrare per coloană fizică a tabelului
    ],
    "values": { "cupru": { "95": [281, …, null], … }, "aluminiu": { … } }
    // values[material][secțiune] = vector Iz pe coloane (null = „—")
  }
}
```
**`nte007-f1-a14.json`** — `{ colMap:[{rho,grad}], blocks:{ <θmax>: { <tempSol>: [valori pe coloane] } } }`
**`nte007-f2-grupare.json`** — `{ "A.1.16": { colMap:[{rho,grad}], blocks:[{label, rows:{<nrSist>:[valori]}}] }, … }`
**`nte007-f1-aer-a21.json`** — `{ cols:[10..50], byTheta:{ <θmax>:{vals:[…]} } }`
**`nte007-f2-aer.json`** — `{ "A.1.22": { counts:[1,2,3], byCount:{…} }, "A.1.23": {…} }`

### Erate de normativ aplicate (păstrează-le)
- **A.1.4** și **A.1.6**: coloanele „pozare în linie" trimit f₂ la **A.1.19** (în normativ scria 18 — eroare confirmată). Marcate `f2corectat` în metadată și corectate și în HTML.
- A.1.6 aluminiu S=185 col.5: valoare „121" (misprint de normativ, păstrată fidel, marcată).

### Regenerare (dacă se modifică un tabel HTML)
Script Node (o dată), cu `jsdom`: parsează `tables/A.1.*.html`, citește antetul (izolație/manta/temp/dispunere prin geometria iconițelor SVG), normalizează zecimala (virgulă→punct), scrie JSON-urile. **Metadata de coloane a fost corectată manual de expert** (fișier `nte007-sarcina.json` e sursa de adevăr — nu o regenera orbește peste corecții).

---

## 3. Motor de lookup (`lookup-engine.js`) — DEJA IMPLEMENTAT

Modul pur (fără DOM), portabil identic în backend (Node) sau frontend. Funcția principală: `computeSarcina(data, inp)`.

**Input** (`inp`): `{ izolatie, manta, tensiune, cablu, pozare, material, pozareTabel, uou, temp, colPick, tub, tubFactor, I, tempSol, rho, grad, nrSisteme }`.

**Lanțul de selecție (ordinea contează):**
1. **Selecție tabel** — după `pozareTabel` (pământ/aer) × `uou` (0,6/1 … 18/30 kV) → unul din A.1.4–A.1.13.
2. **Selecție coloană** — filtrează coloanele tabelului după: `izolatie`, `manta`, `tensiune` (coloanele „C.A./C.C." se potrivesc la ambele), `cablu` (mono/multi; coloanele duale se potrivesc la ambele), `pozare` (treflă/linie; „—" se ignoră).
   - **`sistem` NU e criteriu** (redundant, producea ambiguități) — eliminat intenționat.
3. **Temperatură** — dacă coloanele rămase au 2 temperaturi posibile (doar la **hârtie**: câmp ne-radial vs radial, ex. 65/70 °C), UI cere alegerea (`temp`) → filtrează. La restul, temperatura e unică și read-only.
4. **Dezambiguizare optimist/pesimist** — dacă rămân 2 coloane indistingibile (aceeași temperatură), motorul întoarce `needChoice` cu variantele (idx + f₂ + Iz de referință). UI le afișează ca **„conservatoare (pesimistă)"** (Iz mai mic) vs **„optimistă"** (Iz mai mare); userul alege (`colPick`). Ex. A.1.8 col2 (f₂→A.1.20) vs col3 (f₂→A.1.19).

**Factori (citiți automat din coloana selectată):**
- `f₁` — temperatura mediului. Pământ: A.1.14 (interpolare liniară pe temp sol, după ρ × grad încărcare × θmax). Aer: A.1.21 (interpolare pe temp aer, după θmax).
- `f₂` — grupare. Tabelul e dat de `col.f2raw` (A.1.16–A.1.20 la pământ, A.1.22/23 la aer); lookup după `nrSisteme` × ρ × grad.
- `f₃` — **pozare în tub**: dacă `tub==='da'`, factor fix selectabil `tubFactor` (0,80/0,85/0,90/0,95; implicit **0,85**), la orice pozare.
- `f_total = f₁ · f₂ · f₃`.

**Rezultat:** pentru fiecare secțiune standard: `Iz_cor = Iz_bază · f_total`; criteriu `Iz_cor ≥ I`; **recomandă** cea mai mică secțiune care trece; întoarce și rezerva `(Iz_cor−I)/I`.

**Reguli UI legate de motor (deja în prototip):**
- Câmpul **Manta** apare doar la **hârtie impregnată** (restul izolațiilor: „fără mantă", manta=`—`).
- Câmpul **Temp. funcționare** e dropdown doar când există 2 valori; altfel afișaj fix.
- **Temp. sol** = dropdown 5→40 °C din 5 în 5.

**Validare:** test cu inputuri cunoscute (ex. „XLPE treflă mono · pământ 6/10 · I=280 · sol 20 · ρ1 · grad0,7 · 1 sistem" → A.1.8 col16 → 95 mm²). De păstrat ca test de neregresie.

---

## 4. Workflow de calcul — „Dosar de circuit" (Varianta B)

Un **circuit** = un set de date comune introduse o dată, partajate de toate taburile.

1. **Tab „Sarcină admisibilă" = sursa datelor comune.** User introduce parametrii din §3.
2. Selector **Iz bază**: `NTE 007` (lookup automat) **sau** `Utilizator` (valoare manuală). Factorii se aplică în **ambele** cazuri.
3. **„Începe ▸"** (butonul din tabul Sarcină admisibilă, fost „RUN") → `Iz_cor = Iz_bază · f_total` pentru toate secțiunile; recomandă cea mai mică S cu `Iz_cor ≥ I`; **avansează** la primul tab de calcul activ.
4. **Selector de secțiune cross-tabs (vezi §4b).** Secțiunea propagată e, implicit, **recomandatul** din Sarcină admisibilă; userul poate alege oricare altă secțiune validă din dropdown. Selecția persistă în toate taburile.
5. La selecție → mesaj **informativ** (neutru). Propagarea folosește secțiunea curentă (selectată sau recomandat).
6. **Se propagă datele comune + secțiunea curentă** către taburile următoare.
7. În taburile următoare, editabili **doar parametrii noi**; cei moșteniți apar **read-only** („din Sarcină admisibilă"). Schimbarea lor se face în tabul-sursă (→ taburile dependente se marchează „de recalculat").
8. Navigare în lanț: **„Continuă ▸"** (tab următor activ) și **„◂ Înapoi"** (tab anterior activ), sărind peste modulele neselectate (§4a).
9. **Salvare per tab** independentă. Taburile neparcurse / module neselectate sunt **excluse din raport**.

### 4a. Selecția modulelor de lucru (scope)
- La **crearea unui proiect nou** (buton „+ Proiect nou" → modal): câmp **denumire** + listă de module de calcul bifabile. **Sarcină admisibilă** e mereu activă (obligatoriu, sursa datelor comune) și apare fixă. Buton **„Selectează tot"**.
- Scope-ul e re-editabil oricând din header prin butonul **„⚙ Module"** (dropdown cu aceeași listă + „Selectează tot"; fără Sarcină admisibilă, mereu activă).
- Persistă (în prototip: `localStorage 'normcab_scope'`; în producție: pe circuit/proiect în DB).
- Modulele neselectate sunt **estompate în rail**, **nenavigabile**, sărite de „Continuă/Înapoi" și **excluse din calcul + raport**.

### 4b. Selector de secțiune în fiecare tab de calcul
- Bară sus în fiecare tab de calcul (fundal albastru deschis `#eef4fb`, border `#c9dbef`): label „Secțiune utilizată" + **dropdown** + indicator „Recomandat termic: X mm²".
- Opțiuni dropdown: **„Auto (recomandat)"** + toate secțiunile standard care **trec criteriul termic** din Sarcină admisibilă (`t1res.rows[i].ok === true`); recomandatul e marcat „— recomandat".
- Stare: `sectiuneSelectata` (null = folosește recomandatul; număr = override user). Helper `setSec(val)` declanșează recalcul în lanț pe toate modulele dependente.
- `comun.sectiune = sectiuneSelectata ?? t1res.recomandat`; toate compute-urile celorlalte module folosesc această valoare.
- **De rafinat (slice-uri viitoare):** filtrare per-tab (fiecare tab listează doar secțiunile care trec criteriul lui propriu, cu ✓/✕), „recomandat de acest tab" distinct de cel termic, buton „🔄 Auto" de reset la null, avertizare când secțiunea aleasă iese din lista validă după schimbarea parametrilor.

### Harta de proprietate a parametrilor
| Tab | Moștenește (blocat) | Nou & editabil |
|---|---|---|
| Sarcină admisibilă | — | Uo/U, material, izolație, manta, pozare, dispoziție, I, factori mediu, tub |
| Căderi de tensiune | Uo/U, material, I, **secțiune** | lungime, cos φ, ΔU max |
| Protecție suprasarcină | I (=IB), secțiune → IZ | IN disjunctor, I2 |
| Stabilitate termică | secțiune, material, izolație | Ik, tk |
| Forțe electrodinamice | secțiune | ip, a, D |
| Pierderi P / energie | I, secțiune → R, lungime | τ, cost energie |
| Pozare · tragere | secțiune → d, material | metodă tragere, construcție |

---

## 5. Logica fiecărui modul (formule)

- **Sarcină admisibilă:** vezi §3. Densitate `j = I/S`.
- **Căderi de tensiune (3~):** `ΔU = √3 · I · L · (R·cosφ + X·sinφ)`; `ΔU% = ΔU/Un · 100`; criteriu `ΔU% ≤ ΔU_max` (JT 5%, MT 3%, IT 1% — auto pe nivel tensiune).
- **Secțiune economică:** `S_ec = I / j_ec`; comparație cost investiție + pierderi pe durata de viață.
- **Protecție suprasarcină:** `IB ≤ IN ≤ IZ` și `I2 ≤ 1,45·IZ`.
- **Stabilitate termică (I²t):** `S_min = I_k·√t_k / k`; criteriu `I²t ≤ k²·S²`.
- **Forțe electrodinamice:** `F = 0,17 · i_p² / a` [N/m]; → distanță max între bride.
- **Pierderi:** `ΔP = 3·R·I²`; `energie = ΔP·τ`; cost = energie · tarif; valoare pe 30 ani.
- **Pozare:** rază min curbură `R_min = k·d`; forță tragere `F_adm = σ·S`.

---

## 6. Verificare tabele (modul deja existent — păstrat în aplicația finală)

- Parcurge A.1.1–A.1.26; pentru fiecare: status **verificat / are probleme** + notă (persistente în localStorage / DB).
- Vizual: tabelul randat lângă imaginea originală a normativului (drag-and-drop), comutator alăturat ↔ pe toată lățimea.
- Panou **„Note & decizii"** consolidat (pentru corectarea finală).
- **Editare orice celulă** (text sau cifră; celulele cu diagrame SVG excluse) — corecțiile marcate și salvate.
- Bară de verdict per tabel (conținut verificat de asistent / referință / atenție).

---

## 7. Autentificare + multi-user + lock de editare

- Tabele: `users` (id, nume, email, parolă_hash, rol), `projects`, `project_members` (proiect↔user, rol owner/editor/viewer).
- Fiecare user vede **doar** proiectele proprii + cele partajate.
- **Lock de editare pe proiect:** primul user primește lock (editor), heartbeat ~30 s, expiră la logout/inactivitate.
- Ceilalți → **mod viewer** + banner „X editează acum"; pot prelua editarea după eliberarea lock-ului.

---

## 8. Salvare & rapoarte

- `calculations`: id, project_id, modul, inputuri (JSON), rezultate (JSON), secțiune_selectată, user_id, timestamp.
- **Raport per modul** + **raport general** (toate calculele salvate ale circuitului).
- Doar taburile **salvate** intră în raport.
- Două formate: **PDF** (puppeteer pe template HTML cu identitatea NormCab) și **XLSX** (exceljs, editabil).

---

## 9. API (schiță)
```
POST   /api/auth/login
GET    /api/projects                      # ale userului + partajate
POST   /api/projects/:id/lock             # cere lock editare (heartbeat)
DELETE /api/projects/:id/lock
POST   /api/calc/sarcina                  # rulează lookup-engine.computeSarcina (server-side)
POST   /api/calc/:modul                   # celelalte module
POST   /api/projects/:id/calculations     # salvează calcul
GET    /api/tables                        # index tabele NTE 007
GET    /api/tables/:id                    # un tabel
POST   /api/projects/:id/report           # body: { format: pdf|xlsx, scope: modul|general, tabs:[...] }
```

---

## 10. Identitate vizuală
- Logo: `assets/normcab-logo.png` (lockup, fundal închis) + `assets/normcab-mark.png` (marca). Pentru fundal deschis (PDF/login), variantă cu wordmark navy.
- Paletă: navy `#0a1f3d` / `#10243f`, accent portocaliu `#f29c00` (≈ `#f59e0b`), albastru periwinkle `#7da5d9`, suprafețe deschise `#f4f6f9`, verde OK `#15803d`, roșu NU `#dc2626`.
- Font: IBM Plex Sans (UI) + IBM Plex Mono (cifre, tabular).
- Layout: rail navy stânga (restrâns/extins), header consolă, carduri albe, readout mare navy. Sursa: prototipul `NormCab.dc.html`.

---

## 11. Schema SQLite completă (DDL)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nume          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  parola_hash   TEXT NOT NULL,            -- bcrypt/argon2
  rol           TEXT NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
  creat_la      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nume          TEXT NOT NULL,
  descriere     TEXT,
  owner_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- lock de editare
  lock_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lock_expira   TEXT,                     -- datetime; NULL = liber
  creat_la      TEXT NOT NULL DEFAULT (datetime('now')),
  modificat_la  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE project_members (
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol           TEXT NOT NULL DEFAULT 'editor',  -- 'owner' | 'editor' | 'viewer'
  PRIMARY KEY (project_id, user_id)
);

-- un „circuit" = un dosar de date comune într-un proiect
CREATE TABLE circuits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nume          TEXT NOT NULL,            -- ex. „Plecare TGD → Tablou pompe"
  date_comune   TEXT NOT NULL DEFAULT '{}', -- JSON: parametrii partajați + secțiunea selectată
  creat_la      TEXT NOT NULL DEFAULT (datetime('now')),
  modificat_la  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- un calcul salvat per (circuit, modul)
CREATE TABLE calculations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  circuit_id      INTEGER NOT NULL REFERENCES circuits(id) ON DELETE CASCADE,
  modul           TEXT NOT NULL,          -- 'sarcina' | 'caderi' | 'protectie' | 'termica' | 'forte' | 'pierderi' | 'pozare' | 'economica'
  inputuri        TEXT NOT NULL,          -- JSON
  rezultate       TEXT NOT NULL,          -- JSON
  sectiune_sel    REAL,                   -- mm² (la modulul sarcină)
  stare           TEXT NOT NULL DEFAULT 'ok', -- 'ok' | 'de_recalculat'
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  modificat_la    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (circuit_id, modul)              -- un singur calcul activ per modul/circuit
);

-- note din modulul Verificare tabele (opțional în DB; altfel localStorage)
CREATE TABLE verificari (
  tabel_id      TEXT PRIMARY KEY,         -- 'A.1.4' …
  status        TEXT,                     -- 'ok' | 'issue' | NULL
  nota          TEXT,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  modificat_la  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_calc_circuit ON calculations(circuit_id);
CREATE INDEX idx_circuit_proj ON circuits(project_id);
CREATE INDEX idx_members_user ON project_members(user_id);
```

**Lock de editare (logica):** la deschiderea unui proiect, `POST /api/projects/:id/lock` setează `lock_user_id` + `lock_expira = now+45s` dacă e liber sau expirat; clientul trimite heartbeat la ~30 s. `DELETE` la închidere/logout. Citirea proiectului întoarce și starea lock-ului → UI decide editor vs viewer.

---

## 12. Forma stării „dosar de circuit" (JSON `circuits.date_comune`)

```jsonc
{
  "sarcina": {
    "inputuri": {
      "uou": "6/10", "pozareTabel": "pamant",
      "izolatie": "XLPE", "manta": "—", "material": "cupru",
      "tensiune": "C.A.", "cablu": "monofilar", "pozare": "treflă",
      "temp": "", "colPick": "",
      "tub": "nu", "tubFactor": 0.85,
      "I": 280, "tempSol": 20, "rho": 1.0, "grad": 0.70, "nrSisteme": 1,
      "izBazaMod": "nte007"          // sau "manual" + izBazaManual
    },
    "rezultat": { "table": "A.1.8", "col": 16, "f1": 1, "f2": 1, "fTub": 1,
                  "fTotal": 1, "recomandat": 95 },
    "sectiuneSelectata": 120          // poate diferi de recomandat
  },
  // parametrii „comuni" derivați, citiți read-only de celelalte module:
  "comun": { "uou": "6/10", "material": "cupru", "izolatie": "XLPE",
             "I": 280, "sectiune": 120 },
  // scope module ales la crearea proiectului (§4a); modulele false sunt excluse din calcul + raport:
  "modScope": { "t1": true, "t3": true, "te": false, "tp": true, "t4": true,
                "t5": false, "tl": false, "t6": false }
}
```
Regulă: `comun` se recompune la fiecare RUN + selecție secțiune în tabul Sarcină. Modificarea lui marchează `calculations.stare='de_recalculat'` pentru modulele dependente.

---

## 13. Module — intrări / formule / criterii / ieșiri (detaliat)

Fiecare modul: **moștenește** din `comun` (read-only) + are **inputuri noi**; întoarce rezultat + verdict (OK/NU) + eventual secțiune minimă proprie.

### 13.1 Căderi de tensiune
- Moștenit: `uou`, `material`, `I`, `sectiune`.
- Nou: `L` [m], `cosφ`, `tip` (3~ / 1~ / c.c.), `ΔU_max%` (auto pe nivel: JT 5%, MT 3%, IT 1%; editabil).
- R, X: din secțiune+material (R = ρ·L/S; X ≈ 0,08 Ω/km tipic, tabelar pe secțiune).
- `ΔU(3~) = √3·I·L·(R·cosφ + X·sinφ)`; `ΔU(1~) = 2·I·L·(…)`; `ΔU% = ΔU/Un·100`.
- Criteriu `ΔU% ≤ ΔU_max%`. Ieșire: ΔU [V], ΔU%, verdict, rezervă.

### 13.2 Secțiune economică
- Moștenit: `material`, `I`.
- Nou: `j_ec` [A/mm²] (densitate economică, pe material+durată utilizare), `cost_kWh`, `ore/an`, `ani`.
- `S_ec = I / j_ec` → rotunjit la secțiune standard. Compară cost investiție vs pierderi actualizate.

### 13.3 Protecție la suprasarcină
- Moștenit: `I (=IB)`, `sectiune → IZ` (= Iz_cor din Sarcină).
- Nou: `IN` (curent nominal disjunctor), `I2` (curent convențional declanșare).
- Criterii: `IB ≤ IN ≤ IZ` și `I2 ≤ 1,45·IZ`. Ieșire: ambele verdicte.

### 13.4 Stabilitate termică (scurtcircuit)
- Moștenit: `sectiune`, `material`, `izolatie`.
- Nou: `Ik` [kA] (curent scurtcircuit), `tk` [s] (timp deconectare).
- `k` pe material+izolație (Cu/PVC 115, Cu/XLPE 143, Al/PVC 76, Al/XLPE 94).
- `S_min = Ik·√tk / k`. Criteriu `sectiune ≥ S_min`  ⇔  `I²t ≤ k²·S²`.

### 13.5 Forțe electrodinamice
- Moștenit: `sectiune`.
- Nou: `ip` [kA] (curent de șoc), `a` [m] (distanță între faze), `D` (dispunere).
- `F = 0,17·ip²/a` [N/m] (trifazat). Ieșire: forța, distanță max recomandată între bride.

### 13.6 Pierderi de putere / energie
- Moștenit: `I`, `sectiune → R`, `L`.
- Nou: `τ` [h/an] (timp de pierderi), `cost_kWh`, `ani`.
- `ΔP = 3·R·I²` [W]; `energie = ΔP·τ` [kWh/an]; cost anual + valoare actualizată pe `ani`.

### 13.7 Pozare · tragere
- Moștenit: `sectiune → d` (diametru), `material`.
- Nou: `metoda` (manual/mecanizat), `constructie` (→ k pentru rază).
- `R_min = k·d` (rază min curbură); `F_adm = σ·S` (forță max tragere, σ pe material).

> Constantele tabelare (X pe secțiune, k stabilitate, j_ec, σ) se pun într-un fișier `/data/constante.json` — sursă unică, ușor de revizuit de expert.

---

## 14. Ordine de implementare sugerată
1. Portează `/data/*.json` + `lookup-engine.js` + test de neregresie (§3).
2. Frontend static: shell + tab Sarcină admisibilă funcțional (din prototip) → validare cu expertul.
3. Restul modulelor (§13) ca funcții pure în `lookup-engine.js`/`calc-*.js` + taburi.
4. „Dosar de circuit": **selecția modulelor (§4a)** + selector secțiune cross-tabs (§4b) + propagare + read-only moștenit + „de recalculat".
5. SQLite + Express + auth + lock; salvare calcule.
6. Rapoarte PDF/XLSX. Modulul Verificare tabele (port din prototip).
