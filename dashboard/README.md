# S.U.P.E.R. · BET EWS — pagina principală

Sistem de avertizare timpurie: probabilitatea ca BET să scadă cu ≥5% în următoarele 20 de zile de tranzacționare.
Stack: React + TypeScript + Tailwind + componente în stil shadcn/ui (Radix) + Recharts + lucide-react.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de producție în dist/ (site static)
npm run preview    # verifică build-ul local
```

## Unde sunt datele
Datele reale ale modelului sunt în `src/data/realData.json`, citite de `src/data/data.ts` (singura sursă de date a interfeței).

Ca să le actualizezi după o nouă rulare a modelului:
1. adaugă `scripts/celula_export_notebook.py` ca ultimă celulă în `../notebooks/model_final.ipynb` și rulează notebook-ul → `dashboard_export.json`;
2. `python scripts/to_dashboard.py dashboard_export.json src/data/realData.json submission.csv scripts/bet_bvb_2023_2026.csv`
   (al treilea argument = submisia trimisă pe Kaggle; al patrulea = închiderile BET de la BVB după 2023, din care se calculează etichetele de stres pe test).

Ce conține: 2013–2023 = predicții out-of-fold (validare walk-forward) + BET real + eticheta reală; 2024–2026 = probabilitatea brută
a modelului final, BET de la BVB, etichetele calculate din el și contribuțiile Shapley exacte pe categorii. Matricea de confuzie, episoadele,
alertele și simulatorul se calculează în `src/lib/analytics.ts`.

Numele pe înțelesul oricui ale variabilelor din bara derulantă sunt în `src/data/featureLabels.ts`.

## Componente
`src/components/`: RiskGauge, ContributionBars, MetricsVsBaseline, HistoryChart, ConfusionMatrix,
AlertProof, TimeMachine, AlertLog (drawer), InvestorSimulator, Topbar, Footer; primitive UI în `components/ui/`.
Sistemul de design (dark only, variabile CSS) e în `src/index.css`. Logo-ul e în `src/assets/logo.svg`.

Pentru deploy vezi **DEPLOY.md**.
