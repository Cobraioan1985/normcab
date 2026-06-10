# NormCab — Plan de dezvoltare
**Aplicație:** Dimensionare și selecție cabluri conform NTE 007/08/00  
**Fișier curent:** `d:\Programare\Normcab\nte007_app_29.html`  
**Obiectiv:** Selecția cablurilor conform NTE 007 **fără abatere, fără simplificări**  
**Grafică:** Se păstrează design-ul existent (navy/blue/amber, paneluri slide-in)

---

## STARE CURENTĂ (versiunea 29)

### Module implementate
| Tab | Denumire | Stare |
|-----|----------|-------|
| T1 | Sarcina admisibilă + recomandare secțiune | ✅ Parțial (f₂ incomplet, D1–D4 nerezolvate) |
| T3 | Căderi de tensiune | ✅ Complet |
| T4 | Stabilitate termică la scurtcircuit | ✅ Complet |
| T5 | Forțe electrodinamice | ✅ Complet |
| T6 | Pozare · Tragere | ✅ Complet |
| T2 | Selecție completă (toate criteriile) | ❌ Lipsă (planificat) |

### Features suport
- ✅ Sesiune (proiect + utilizator + faza)
- ✅ Istoric calcule
- ✅ Tabele NTE 007 (A.1.1 – A.1.26) vizualizabile cu numerotare coloane
- ✅ Raport HTML generat
- ❌ Export Excel/CSV
- ❌ Bibliotecă tipuri cabluri românești
- ❌ Citare explicită NTE 007 în raport

---

## FAZA 0 — AUDIT DATE ȘI STRUCTURĂ (prioritate maximă)
> **Fără date corecte și structură corectă, calculele nu sunt conforme NTE 007.**

### 0.A Structura antetelor tabele (thead)
> Fiecare tabel vizualizare trebuie să aibă exact structura din normativ:  
> rânduri separate pentru: Material izolant / Manta metalică / Prescripție VDE / Temperatură / Dispunere

| Tabel | Status | Observații |
|-------|--------|-----------|
| A.1.4 | ✅ Corectat | VDE0255 cs6 Hârtie, PVC —(cs5)+Plumb(cs2), numerotare col corecta |
| A.1.5 | ✅ Corectat | Structură identică A.1.4; VDE0271 cs5 + DIN57265 cs2 |
| A.1.6 | ⚠️ Probleme | Thead incomplet: lipsesc XLPE, HR_rad gresit la col10 (în PVC!); de reconstruit |
| A.1.7 | ⚠️ Probleme | TR2 mixează VDE cu manta; de reconstruit după verificare normativ |
| A.1.8 | ✅ Reconstruit | 7 rânduri separate, XLPE cs2 corectat, Sarcina adaugată |
| A.1.9 | ✅ Reconstruit | Identic A.1.8 (pozare în aer); rândul Sarcina admisibilă adăugat |
| A.1.10 | ✅ Reconstruit | Hârtie cs3, PE cs2, XLPE cs2 |
| A.1.11 | ✅ Reconstruit | Hârtie cs5, PE cs2, XLPE cs2; rândul Sarcina adăugat |
| A.1.12 | ✅ Reconstruit | 7 rânduri separate |
| A.1.13 | ✅ Reconstruit | 7 rânduri separate |

**Acțiuni rămase:**
- [ ] Verificare A.1.6 contra A1.6.png → reconstruit thead complet (inclusiv XLPE)
- [ ] Verificare A.1.7 contra A1.7.png → reconstruit thead
- [ ] După reconstrucție A.1.6/A.1.7: extrage HR_Al la 3.6/6 kV și adaugă în DB

### 0.B Structura DB — chei și manta metalică
> **Principiu: NICIO simplificare față de normativ.**  
> Fiecare combinație (izolație + manta + conductor + pozare) = cheie distinctă în DB.

| Cheie DB | Semnificație | Status |
|----------|-------------|--------|
| `HR_nrad` | Hârtie impregnată, câmp neomogen, manta Plumb | ✅ Existent |
| `HR_Al` | Hârtie impregnată, câmp neomogen, manta Aluminiu | ✅ Adăugat (2026-06-08) |
| `HR_rad` | Hârtie impregnată, câmp radial (screened) | ✅ Existent (valori ~parțiale) |
| `PVC` | PVC fără manta metalică (VDE 0271) | ✅ Existent |
| `PVC_Pb` | PVC cu manta Plumb (DIN 57265/VDE 0265) | ✅ Adăugat (2026-06-08, 0.6/1 kV) |
| `PE` | PE fără manta metalică | ✅ Existent |
| `XLPE` | XLPE fără manta metalică | ✅ Existent |

