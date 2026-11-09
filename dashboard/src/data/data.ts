/* =====================================================================
 * S.U.P.E.R. · BET EWS — DATELE REALE ALE MODELULUI
 * ---------------------------------------------------------------------
 * Singura sursă de date a interfeței. `realData.json` e generat din
 * notebook-ul MODEL_FINAL.ipynb (celula de export) cu `scripts/to_dashboard.py`.
 * Pentru o versiune nouă a modelului: rulezi notebook-ul, regenerezi JSON-ul,
 * iar interfața se actualizează singură.
 *
 *   2013–2023  validare walk-forward (predicții out-of-fold) + BET real + eticheta reală
 *   2024–2026  perioada de test: probabilitatea brută a modelului final + BET de la BVB + eticheta calculată din BET
 * ===================================================================== */
import raw from "./realData.json";

export type Split = "validare" | "test";

export interface DayPoint {
  date: string;
  t: number;
  /** închiderea BET (train.csv până în 2023, BVB din 2024) */
  bet_close: number | null;
  /** probabilitatea brută a modelului final (stacking) */
  prob: number;
  /** LightGBM singur (pentru comparații) */
  gbm: number;
  /** 1 = urmează o scădere ≥5% în următoarele 20 zile de tranzacționare */
  y_true: 0 | 1 | null;
  split: Split;
  /** probabilitatea trimisă pe Kaggle (după stratul de decizie); doar în test */
  kaggle: number | null;
  kaggle_alerta: boolean | null;
}

export interface CmData {
  date: string[]; p: number[]; y: (0 | 1)[];
  /** pragul oficial al setului */
  thr: number;
  metrici: { f2: number; auc: number; bss: number; scor: number };
}

interface Raw {
  meta: { model_final: string; best_gbm: Record<string, number>; lr_c: number; first_test: string; last_date: string; last_bet: string; n_features: number };
  praguri: { alerta_f2: number; ridicat: number; kaggle: number; regula: number };
  rata_istorica: number;
  comp: Record<string, { scor: number; F2: number; AUC: number; BSS: number; Brier: number; prag_F2: number; logloss: number }>;
  scoruri_candidati: Record<string, number>;
  features: { name: string; cat: string }[];
  categorii: string[];
  phi_baza: number;
  ews_oof: { episoade: number; prinse: number; avans_median_zile_cal: number; debuturi: string[]; avans: (number | null)[] };
  termen_ultima_zi: { data: string; p: number[] };
  cm: Record<"train" | "test", CmData>;
  ticker: { date: string; items: { name: string; value: number | null; prev: number | null; hist: (number | null)[] }[] };
  days: {
    date: string[]; close: (number | null)[]; prob: number[]; gbm: number[]; y: (0 | 1 | null)[];
    kaggle: (number | null)[]; kaggle_alerta: (boolean | null)[]; phi: (number[] | null)[];
  };
}
const R = raw as unknown as Raw;
const D = R.days;
const firstTest = R.meta.first_test;

export const series: DayPoint[] = D.date.map((date, i) => ({
  date,
  t: Date.parse(date + "T00:00:00Z"),
  bet_close: D.close[i],
  prob: D.prob[i],
  gbm: D.gbm[i],
  y_true: D.y[i],
  split: date >= firstTest ? "test" : "validare",
  kaggle: D.kaggle[i],
  kaggle_alerta: D.kaggle_alerta[i],
}));

/** Contribuțiile Shapley exacte pe categorii (puncte de probabilitate); null în validare. */
export const contributions: (number[] | null)[] = D.phi;

export const CATEGORIES = R.categorii.map((label, k) => ({ key: `c${k}`, label }));

export const CONSTANTS = {
  /** pragul F2 optim pe validare: de aici începe riscul „moderat” și alerta */
  PRAG_ALERTA: R.praguri.alerta_f2,
  /** risc „ridicat”: zilele de peste au fost de stres de ≥2× mai des decât media */
  PRAG_RIDICAT: R.praguri.ridicat,
  /** pragul probabilităților transformate trimise pe Kaggle */
  PRAG_KAGGLE: R.praguri.kaggle,
  NIVEL_MODERAT: R.praguri.alerta_f2,
  NIVEL_RIDICAT: R.praguri.ridicat,
  /** valoarea de bază Shapley: media modelului pe fundal */
  BAZA: R.phi_baza,
  RATA_ISTORICA: R.rata_istorica,
  ORIZONT_ZILE: 20,
  ZILE_CONFIRMARE: 2,
  PRAG_SCADERE: 0.05,
  FIRST_TEST: firstTest,
} as const;

const mf = R.comp[R.meta.model_final];
const cst = R.comp["constant"];
export const METRICS = {
  model: { f2: mf.F2, auc: mf.AUC, bss: mf.BSS, scor: mf.scor },
  baseline: { f2: cst.F2, auc: cst.AUC, bss: cst.BSS, scor: cst.scor },
  /** toate modelele comparate în notebook (validare 2013–2023) */
  toate: R.comp,
} as const;

export const META = {
  isDemo: false,
  lastDate: R.meta.last_date,
  lastBetDate: R.meta.last_bet,
  modelFinal: R.meta.model_final,
  modelVersion: "MODEL_FINAL · " + R.meta.model_final,
  modelFrozen: true,
  nFeatures: R.meta.n_features,
  features: R.features,
  ewsNotebook: R.ews_oof,
  termen: R.termen_ultima_zi,
} as const;

/**
 * Datele matricei de confuzie, calculate ca în competiție (toate zilele calendaristice; zilele fără tranzacționare
 * preiau eticheta ultimei zile de tranzacționare, ca în train.csv):
 *   train = etichetele din train.csv 2013–2023 + predicțiile out-of-fold ale notebook-ului, prag F2 0,055
 *   test  = submisia trimisă pe Kaggle (S.U.P.E.R_BET.csv) cu pragul ei + etichetele din BET-ul BVB
 */
export const CM = R.cm;

/** Valorile variabilelor modelului în ultima zi și cu o săptămână înainte (bara derulantă). */
export const TICKER = R.ticker;
