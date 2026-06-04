# NormCab — Plan de dezvoltare
**Aplicație:** Dimensionare și selecție cabluri conform NTE 007/08/00  
**Fișier curent:** `Conversatii Chat/nte007_app_29.html`  
**Obiectiv:** Selecția cablurilor conform NTE 007 **fără abatere**  
**Grafică:** Se păstrează design-ul existent (navy/blue/amber, paneluri slide-in)

---

## STARE CURENTĂ (versiunea 29)

### Module implementate
| Tab | Denumire | Stare |
|-----|----------|-------|
| T1 | Sarcina admisibilă + recomandare secțiune | ✅ Parțial (f2 incomplet) |
| T3 | Căderi de tensiune | ✅ Complet |
| T4 | Stabilitate termică la scurtcircuit | ✅ Complet |
| T5 | Forțe electrodinamice | ✅ Complet |
| T6 | Pozare · Tragere | ✅ Complet |
| T2 | Selecție completă (toate criteriile) | ❌ Lipsă (planificat) |

### Features suport
- ✅ Sesiune (proiect + utilizator + faza)
- ✅ Istoric calcule
- ✅ Tabele NTE 007 (A.1.1 – A.1.26) vizualizabile
- ✅ Raport HTML generat
- ❌ Export Excel/CSV
- ❌ Bibliotecă tipuri cabluri românești
- ❌ Citare explicită NTE 007 în raport

---

## FAZA 0 — AUDIT DATE (prioritate maximă)
> **Fără date corecte, calculele nu sunt conforme NTE 007.**  
> Se verifică fiecare valoare din DB față de imaginile originale din `Conversatii Chat/Fisiere/Tabele A1.1-A1.26 NTE007/`

### 0.1 Sarcini admisibile (DB principal)
- [ ] **A.1.4** — 0,6/1 kV, pământ — verificare toate valorile vs A1.4.png
- [x] **A.1.5** — 0,6/1 kV, aer — EROARE CORECTATĂ: PVC.Cu.a[400]=359→null (valoare imposibilă, <300mm²=707)
- [ ] **A.1.6** — 3,6/6 kV, pământ — verificare vs A1.6.png
- [x] **A.1.7** — 3,6/6 kV, aer — ERORI CORECTATE: HR_rad.Cu.a[70]=363→263, [240]=353→543; HR_rad.Al.a[70]=305→205 (erori de cifră, violări de monotonie)
- [ ] **A.1.8** — 6/10 kV, pământ — verificare vs A1.8.png
- [ ] **A.1.9** — 6/10 kV, aer — verificare vs A1.9.png
- [ ] **A.1.10** — 12/20 kV, pământ — verificare vs A1.10.png
- [ ] **A.1.11** — 12/20 kV, aer — verificare vs A1.11.png
- [ ] **A.1.12** — 18/30 kV, pământ — verificare vs A1.12.png
- [ ] **A.1.13** — 18/30 kV, aer — verificare vs A1.13.png

### 0.2 Factori de corecție
- [ ] **A.1.14** — f₁ (pământ, hârtie impregnată) — verificare F1_TAB vs A1.14.png
- [ ] **A.1.15** — f₁ (pământ, PVC 6/10 kV) — **LIPSĂ din cod** — verificare și adăugare
- [ ] **A.1.16** — f₂ (treflă, 1 conductor monopolar) — verificare vs A1.16.png
- [ ] **A.1.17** — f₂ (treflă, 1 cond. 23 cm) — verificare vs A1.17.png
- [ ] **A.1.18** — f₂ (plan atingere) — verificare vs A1.18.png
- [ ] **A.1.19** — f₂ (3 cond. trifazate, treflă) — verificare F2_TAB vs A1.19.png
- [ ] **A.1.20** — f₂ (3 cond. PVC/PE/XLPE) — verificare vs A1.20.png
- [ ] **A.1.21** — f temperatură aer — verificare F_TAER_TAB vs A1.21.png
- [ ] **A.1.22** — f grupare aer (1 conductor) — verificare vs A1.22.png
- [ ] **A.1.23** — f grupare aer (cond. multiple + CC) — verificare vs A1.23.png
- [ ] **A.1.24** — f conductoare multiple 1,5–10 mm² — verificare vs A1.24.png
- [ ] **A.1.25** — densități curent scurtcircuit Cu — verificare JSCN vs A1.25.png
- [ ] **A.1.26** — densități curent scurtcircuit Al — verificare JSCN vs A1.26.png