**Acțiuni rămase:**
- [ ] Verificare valori `HR_Al` extrase din corpul tabelelor contra imaginilor normativ (unele valori suspecte: secțiuni cu valori identice sau salturi neuzuale — ex. a18/a110/a112)
- [ ] Completare `PVC_Pb` la 3.6/6 kV dacă există în A.1.6/A.1.7 (după reconstituire thead)
- [ ] Clarificare `HR_rad`: la 3.6/6 kV corespunde câmp radial = altă construcție (nu doar manta Al); valorile pentru Al din A.1.6 col4–7 sunt HR_Al, nu HR_rad → separare corectă

### 0.1 Audit sarcini admisibile (DB principal)
- [ ] **A.1.4** — 0,6/1 kV, pământ — verificare toate valorile vs A1.4.png (inclusiv noile coloane HR_Al, PVC_Pb)
- [x] **A.1.5** — 0,6/1 kV, aer — EROARE CORECTATĂ: PVC.Cu.a[400]=359→null
- [ ] **A.1.6** — 3,6/6 kV, pământ — thead de reconstruit + verificare date vs A1.6.png
- [x] **A.1.7** — 3,6/6 kV, aer — ERORI CORECTATE: HR_rad.Cu.a[70,240], HR_rad.Al.a[70]
- [ ] **A.1.8–A.1.13** — 6/10–18/30 kV — thead reconstruit ✅; date de verificat vs imagini
- [ ] **HR_Al extrase** — valori extrase automat din corpul tabelelor; necesită audit manual vs normativ

### 0.2 Factori de corecție
- [ ] **A.1.14** — f₁ (pământ, hârtie impregnată) — verificare F1_TAB vs A1.14.png
- [ ] **A.1.15** — f₁ (pământ, PVC 6/10 kV) — **LIPSĂ din cod** — verificare și adăugare
- [ ] **A.1.16** — f₂ (treflă, 1 conductor monopolar) — verificare vs A1.16.png
- [ ] **A.1.17** — f₂ (treflă, 1 cond. 23 cm) — verificare vs A1.17.png
- [ ] **A.1.18** — f₂ (plan atingere) — verificare vs A1.18.png
- [ ] **A.1.19** — f₂ (3 cond. trifazate, treflă) — verificare F2_TAB vs A1.19.png
- [ ] **A.1.20** — f₂ (3 cond. PVC/PE/XLPE) — verificare vs A1.20.png
- [ ] **A.1.21** — f temperatură aer — verificare F_TAER_TAB vs A1.21.png
- [ ] **A.1.22–A.1.24** — factori grupare aer — verificare vs imagini
- [ ] **A.1.25–A.1.26** — densități curent scurtcircuit Cu/Al — verificare JSCN vs imagini

### 0.3 Parametri longitudinali
- [ ] **Tab A.2.1** — R₀, X₀ — verificare R0, X0_cab, X0_h vs normativ

### 0.4 Secțiuni lipsă / suspecte în DB
- [ ] `DB["0.6/1"].XLPE.Cu.p` pentru 1,5–10 mm² (curent `null`)
- [ ] `DB["0.6/1"].PE` (curent vid)
- [ ] ⚠ SUSPICIOS: `DB["3.6/6"].HR_rad.Al.a` de la 95–400mm² = identic cu `.p`

### 0.5 Erori confirmate și corectate
| Data | Locație | Valoare veche | Valoare nouă | Tip eroare |
|------|---------|--------------|--------------|-----------|
| 2026-06-04 | `["0.6/1"].PVC.Cu.a[400]` | 359 | null | Valoare imposibilă (300=707) |
| 2026-06-04 | `["3.6/6"].HR_rad.Cu.a[70]` | 363 | 263 | Eroare cifră, 70>95 imposibil |
| 2026-06-04 | `["3.6/6"].HR_rad.Cu.a[240]` | 353 | 543 | Eroare cifră, 240<185 imposibil |
| 2026-06-04 | `["3.6/6"].HR_rad.Al.a[70]` | 305 | 205 | Eroare cifră, 70>95 imposibil |

---

