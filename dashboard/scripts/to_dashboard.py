"""Transformă exportul notebook-ului în datele dashboard-ului (src/data/realData.json).

Utilizare:
  python to_dashboard.py dashboard_export.json realData.json submission.csv bet_bvb.csv
  (bet_bvb.csv = închiderile BET după 2023, coloanele date,close; din ele se calculează etichetele reale pe test)

Zile afișate:
  * 2013–2023 (validare walk-forward): zilele de tranzacționare cu BET; prob = predicția out-of-fold a modelului final.
  * 2024–2026 (test): zilele lucrătoare; prob = probabilitatea brută a modelului final (fără stratul de decizie Kaggle).
"""
import json
import sys
import pandas as pd

src = json.load(open(sys.argv[1]))
dst = sys.argv[2]
MF = src["model_final"]

bet = pd.Series(src["bet"]["close"], index=pd.to_datetime(src["bet"]["date"]))
oof = pd.DataFrame({k: v for k, v in src["oof"].items() if k != "date"}, index=pd.to_datetime(src["oof"]["date"]))
test = pd.DataFrame({k: v for k, v in src["test"].items() if k != "date"}, index=pd.to_datetime(src["test"]["date"]))
# Valorile Kaggle: din submisia originală a utilizatorului (fișierul trimis oficial), nu din rularea locală
if len(sys.argv) > 3:
    orig = pd.read_csv(sys.argv[3])
    orig.index = pd.to_datetime(orig["Date"], format="mixed")
    test["kaggle"] = orig["stress_probability_20d"].reindex(test.index).values
    test["kaggle_alerta"] = (orig["stress_probability_20d"] >= orig["stress_threshold"]).reindex(test.index).values
    src["praguri"]["kaggle"] = float(orig["stress_threshold"].iloc[0])
phi = pd.DataFrame(src["phi"]["values"], columns=src["phi"]["cols"], index=test.index)

# BET complet = train + închiderile BVB de după 2023; eticheta = scădere ≥5% în următoarele 20 de zile de tranzacționare
import numpy as np
bet_nou = pd.read_csv(sys.argv[4], index_col=0, parse_dates=True).iloc[:, 0] if len(sys.argv) > 4 else pd.Series(dtype=float)
bet = pd.concat([bet, bet_nou[bet_nou.index > bet.index.max()]]).sort_index()
H = 20
viit = np.column_stack([bet.shift(-h).values / bet.values - 1 for h in range(1, H + 1)])
incomplet = np.isnan(viit).any(axis=1)
y_full = pd.Series(np.where(incomplet, np.nan, (np.nan_to_num(viit, nan=0).min(axis=1) <= -0.05).astype(float)), index=bet.index)

r4 = lambda x: None if x is None or pd.isna(x) else round(float(x), 5)

# ---- matricea de confuzie (datele utilizatorului) ----
from sklearn.metrics import fbeta_score, roc_auc_score
cal = pd.date_range(bet.index.min(), max(test.index.max(), oof.index.max()))
y_cal = y_full.reindex(cal).ffill()
rata = src["rata_istorica"]

def metrici(p, y, thr):
    a = (p >= thr).astype(int)
    f2 = fbeta_score(y, a, beta=2, zero_division=0)
    auc = roc_auc_score(y, p)
    bss = 1 - np.mean((p - y) ** 2) / np.mean((rata - y) ** 2)
    return {"f2": float(f2), "auc": float(auc), "bss": float(bss), "scor": float(0.625 * f2 + 0.25 * auc + 0.125 * bss)}

CM = {}
o = oof[[MF, "y"]].dropna()
CM["train"] = {"date": [d.strftime("%Y-%m-%d") for d in o.index], "p": [float(v) for v in o[MF]], "y": [int(v) for v in o["y"]],
               "thr": src["praguri"]["alerta_f2"], "metrici": metrici(o[MF].values, o["y"].values, src["praguri"]["alerta_f2"])}