### 0.3 Parametri longitudinali
- [ ] **Tab A.2.1** — R₀, X₀ pentru XLPE/PVC/PE și hârtie — verificare R0, X0_cab, X0_h6/h10/h20 vs normativ

### 0.4 Secțiuni lipsă în DB
- [ ] Completare `DB["0.6/1"].XLPE.Cu.p` pentru 1,5; 2,5; 4; 6; 10 mm² (curent `null` — verificat dacă normativul are dash sau valoare)
- [ ] Completare `DB["0.6/1"].PE` (curent vid — XLPE PE 0,6/1 kV nu apare în A.1.4/A.1.5, posibil corect)
- [ ] Verificare completitudine Al pentru toate tensiunile (secțiuni mici adesea lipsă)
- [ ] ⚠ SUSPICIOS: `DB["3.6/6"].HR_rad.Al.a` de la 95–400mm² = identic cu valorile `.p` (posibil copy-paste eronat) — verificare față de A.1.7

### 0.5 Erori corectate în această sesiune (2026-06-04)
| Locație | Valoare veche | Valoare nouă | Tip eroare |
|---------|--------------|--------------|-----------|
| `["0.6/1"].PVC.Cu.a[400]` | 359 | null | Valoare imposibilă (300=707) |
| `["3.6/6"].HR_rad.Cu.a[70]` | 363 | 263 | Eroare cifră (3→2), 70>95 imposibil |
| `["3.6/6"].HR_rad.Cu.a[240]` | 353 | 543 | Eroare cifră (3→5), 240<185 imposibil |
| `["3.6/6"].HR_rad.Al.a[70]` | 305 | 205 | Eroare cifră (3→2), 70>95 imposibil |

---

## FAZA 1 — COMPLETARE TAB 1 "Sarcina admisibilă"

### 1.1 Factori f₂ — toate configurațiile NTE 007

> ⚠ **DISCREPANȚE GRAVE IDENTIFICATE (2026-06-04)** — toate legate de f₂:
>
> **D1** — `t1_disp` (Treflă/Plan) este citit în UI dar **niciodată folosit** în `t1calc()`.  
> Linia 2651: `getF2(..., 'trefla')` este **hardcodat**. Selectarea "Plan" nu afectează calculul.
>
> **D2** — `getF2()` acceptă parametrul `disp` dar **nu îl folosește** intern. Lipsă Tab A.1.18.
>
> **D3** — `F2_TAB` conține Tab A.1.19 (multiconductoare, treflă). Dar DB pentru XLPE/PE  
> folosește `col.14` din A.1.4 = valori pentru **monopolare** → ar trebui Tab A.1.16, nu A.1.19.
>
> **D4** — Dropdown "Dispoziție conductori" este în prezent **decorativ** (nu influențează calculul).

- [ ] Citeşte `t1_disp` în `t1calc()` și transmite valoarea corect la `getF2()`
- [ ] Adaugă tabelul **A.1.16** (f₂ treflă, 1 conductor monopolar) în cod
- [ ] Adaugă tabelul **A.1.17** (f₂ treflă 23 cm, 1 conductor monopolar)
- [ ] Adaugă tabelul **A.1.18** (f₂ plan atingere) și activează-l când disp='plan'
- [ ] Adaugă tabelul **A.1.20** (f₂ PVC/PE/XLPE multiconductor) ca variantă la A.1.19
- [ ] Adaugă tabelul **A.1.15** (f₁ PVC 6/10 kV) în F1_TAB și conectează-l când iz=PVC și ten=6/10
- [ ] Implementează logica de selecție automată tabel f₂:
  - XLPE/PE + treflă → Tab A.1.16 (monopolar, treflă)
  - XLPE/PE + plan → Tab A.1.18 (plan atingere)
  - PVC + treflă → Tab A.1.19 sau A.1.20 (multiconductor, treflă)
  - HR + treflă → Tab A.1.19 (multiconductor, treflă)
  - HR + plan → Tab A.1.18