## FAZA 1 — COMPLETARE TAB 1 "Sarcina admisibilă"

### 1.1 Factori f₂ — toate configurațiile NTE 007

> ⚠ **DISCREPANȚE GRAVE NEREZOLVATE (D1–D4):**
>
> **D1** — `t1_disp` (Treflă/Plan) citit în UI dar **niciodată folosit** în `t1calc()`.  
> Linia ~2651: `getF2(..., 'trefla')` este **hardcodat**. Selectarea "Plan" nu afectează calculul.
>
> **D2** — `getF2()` acceptă parametrul `disp` dar **nu îl folosește** intern. Lipsă Tab A.1.18.
>
> **D3** — `F2_TAB` = Tab A.1.19 (multiconductoare, treflă). DB XLPE/PE folosește col cu aranjament monopolar → ar trebui Tab A.1.16, nu A.1.19.
>
> **D4** — Dropdown "Dispoziție conductori" este **decorativ** (nu influențează calculul).

- [ ] Citeşte `t1_disp` în `t1calc()` și transmite corect la `getF2()`
- [ ] Adaugă Tab **A.1.16** (f₂ treflă, 1 conductor monopolar)
- [ ] Adaugă Tab **A.1.17** (f₂ treflă 23 cm, 1 conductor monopolar)
- [ ] Adaugă Tab **A.1.18** (f₂ plan atingere) și activează la disp='plan'
- [ ] Adaugă Tab **A.1.20** (f₂ PVC/PE/XLPE multiconductor) ca variantă la A.1.19
- [ ] Adaugă Tab **A.1.15** (f₁ PVC 6/10 kV) și conectează la iz=PVC, ten=6/10
- [ ] Implementează logica selectie f₂ per tip izolatie + dispunere

### 1.2 Factori f pentru aer — completare
- [ ] Extinde factori grupare aer (A.1.22/A.1.23) cu toate configurațiile
- [ ] Adaugă factorul **A.1.24** (cabluri cu conductoare multiple 1,5–10 mm²)

### 1.3 Traseabilitate completă
- [ ] Afișează pentru fiecare factor: număr tabel NTE 007 + rând + coloană
- [ ] Afișează θf și θsc pentru tipul de cablu selectat
- [ ] Exemplu: `Ib = 206 A din Tab A.1.4, col 7 (PVC—, VDE0271, 70°C), rând 25 mm²`

### 1.4 Mod verificare — îmbunătățiri
- [ ] Afișează tabel comparativ pentru TOATE secțiunile disponibile
- [ ] Adaugă indicator: procente rezervă termică / tensiune

---

## FAZA 2 — TAB 2 NOU: "Selecție completă NTE 007"

### 2.1 Inputuri Tab 2
- [ ] Curent de sarcină I [A], Tensiune nominală Uo/U
- [ ] Material conductor, Tip izolație, Manta metalică
- [ ] Mod pozare + dispoziție, Nr. sisteme paralel
- [ ] Condiții mediu (temp. sol, rts, grad încărcare)
- [ ] Lungime L [m] + cosφ + ΔU_max [%]
- [ ] Curent termic Ith [kA] + durată TK [s]
- [ ] Curent de șoc ip [kA] + distanță cabluri a [mm] (opțional)

### 2.2 Logică calcul Tab 2
- [ ] Criteriu 1 — **Termic**: S₁ din Tab A.1.x cu toți factorii f
- [ ] Criteriu 2 — **Cădere de tensiune**: S₂ din formula ΔU
- [ ] Criteriu 3 — **Stabilitate termică**: S₃ = Ith × √Tk / jthN
- [ ] Secțiunea recomandată: max(S₁, S₂, S₃) + indicare criteriu determinant

### 2.3 Afișaj rezultat Tab 2
- [ ] Card per criteriu + rezumat final + referință NTE 007
- [ ] Buton "Salvează în Istoric"

---

## FAZA 3 — BIBLIOTECĂ TIPURI CABLURI ROMÂNEȘTI

- [ ] Schema date: tip, tensiune_kV, izolatie, manta, material, sectiuni[], standard
- [ ] Tipuri: ACYABY, CYAbY, CYOY/CYBY, NA2XY, A2XSY, AYFGY, CYSHYzy etc.
- [ ] Panel slide-in filtrat după tensiune + populare automată câmpuri calcul

---

## FAZA 4 — EXPORT ȘI RAPORT ÎMBUNĂTĂȚIT

