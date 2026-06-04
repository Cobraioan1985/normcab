# NormCab — Note funcționalități implementate

---

## Tabel A.1.4 — Editare inline cu persistență localStorage

### Ce s-a implementat (sesiunea 2026-06-04)

#### Problema rezolvată
Tabelul vizual din panoul "Tabele NTE 007 → A.1.4" și obiectul `DB` folosit la calcule
erau **două surse separate de date**, nesincronizate. Modificarea unuia nu o reflecta pe celălalt.

#### Soluție
- Tabelul vizual afișează valorile din `DB` (prin obiectul `ORIG`)
- Editarea inline actualizează `DB` în memorie **și** salvează în `localStorage`
- La refresh, valorile salvate sunt restaurate automat din `localStorage` și aplicate în `DB`

---

### Cum funcționează editarea

| Acțiune | Rezultat |
|---------|----------|
| Click pe celulă cu valoare | Câmp editabil, fundal galben |
| Click pe celulă `—` (null) | Liiniuța dispare, câmp gol galben |
| Enter | Confirmă valoarea, marchează ca *nesalvat* (galben punctat) |
| Esc | Anulează, revine la valoarea anterioară (sau `—` dacă era null) |
| Click în altă parte fără valoare | Revine la `—` gri |

---

### Butoane din bara tabelului

#### `💾 Salvează`
- Validează că valorile introduse sunt numerice
- Salvează în `localStorage` (cheia: `normcab_a14_ov`)
- Actualizează `DB` în memorie → calculele din Tab 1 reflectă imediat noile valori
- Celulele salvate devin **verde deschis**
- Butonul confirmă: `✓ Salvat (N)`

#### `↺ Resetează la normativ`
- Dacă există valori salvate: șterge `localStorage` + reîncarcă pagina → DB revine la valorile hardcodate din cod
- Dacă nu există valori salvate: anulează doar modificările nesalvate din sesiunea curentă

---

### Indicatori vizuali celule

| Stil | Semnificație |
|------|-------------|
| Fundal alb + bordură galbenă solidă | Celulă în editare (focus activ) |
| Fundal galben deschis + bordură galbenă punctată | Modificată, **nesalvată** |
| Fundal verde deschis + bordură verde | Salvată în localStorage |
| Fundal gri `#f8f8f7`, text `#ccc`, conținut `—` | Valoare null în normativ (nemodificată) |

---

### Mapping DB ↔ coloană tabel (A.1.4, pâmant, 0,6/1 kV)

Coloanele tabelului conectate la `DB["0.6/1"]`:

| Coloană (0-indexed) | Coloană display | Izolație | Poz |
|---------------------|-----------------|----------|-----|
| 0 | 1 | HR_nrad, HR_rad | p |
| 6 | 7 | PVC | p |
| 13 | 14 | XLPE | p |

Celelalte coloane (configurații plan, variante) se salvează tot în localStorage dar nu au corespondent direct în `DB`.

---

### Structura localStorage

```
Cheia: normcab_a14_ov
Format: { "cu_5_13": "222", "al_0_13": "180", ... }
Prefix: cu_ = conductor cupru, al_ = conductor aluminiu
Indici: {prefix}_{rowIndex}_{colIndex}
```

Secțiuni rând:
- **Cu**: rowIndex 0–17 → [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500] mm²
- **Al**: rowIndex 0–11 → [25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500] mm²

---

### Fișiere modificate

- `nte007_app_29.html` — toate modificările sunt inline în fișierul single-page

### Funcții JS adăugate (înainte de `showPanelA14`)

| Funcție | Scop |
|---------|------|
| `a14LoadOverrides()` | Citește `normcab_a14_ov` din localStorage |
| `a14SaveToStorage(ov)` | Scrie în localStorage |
| `a14ApplyToDB(ov)` | Aplică override-urile în obiectul `DB` |
| `A14_DB_COL` | Mapping coloană → chei izolație din DB |

### Funcții JS definite în `showPanelA14()`

| Funcție | Scop |
|---------|------|
| `window.saveA14()` | Validează, salvează, actualizează DB |
| `window.resetA14()` | Resetează la valorile normativului |

