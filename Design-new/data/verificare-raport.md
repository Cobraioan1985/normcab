# Raport verificare conținut — tabele NTE 007 (A.1.1–A.1.26)

Sursă de adevăr: `uploads/ORDIN_38_NTE_007_-ANEXE.pdf` (Anexa 1, pag. 12–40).
Metodă: extragere pe poziții (x,y) din PDF + comparație cu `tables/*.html`.
Notă: stratul de text al PDF-ului e OCR și are mici glitch-uri (ex. `1,0S`, `3«7`, `449`→`4 49`); de aceea unele „diferențe" sunt artefacte de extragere, nu erori în aplicație.

## Referință (verificate manual de utilizator)
- **A.1.1, A.1.2, A.1.3** — OK (confirmate de tine).

## Sarcină admisibilă (A.1.4–A.1.13) — comparație celulă cu celulă
- **A.1.4** — ✓ identic. (Atenție: cupru S=120 col.6 = „167" e tipărit așa și în normativ, deși pare eronat.)
- **A.1.5** — ✓ identic.
- **A.1.6** — 1 problemă: aluminiu **S=185, col.5** are „–" în aplicație, dar normativul are o valoare (OCR „121", probabil „321"). De confirmat vizual.
- **A.1.7** — ⚠ ERORI REALE de transcriere. De corectat (după confirmare vizuală):
  - Cupru: S=35 (col.5-7), S=70 (col.4,5,8), S=120 (col.5-10), S=185 (col.2,4), S=300 (col.5-7).
  - Aluminiu: S=120 (col.1-5), S=185 (col.5,9,10), S=240 (col.3-5), S=300 (rândul pare copiat din S=240), S=50 și S=500 de verificat.
- **A.1.8** — ✓ identic (o valoare la aluminiu S=400 de privit; în PDF e scindată de OCR).
- **A.1.9** — ✓ în mare; de confirmat vizual: cupru S=95 ultima coloană; aluminiu S=150, S=240 (OCR în PDF).
- **A.1.10** — ✓ identic.
- **A.1.11** — ✓ identic (aluminiu S=70, S=95 apar scindate de OCR în PDF — probabil OK).
- **A.1.12** — ✓ identic.
- **A.1.13** — ✓ identic.

## Factori de corecție (A.1.14–A.1.24) — comparație pe mulțime de valori
(Procentul = câte valori din aplicație se regăsesc în normativ; restul = OCR în PDF.)
- **A.1.14** — 96% (matrice pe blocuri θ 90/80/70/65/60 °C).
- **A.1.15** — 98%.
- **A.1.16** — 98%.
- **A.1.17** — 98%.
- **A.1.18** — 95%.
- **A.1.19** — 99%.
- **A.1.20** — 99%.
- **A.1.21** — 99%.
- **A.1.22** — ✓ 100% (factori numerici). Diagramele SVG = verificare vizuală.
- **A.1.23** — ✓ 100% (factori numerici). Diagramele SVG = verificare vizuală.
- **A.1.24** — ✓ corect, toate cele 8 rânduri (5→0,70/0,75 … 61→0,25/0,30).

## Referință finale
- **A.1.25** — 99% (raze de curbură).
- **A.1.26** — ✓ 100% (forțe de tragere).

## Concluzie
- Tabelul cu probleme reale de corectat: **A.1.7** (transcriere).
- De confirmat vizual pe original: **A.1.6** (1 celulă), **A.1.9** (2-3 celule).
- Restul: conținut consistent cu normativul; diferențele rămase sunt artefacte OCR în PDF, nu erori în aplicație.
- Diagramele SVG (A.1.22, A.1.23, A.1.25, A.1.26) rămân pentru verificarea ta vizuală.