- [ ] Raport: citare fiecare valoare cu Tab A.1.X + pag + col + rând
- [ ] Export CSV (UTF-8 cu BOM pentru Excel românesc)
- [ ] Export Excel (SheetJS): parametri + rezultate + factori de corecție

---

## FAZA 5 — CALITATE ȘI VALIDARE

- [ ] Validare intrări: mesaje pentru combinații fără date în DB
- [ ] Test cu exemple de calcul din NTE 007 (3–5 cazuri de referință)
- [ ] Verificare selecție automată tabel f₂ pentru fiecare combinație
- [ ] Responsivitate completă mobile + CSS print pentru raport

---

## FAZA 6 — FINALIZARE

- [ ] Actualizare panel "Despre" și "Ajutor"
- [ ] Versiune finală: `nte007_app_30.html`
- [ ] Actualizare splash screen versiunea 4.0

---

## PROGRES

| Faza | Status | Observații |
|------|--------|-----------|
| 0.A — Structura tabele thead | 🔄 În curs | A.1.4/5/8–13 ✅; A.1.6/7 ⚠️ rămân |
| 0.B — Chei DB (manta metalică) | 🔄 În curs | HR_Al + PVC_Pb adăugate; valori de auditat |
| 0.1 — Audit sarcini admisibile | 🔄 În curs | Erori corectate A.1.5/7; A.1.4/6/8–13 rămân |
| 0.2–0.3 — Factori / parametri | ⬜ Nepornit | |
| 1 — Completare Tab 1 | 🔴 Blocată | D1–D4 nerezolvate |
| 2 — Tab 2 Selecție completă | ⬜ Nepornit | |
| 3 — Bibliotecă cabluri | ⬜ Nepornit | |
| 4 — Export + Raport | ⬜ Nepornit | |
| 5 — Calitate + Validare | ⬜ Nepornit | |
| 6 — Finalizare | ⬜ Nepornit | |

---

## JURNAL SESIUNI

### 2026-06-04 — Sesiunea 1
- Citit și înțeles `Conversatii Chat/Aplicatie.txt`
- Creat plan de dezvoltare `PLAN_DEZVOLTARE.md`
- Copiat fișier de lucru în `d:\Programare\Normcab\nte007_app_29.html`
- Audit parțial DB: identificate și corectate 4 erori de monotonie
- Identificate 4 discrepanțe grave D1–D4 privind factorul f₂

### 2026-06-05 — Sesiunile 2–3
- **Numerotare coloane**: toate tabelele A.1.4–A.1.13 numerotează de la "Secțiunea nominală conductor" = col 1
- **A.1.4**: eliminat rândul static duplicat de numerotare; VDE0255 extins la cs6 (Plumb + Al); PVC corectat: — cs5 (VDE0271) + Plumb cs2 (DIN57265)
- **A.1.5**: corectat structură PVC (aceleași reguli ca A.1.4)
- **A.1.8–A.1.11**: thead complet reconstruit — rânduri separate Manta/VDE/Temp/Dispunere, XLPE cs2 corectat, rândul "Sarcina admisibilă" adăugat unde lipsea

### 2026-06-08 — Sesiunea 4
- **Restructurare majoră DB** — eliminarea simplificărilor față de normativ:
  - Adăugat cheie `HR_Al` (Hârtie, manta Aluminiu) cu valori extrase din corpul tabelelor pentru toate tensiunile: 0.6/1 / 6/10 / 12/20 / 18/30 kV, poz. p și a, conductor Cu și Al
  - Adăugat cheie `PVC_Pb` (PVC, manta Plumb) la 0.6/1 kV
  - Actualizat `dbCols` pentru A.1.4–A.1.13 cu indici corecți și chei noi (inclusiv fix A.1.5 XLPE col18→col13)
  - A.1.8–A.1.13 acum mapează PVC/PE/XLPE din tabel (anterior nemapate)
  - Dropdown calcul actualizat: HR_Al, PVC_Pb, HR_rad redenumit
- **A.1.12–A.1.13**: thead reconstruit (sesiune anterioară)
- **A.1.6/A.1.7**: identificate probleme structurale — thead necesită reconstituire (pendinte)

---

*Plan creat: 2026-06-04 | Actualizat: 2026-06-08*  
*Versiune aplicație: 29 (fișier de lucru: nte007_app_29.html)*
