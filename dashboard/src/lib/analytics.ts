// Calcule în frontend, toate pornind din `series` (data.ts).
import { series, CONSTANTS, CM, type DayPoint } from "@/data/data";

export type Period = "validare" | "v1319" | "v2023" | "test" | "all";
export type CmSet = "train" | "test" | "combinat";

const N = series.length;
const FT = series.findIndex((d) => d.split === "test");
const idxYear = (y: number) => { const i = series.findIndex((d) => d.date >= `${y}-01-01`); return i < 0 ? N : i; };

export function periodRange(p: Period): [number, number] {
  if (p === "validare") return [0, FT - 1];
  if (p === "v1319") return [0, idxYear(2020) - 1];
  if (p === "v2023") return [idxYear(2020), FT - 1];
  if (p === "test") return [FT, N - 1];
  return [0, N - 1];
}

const DAY = 86400000;

/* ------------------ alertă confirmată (regula din notebook) ------------------ */
/** Alertă = probabilitatea peste prag în ultimele `k` zile de tranzacționare consecutive. */
export function confirmedAlerts(thr: number, k: number = CONSTANTS.ZILE_CONFIRMARE): Uint8Array {
  const out = new Uint8Array(N);
  let run = 0;
  for (let i = 0; i < N; i++) {
    run = series[i].prob >= thr ? run + 1 : 0;
    out[i] = run >= k ? 1 : 0;
  }
  return out;
}

/* ------------------ matrice de confuzie (pe zile) ------------------ */
export interface Confusion {
  tp: number; fp: number; fn: number; tn: number; n: number;
  precision: number; recall: number; f2: number;
  /** (stres prins + liniște corectă) / toate zilele */
  accuracy: number;
}
function cmFrom(pairs: Iterable<[number, 0 | 1]>, thr: number): Confusion {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const [p, y] of pairs) {
    const alert = p >= thr;
    if (alert && y === 1) tp++;
    else if (alert) fp++;
    else if (y === 1) fn++;
    else tn++;
  }
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f2 = precision + recall ? (5 * precision * recall) / (4 * precision + recall) : 0;
  const n = tp + fp + fn + tn;
  return { tp, fp, fn, tn, n, precision, recall, f2, accuracy: n ? (tp + tn) / n : 0 };
}

/** Matricea de confuzie pe datele din CM; fiecare set cu pragul lui (combinat = fiecare parte cu pragul oficial). */
export function confusionSet(set: CmSet, thr?: number): Confusion {
  if (set === "combinat") {
    const a = confusionSet("train"), b = confusionSet("test");
    const tp = a.tp + b.tp, fp = a.fp + b.fp, fn = a.fn + b.fn, tn = a.tn + b.tn;
    const precision = tp + fp ? tp / (tp + fp) : 0, recall = tp + fn ? tp / (tp + fn) : 0;
    const n = tp + fp + fn + tn;
    return { tp, fp, fn, tn, n, precision, recall, f2: precision + recall ? (5 * precision * recall) / (4 * precision + recall) : 0, accuracy: n ? (tp + tn) / n : 0 };
  }
  const d = CM[set];
  const t = thr ?? d.thr;
  const pairs: [number, 0 | 1][] = d.p.map((p, i) => [p, d.y[i]]);
  return cmFrom(pairs, t);
}

/** Pe zilele din `series` (validare = out-of-fold, test = model final). */
export function confusion(period: Period, thr: number): Confusion {
  const [a, b] = periodRange(period);
  const pairs: [number, 0 | 1][] = [];
  for (let i = a; i <= b; i++) { const y = series[i].y_true; if (y !== null) pairs.push([series[i].prob, y]); }
  return cmFrom(pairs, thr);
}

/* ------------------ episoade de stres ------------------ */
/** Blocuri continue de zile cu y_true = 1. */
export function stressBlocks(a = 0, b = N - 1): [number, number][] {
  const out: [number, number][] = [];
  let s = -1;
  for (let i = a; i <= b + 1; i++) {
    const on = i <= b && series[i].y_true === 1;
    if (on && s < 0) s = i;
    if (!on && s >= 0) { out.push([s, i - 1]); s = -1; }
  }
  return out;
}

