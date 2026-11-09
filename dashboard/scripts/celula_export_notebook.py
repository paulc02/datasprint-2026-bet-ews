# Lipește acest cod ca ultimă celulă în MODEL_FINAL.ipynb și rulează notebook-ul.
# Produce dashboard_export.json, din care scripts/to_dashboard.py face src/data/realData.json.

# === Export pentru dashboard (adăugat; nu modifică submisia) ===
import json as _json
def _ser(s): return [None if (v is None or (isinstance(v, float) and not np.isfinite(v))) else float(v) for v in s]
zile_ok = OOF.index[m_comun]
out = {
  "model_final": MODEL_FINAL,
  "praguri": {"alerta_f2": float(PRAG_ALERTA), "ridicat": float(PRAG_RIDICAT), "kaggle": float(PRAG_FINAL), "regula": float(PRAG_REGULA)},
  "rata_istorica": float(HISTORICAL_STRESS_RATE),
  "best_gbm": {k: (float(v) if isinstance(v, (int, float, np.floating, np.integer)) else v) for k, v in BEST_GBM.items()},
  "lr_c": float(LR_C),
  "scoruri_candidati": {k: float(v) for k, v in scoruri.items()},
  "comp": {i: {k: float(v) for k, v in r.items()} for i, r in comp.iterrows()},
  "features": [{"name": f, "cat": CAT_MODEL_VAR[f]} for f in FEATURES],
  "categorii": CAT_MODEL,
  "bet": {"date": [d.strftime("%Y-%m-%d") for d in bet.index], "close": _ser(bet.values)},
  "oof": {"date": [d.strftime("%Y-%m-%d") for d in zile_ok],
          "y": [int(v) for v in y_train.loc[zile_ok].values],
          **{c: _ser(OOF.loc[zile_ok, c].values) for c in ["stacking", "gbm_tuned", "logistic", "hazard", "medie"]}},
  "test": {"date": [d.strftime("%Y-%m-%d") for d in P_TEST.index],
           **{c: _ser(P_TEST[c].values) for c in ["stacking", "gbm_tuned", "logistic", "hazard"]},
           "kaggle": _ser(p_final.reindex(P_TEST.index).values),
           "kaggle_alerta": [bool(v) for v in alerta_final.reindex(P_TEST.index).values]},
  "phi": {"baza": float(baza_phi), "cols": list(PHI.columns), "values": [_ser(r) for r in PHI.values]},
  "ews_oof": {"episoade": int(len(deb_oof)), "prinse": int(avans.notna().sum()), "avans_median_zile_cal": float(avans.median()),
              "debuturi": [d.strftime("%Y-%m-%d") for d in deb_oof], "avans": _ser(avans.values)},
  "final_train": {"date": [d.strftime("%Y-%m-%d") for d in X_train.index],
                  "p": _ser(predictie_finala(X_train)),
                  "y": [int(v) for v in y_train.values],
                  "in_train": [bool(v) for v in M_FIN]},
  "x_test": {"date": [d.strftime("%Y-%m-%d") for d in X_test.index[-40:]],
             "features": list(FEATURES),
             "values": [_ser(r) for r in X_test[FEATURES].iloc[-40:].values]},
  "termen_ultima_zi": {"data": ultima.strftime("%Y-%m-%d"), "p": _ser(curbe_test.loc[ultima].values)},
}
_json.dump(out, open("dashboard_export.json", "w"))
print("export ok", len(out["oof"]["date"]), len(out["test"]["date"]))