---

---

## Tabelele A.1.5 – A.1.13 — Editare inline generică (sesiunea 2026-06-04)

### Ce s-a implementat

Același mecanism de editare inline + persistență localStorage ca la A.1.4, extins la toate tabelele de sarcini admisibile:

| Tabel | Tensiune | Pozare |
|-------|----------|--------|
| A.1.5 | 0,6/1 kV | aer |
| A.1.6 | 3,6/6 kV | pământ |
| A.1.7 | 3,6/6 kV | aer |
| A.1.8 | 6/10 kV | pământ |
| A.1.9 | 6/10 kV | aer |
| A.1.10 | 12/20 kV | pământ |
| A.1.11 | 12/20 kV | aer |
| A.1.12 | 18/30 kV | pământ |
| A.1.13 | 18/30 kV | aer |

### Arhitectură generică

Față de A.1.4 (tabel dinamic JS), tabelele A.1.5–A.1.13 sunt HTML static. Editarea se inițializează **la prima deschidere** a panoului, prin funcția `initTabelEdit(name)`.

### Configurație DB (TABEL_EDIT_CFG)

Coloanele sincronizate cu `DB` pentru calcule (0-indexed):

| Tabel | Material | Col | Izolație |
|-------|----------|-----|---------|
| A.1.5 | Cu+Al | 2 | HR_nrad, HR_rad |
| A.1.5 | Cu | 8 | PVC |
| A.1.5 | Cu+Al | 18 | XLPE |
| A.1.6 | Cu+Al | 2 | HR_nrad |
| A.1.6 | Cu+Al | 5 | PVC |
| A.1.6 | Cu | 11 | HR_rad |
| A.1.7 | Al | 2 | HR_nrad |
| A.1.7 | Cu+Al | 11 | HR_rad |
| A.1.7 | Al | 8 | PVC |
| A.1.8-A.1.9 | Cu+Al | 2 | HR_nrad |
| A.1.10 | Cu | 2 | HR_nrad |
| A.1.10 | Cu | 6 | HR_rad |
| A.1.11 | Cu | 2 | HR_nrad |
| A.1.11 | Cu | 6 | HR_rad |
| A.1.11 | Cu | 10 | XLPE |
| A.1.12-A.1.13 | Cu+Al | 2 | HR_nrad |
| A.1.12-A.1.13 | Cu+Al | 6 | HR_rad |
| A.1.12-A.1.13 | Cu+Al | 10 | XLPE |

*Celelalte coloane se salvează în localStorage dar nu au corespondent direct în DB.*

### Funcții JS adăugate (după `showPanelA14`)

| Funcție/Obiect | Scop |
|----------------|------|
| `TABEL_EDIT_CFG` | Configurație per-tabel (tensiune, pozare, secțiuni, mapare DB) |
| `tabelLoadOv(key)` | Citește override-uri din localStorage |
| `tabelSaveOv(key, ov)` | Scrie override-uri în localStorage |
| `tabelApplyToDB(cfg, ov)` | Aplică override-uri în obiectul `DB` |
| `initTabelEdit(name)` | Inițializează editarea unui panou static (la prima deschidere) |
| `window.saveTabel(name)` | Validează, salvează, actualizează DB |
| `window.resetTabel(name)` | Resetează la valorile normativului |

### Structura localStorage

```
Chei: normcab_a15_ov, normcab_a16_ov, ... normcab_a113_ov
Format: { "cu_5_2": "150", "al_0_18": "140", ... }
Prefix: cu_ / al_  |  Indici: {prefix}_{rowInSection}_{colIndex}
```

---

## TODO / Planificat

- [ ] Autentificare admin pentru drepturi de editare (utilizatorii obișnuiți pot doar vizualiza)
- [ ] Extindere editare la factori de corecție (A.1.14 – A.1.26)
- [ ] Indicator global în navbar când există valori modificate față de normativ
- [ ] Export modificări ca patch JSON aplicabil la alte instanțe

---

*Creat: 2026-06-04 | Versiune aplicație: 29*