export interface Episode {
  startIdx: number; // debutul: prima zi de stres după ≥60 de zile calendaristice calme
  endIdx: number; // ultima zi de stres a episodului
  troughIdx: number;
  maxDrop: number; // negativ, față de închiderea din ziua debutului
  firstAlertIdx: number | null;
  lead: number | null; // zile calendaristice între prima alertă (în cele 30 dinainte) și debut
  caught: boolean;
  days: number; // zile de stres în episod
}

/**
 * Episoade ca în notebook: un episod începe cu o zi de stres precedată de ≥60 de zile calendaristice fără stres;
 * blocurile mai apropiate se unesc în același episod. „Prins” = alertă confirmată activă în cele 30 de zile
 * calendaristice dinainte sau în ziua debutului.
 */
export function episodes(period: Period, thr: number): Episode[] {
  const [a, b] = periodRange(period);
  const alerts = confirmedAlerts(thr);
  const blocks = stressBlocks(0, N - 1);
  const eps: { s: number; e: number; days: number }[] = [];
  let prevEnd = -1;
  for (const [s, e] of blocks) {
    const calm = prevEnd < 0 || series[s].t - series[prevEnd].t > 60 * DAY;
    if (calm) eps.push({ s, e, days: e - s + 1 });
    else { eps[eps.length - 1].e = e; eps[eps.length - 1].days += e - s + 1; }
    prevEnd = e;
  }
  return eps.filter((x) => x.s >= a && x.s <= b && (x.s > 0 && series[x.s].t - series[0].t > 60 * DAY)).map(({ s, e, days }) => {
    let troughIdx = s;
    for (let i = s; i <= Math.min(e + CONSTANTS.ORIZONT_ZILE, N - 1); i++) {
      const c = series[i].bet_close;
      if (c != null && c < (series[troughIdx].bet_close ?? Infinity)) troughIdx = i;
    }
    const c0 = series[s].bet_close ?? 0;
    const maxDrop = c0 ? (series[troughIdx].bet_close ?? c0) / c0 - 1 : 0;
    let firstAlertIdx: number | null = null;
    for (let i = s; i >= 0 && series[s].t - series[i].t <= 30 * DAY; i--) if (alerts[i]) firstAlertIdx = i;
    const lead = firstAlertIdx === null ? null : Math.round((series[s].t - series[firstAlertIdx].t) / DAY);
    return { startIdx: s, endIdx: e, troughIdx, maxDrop, firstAlertIdx, lead, caught: firstAlertIdx !== null, days };
  });
}

/* ------------------ alerte (perioade continue de alertă confirmată) ------------------ */
export interface AlertRun { startIdx: number; endIdx: number; peak: number; isFalse: boolean; open: boolean }
export function alertRuns(a: number, b: number, thr: number): AlertRun[] {
  const al = confirmedAlerts(thr);
  const out: AlertRun[] = [];
  let s = -1, peak = 0;
  for (let i = a; i <= b + 1; i++) {
    const on = i <= b && al[i] === 1;
    if (on) { if (s < 0) { s = i; peak = 0; } peak = Math.max(peak, series[i].prob); }
    if (!on && s >= 0) {
      const e = i - 1;
      let hit = false, unknown = false;
      for (let j = s; j <= Math.min(e + CONSTANTS.ORIZONT_ZILE, N - 1); j++) {
        if (series[j].y_true === 1) { hit = true; break; }
        if (series[j].y_true === null) unknown = true;
      }
      out.push({ startIdx: s, endIdx: e, peak, isFalse: !hit && !unknown, open: !hit && unknown });
      s = -1;
    }
  }
  return out;
}