### 1.2 Factori f pentru aer — completare
- [ ] Extinde lista factori grupare aer (A.1.22/A.1.23) cu toate configurațiile din tabele
- [ ] Adaugă factorul **A.1.24** (cabluri cu conductoare multiple 1,5–10 mm²) ca opțiune

### 1.3 Traseabilitate completă
- [ ] Afișează în caseta "Factori de corecție": număr tabel NTE 007 + rând + coloană pentru fiecare factor
- [ ] Afișează temperatura de funcționare θf și temperatura maxim admisă θsc
- [ ] Referință: `Ib = X A din Tab A.1.4, col.14, rând 50 mm²`

### 1.4 Mod verificare — îmbunătățiri
- [ ] Afișează tabele comparative pentru TOATE secțiunile disponibile (nu doar cele care trec)
- [ ] Adaugă indicator vizual: câte procente rezervă termică / de tensiune

---

## FAZA 2 — TAB 2 NOU: "Selecție completă NTE 007"
> Modulul principal pentru utilizare în practică. Toate criteriile simultan.

### 2.1 Inputuri Tab 2
- [ ] Curent de sarcină I [A]
- [ ] Tensiune nominală Uo/U
- [ ] Material conductor (Cu/Al)
- [ ] Tip izolație
- [ ] Mod pozare + dispoziție
- [ ] Nr. sisteme paralel
- [ ] Condiții de mediu (temp. sol, rts, grad încărcare)
- [ ] Lungime traseu L [m] + cosφ + ΔU_max [%]
- [ ] Curent termic Ith [kA] + durată TK [s] (stabilitate termică)
- [ ] Curent de șoc ip [kA] + distanță cabluri a [mm] (forțe electrodinamice — opțional)

### 2.2 Logică calcul Tab 2
- [ ] Criteriu 1 — **Termic**: S₁ = S_min din Tab A.1.x cu toți factorii f
- [ ] Criteriu 2 — **Cădere de tensiune**: S₂ = S_min din formula ΔU
- [ ] Criteriu 3 — **Stabilitate termică**: S₃ = Ith × √Tk / jthN (Tab A.1.25/26)
- [ ] **Secțiunea recomandată**: max(S₁, S₂, S₃) — cea mai restrictivă condiție
- [ ] Indicator: care criteriu este determinant

### 2.3 Afișaj rezultat Tab 2
- [ ] Card per criteriu: secțiunea minimă necesară + OK/NU pentru secțiunea finală
- [ ] Rezumat final: "Secțiunea recomandată: **X mm² Cu XLPE**"
- [ ] Referință NTE 007 pentru fiecare criteriu
- [ ] Buton "Salvează în Istoric" cu eticheta t2

---

## FAZA 3 — BIBLIOTECĂ TIPURI CABLURI ROMÂNEȘTI

### 3.1 Structura de date
- [ ] Definește schema: `{ tip, tensiune_kV, izolatie, material, sectiuni[], standard, descriere }`
- [ ] Adaugă tipurile principale de cabluri de distribuție:
  - [ ] ACYABY (0,6/1 kV, Al, XLPE/PVC)
  - [ ] CYAbY (0,6/1 kV, Cu, PVC)
  - [ ] CYOY / CYBY (0,6/1 kV, Cu)
  - [ ] NA2XY / NA2XSY (6/10 kV, Al, XLPE)
  - [ ] A2XSY / 2XSY (6/10 kV, XLPE)
  - [ ] AYFGY / NYFGY (20 kV, XLPE)
  - [ ] CYSHYzy (18/30 kV)
  - [ ] Cabluri monopolare MTA/MTu pentru MT