if len(sys.argv) > 3:
    yt = y_cal.reindex(orig.index)
    assert yt.notna().all(), "lipsesc etichete pe test"
    CM["test"] = {"date": [d.strftime("%Y-%m-%d") for d in orig.index], "p": [float(v) for v in orig["stress_probability_20d"]],
                  "y": [int(v) for v in yt], "thr": float(orig["stress_threshold"].iloc[0]),
                  "metrici": metrici(orig["stress_probability_20d"].values, yt.values, float(orig["stress_threshold"].iloc[0]))}
print("CM train", len(CM["train"]["date"]), CM["train"]["metrici"], "| test", len(CM.get("test", {}).get("date", [])), CM.get("test", {}).get("metrici"))

# validare: doar zilele cu BET (zile de tranzacționare)
v_idx = oof.index[oof.index.isin(bet.index) & oof[MF].notna()]
t_idx = test.index[test.index.isin(bet.index)] if len(bet_nou) else test.index[test.index.dayofweek < 5]

date = [d.strftime("%Y-%m-%d") for d in v_idx] + [d.strftime("%Y-%m-%d") for d in t_idx]
out = {
    "meta": {
        "model_final": MF,
        "best_gbm": src["best_gbm"],
        "lr_c": src["lr_c"],
        "first_test": t_idx[0].strftime("%Y-%m-%d"),
        "last_date": t_idx[-1].strftime("%Y-%m-%d"),
        "last_bet": v_idx[-1].strftime("%Y-%m-%d"),
        "n_features": len(src["features"]),
    },
    "praguri": src["praguri"],
    "rata_istorica": src["rata_istorica"],
    "comp": src["comp"],
    "scoruri_candidati": src["scoruri_candidati"],
    "features": src["features"],
    "categorii": src["phi"]["cols"],
    "phi_baza": src["phi"]["baza"],
    "ews_oof": src["ews_oof"],
    "termen_ultima_zi": src["termen_ultima_zi"],
    # matricea de confuzie, calculată ca în competiție: zile calendaristice, eticheta zilelor fără tranzacționare
    # = eticheta ultimei zile de tranzacționare (regula din train.csv)
    "cm": CM,
    # valorile variabilelor în ultima zi și cu o săptămână înainte, pentru bara derulantă
    "ticker": (lambda xt: {
        "date": xt.index[-1].strftime("%Y-%m-%d"),
        "items": [{"name": f, "value": r4(xt[f].iloc[-1]), "prev": r4(xt[f].iloc[-8]), "hist": [r4(v) for v in xt[f].values]} for f in xt.columns],
    })(pd.DataFrame(src["x_test"]["values"], columns=src["x_test"]["features"], index=pd.to_datetime(src["x_test"]["date"]))),
    "days": {
        "date": date,
        "close": [r4(bet.get(d)) for d in v_idx] + [r4(bet.get(d)) for d in t_idx],
        "prob": [r4(oof.at[d, MF]) for d in v_idx] + [r4(test.at[d, MF]) for d in t_idx],
        "gbm": [r4(oof.at[d, "gbm_tuned"]) for d in v_idx] + [r4(test.at[d, "gbm_tuned"]) for d in t_idx],
        "y": [int(oof.at[d, "y"]) for d in v_idx] + [None if pd.isna(y_full.get(d)) else int(y_full.get(d)) for d in t_idx],
        "kaggle": [None] * len(v_idx) + [r4(test.at[d, "kaggle"]) for d in t_idx],
        "kaggle_alerta": [None] * len(v_idx) + [bool(test.at[d, "kaggle_alerta"]) for d in t_idx],
        "phi": [None] * len(v_idx) + [[r4(x) for x in phi.loc[d].values] for d in t_idx],
    },
}
json.dump(out, open(dst, "w"), ensure_ascii=False, separators=(",", ":"))
print("zile validare", len(v_idx), v_idx[0].date(), "→", v_idx[-1].date(), "| zile test", len(t_idx), t_idx[0].date(), "→", t_idx[-1].date())
print("praguri", src["praguri"], "| ultima prob", out["days"]["prob"][-1], "| categorii", out["categorii"])