export function share(a: number, b: number, thr: number) {
  const al = confirmedAlerts(thr);
  let k = 0;
  for (let i = a; i <= b; i++) k += al[i];
  return k / (b - a + 1);
}

export function yearsIn(a: number, b: number) {
  return (series[b].t - series[a].t) / (365.25 * DAY);
}

export function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((p, q) => p - q);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function riskLevel(p: number): "scazut" | "moderat" | "ridicat" {
  if (p >= CONSTANTS.NIVEL_RIDICAT) return "ridicat";
  if (p >= CONSTANTS.NIVEL_MODERAT) return "moderat";
  return "scazut";
}

/** Precizia istorică (validare) peste un prag: cât de des a urmat stresul. */
export function precisionAbove(thr: number, period: Period = "validare") {
  const [a, b] = periodRange(period);
  let n = 0, k = 0, all = 0, allK = 0;
  for (let i = a; i <= b; i++) {
    const y = series[i].y_true;
    if (y === null) continue;
    all++; allK += y;
    if (series[i].prob >= thr) { n++; k += y; }
  }
  return { precision: n ? k / n : 0, base: all ? allK / all : 0, n };
}

/* ------------------ simulator investitor ------------------ */
export interface SimParams {
  amount: number; exposureOnAlert: number; bps: number; cashRate: number; thr: number; period: Period;
}
export interface SimResult {
  t: number[]; bh: number[]; strat: number[]; ddBh: number[]; ddStrat: number[];
  finalBh: number; finalStrat: number; maxDdBh: number; maxDdStrat: number;
  avoided: number; falseCost: number; trades: number; ratio: number; daysOnAlert: number;
}
/** Decizia din ziua t se aplică din ziua t+1. */
export function simulate(p: SimParams): SimResult {
  const [a, b] = periodRange(p.period);
  const al = confirmedAlerts(p.thr);
  const inStress = new Uint8Array(N);
  stressBlocks(0, N - 1).forEach(([s, e]) => {
    for (let i = s; i <= Math.min(e + CONSTANTS.ORIZONT_ZILE, N - 1); i++) inStress[i] = 1;
  });
  const t: number[] = [series[a].t];
  const bh = [p.amount], strat = [p.amount];
  let expPrev = 1, trades = 0, avoided = 0, falseCost = 0, onAlert = 0;
  for (let i = a + 1; i <= b; i++) {
    const c1 = series[i].bet_close, c0 = series[i - 1].bet_close;
    if (c1 == null || c0 == null) continue;
    const r = c1 / c0 - 1;
    const exp = al[i - 1] ? p.exposureOnAlert : 1;
    if (al[i - 1]) onAlert++;
    const cost = (p.bps / 10000) * Math.abs(exp - expPrev);
    if (exp !== expPrev) trades++;
    const gap = Math.max(1, Math.round((series[i].t - series[i - 1].t) / DAY));
    const rs = exp * r + (1 - exp) * (p.cashRate / 365) * gap - cost;
    const vb = bh[bh.length - 1], vs = strat[strat.length - 1];
    const diff = (rs - r) * vb;
    if (inStress[i]) avoided += diff; else falseCost -= diff;
    bh.push(vb * (1 + r));
    strat.push(vs * (1 + rs));
    t.push(series[i].t);
    expPrev = exp;
  }
  const dd = (v: number[]) => { let pk = -Infinity; return v.map((x) => { pk = Math.max(pk, x); return x / pk - 1; }); };
  const ddBh = dd(bh), ddStrat = dd(strat);
  return {
    t, bh, strat, ddBh, ddStrat,
    finalBh: bh[bh.length - 1], finalStrat: strat[strat.length - 1],
    maxDdBh: Math.min(...ddBh), maxDdStrat: Math.min(...ddStrat),
    avoided, falseCost: Math.max(0, falseCost), trades,
    ratio: falseCost > 0 ? avoided / falseCost : Infinity,
    daysOnAlert: onAlert / Math.max(1, t.length - 1),
  };
}

export type { DayPoint };