### 3.2 Panel "Bibliotecă cabluri"
- [ ] Buton nou în navbar: "Cabluri" (sau integrat în Tabele NTE 007)
- [ ] Panel slide-in cu lista tipurilor filtrate după tensiune
- [ ] Click pe tip → populează automat câmpurile în Tab 1 și Tab 2

### 3.3 Integrare calcul
- [ ] Când un tip de cablu e selectat, parametrii (izolatie, material) se preiau automat
- [ ] Afișează tipul de cablu selectat în rezultate și în raport

---

## FAZA 4 — EXPORT ȘI RAPORT ÎMBUNĂTĂȚIT

### 4.1 Raport HTML — traseabilitate NTE 007
- [ ] Fiecare valoare Ib citată cu: `Tab A.1.X, pag. Y, col. Z, rând S mm²`
- [ ] Schema de calcul completă pas-cu-pas cu formule
- [ ] Secțiunea normativă aplicabilă pentru fiecare criteriu (pct. din NTE 007)
- [ ] Câmpuri completate automat din sesiunea curentă (proiect, proiectant, dată)

### 4.2 Export CSV
- [ ] Buton "Export CSV" în panelul Raport
- [ ] Conținut: toate câmpurile de intrare + rezultate din istoricul curent
- [ ] Format: UTF-8 cu BOM (pentru Excel românesc)

### 4.3 Export Excel (XLSX)
- [ ] Integrare librărie SheetJS (xlsx.js) din CDN
- [ ] Sheet 1: Parametri calcul
- [ ] Sheet 2: Rezultate pe criterii
- [ ] Sheet 3: Factori de corecție aplicați
- [ ] Header: logo NormCab + date sesiune

---

## FAZA 5 — CALITATE ȘI VALIDARE

- [ ] Validare intrări: mesaje clare pentru combinații fără date în DB
- [ ] Test cu exemple de calcul din NTE 007 (3–5 cazuri de referință)
- [ ] Verificare că selectorul f₂ alege corect tabelul pentru fiecare combinație
- [ ] Responsivitate completă mobile (max-width 600px)
- [ ] Verificare funcționalitate raport la print (CSS print media)

---

## FAZA 6 — FINALIZARE

- [ ] Actualizare panel "Despre": versiunea curentă, changelog, tabele implementate
- [ ] Actualizare panel "Ajutor": metodologie pas-cu-pas, referințe NTE 007
- [ ] Versiune finală denumită `nte007_app_30.html`
- [ ] Actualizare splash screen cu versiunea 4.0

---

## PROGRES

| Faza | Status | Observații |
|------|--------|-----------|
| 0 — Audit date | 🔄 În curs | A.1.5 ✓, A.1.7 ✓ corectate; A.1.4, A.1.6, A.1.8–A.1.13 rămase |
| 1 — Completare Tab 1 | 🔴 Blocată | 4 discrepanțe grave identificate (D1–D4), de rezolvat prioritar |
| 2 — Tab 2 Selecție completă | ⬜ Nepornit | |
| 3 — Bibliotecă cabluri | ⬜ Nepornit | |
| 4 — Export + Raport | ⬜ Nepornit | |
| 5 — Calitate + Validare | ⬜ Nepornit | |
| 6 — Finalizare | ⬜ Nepornit | |

---

## JURNAL SESIUNI

### 2026-06-04 — Sesiunea 1
- Citit și înțeles `Conversatii Chat/Aplicatie.txt` (sesiune anterioară: adăugare tabele A.1.5–A.1.26)
- Creat plan de dezvoltare `PLAN_DEZVOLTARE.md`
- Copiat fișier de lucru în `d:\Programare\Normcab\nte007_app_29.html`
- Audit parțial DB: identificate și corectate 4 erori de monotonie (valori imposibile)
- Identificate 4 discrepanțe grave între DB și logica de calcul (D1–D4) privind factorul f₂

---

*Plan creat: 2026-06-04 | Actualizat: 2026-06-04*  
*Versiune aplicație la data planului: 29 (fișier de lucru: nte007_app_29.html)*
