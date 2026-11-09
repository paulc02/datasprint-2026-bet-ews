import { useMemo } from "react";
import { TICKER, META } from "@/data/data";
import { FEATURE_LABELS, type FeatureKind } from "@/data/featureLabels";
import { fmtDate, fmtNum } from "@/lib/format";

const fmtVal = (v: number, kind: FeatureKind) => {
  if (kind === "pct") return (v > 0 ? "+" : "") + fmtNum(v * 100, 1) + "%";
  if (kind === "z") return (v > 0 ? "+" : "") + fmtNum(v, 2) + "σ";
  if (kind === "rsi") return fmtNum(v, 1);
  return (v > 0 ? "+" : "") + fmtNum(v, 2);
};
const fmtDelta = (d: number, kind: FeatureKind) => {
  if (kind === "pct") return fmtNum(Math.abs(d) * 100, 1) + " pp";
  if (kind === "z") return fmtNum(Math.abs(d), 2) + "σ";
  return fmtNum(Math.abs(d), kind === "rsi" ? 1 : 2);
};
/** Mini-grafic pe ultimele ~40 de zile pentru fiecare variabilă. */
function Spark({ h, dir }: { h: (number | null)[]; dir: number }) {
  const v = h.filter((x): x is number => x != null);
  if (v.length < 2) return null;
  const W = 54, H = 18, lo = Math.min(...v), hi = Math.max(...v), span = hi - lo || 1;
  const d = v.map((x, i) => `${i ? "L" : "M"}${((i / (v.length - 1)) * W).toFixed(1)},${(H - ((x - lo) / span) * H).toFixed(1)}`).join("");
  const c = dir > 0 ? "var(--green)" : dir < 0 ? "var(--red)" : "var(--muted)";
  return (
    <svg width={W} height={H + 2} viewBox={`0 -1 ${W} ${H + 2}`} aria-hidden className="flex-none">
      <path d={d} fill="none" stroke={c} strokeWidth={1.4} strokeLinejoin="round" opacity={0.9} />
      <circle cx={W} cy={H - ((v[v.length - 1] - lo) / span) * H} r={2} fill={c} />
    </svg>
  );
}

const catOf = (name: string) => META.features.find((f) => f.name === name)?.cat ?? "";

/** Bandă derulantă în stil bursier cu cele 25 de variabile ale modelului: valoarea din ultima zi și variația pe o săptămână. */
export function Ticker() {
  const items = useMemo(() => TICKER.items.filter((it) => it.value != null).map((it) => {
    const meta = FEATURE_LABELS[it.name] ?? { label: it.name, kind: "num" as FeatureKind };
    const d = it.prev != null ? (it.value as number) - it.prev : 0;
    const eps = meta.kind === "pct" ? 0.0005 : 0.005;
    const dir = Math.abs(d) < eps ? 0 : d > 0 ? 1 : -1;
    return { ...it, ...meta, d, dir, cat: catOf(it.name) };
  }), []);

  const row = (hidden: boolean) => (
    <ul className="ticker-row" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <li key={it.name} className="ticker-item" title={`${it.name} · ${it.cat}`}>
          <span className="ticker-name">{it.label}</span>
          <Spark h={it.hist} dir={it.dir} />
          <span className="ticker-val mono tnum">{fmtVal(it.value as number, it.kind)}</span>
          <span className={`ticker-chg mono tnum ${it.dir > 0 ? "up" : it.dir < 0 ? "down" : "flat"}`}>
            {it.dir > 0 ? "▲" : it.dir < 0 ? "▼" : "■"} {it.dir === 0 ? "neschimbat" : fmtDelta(it.d, it.kind)}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="ticker rise" aria-label={`Variabilele modelului la ${fmtDate(TICKER.date)}, variație față de săptămâna anterioară`}>
      <div className="ticker-label">
        <span className="ticker-live" aria-hidden />
        <span className="leading-tight">
          <span className="block font-bold text-[13px] tracking-[-0.01em]">Variabilele modelului</span>
          <span className="block mono text-[11.5px] text-muted">{fmtDate(TICKER.date)} · vs. săpt. trecută</span>
        </span>
      </div>
      <div className="ticker-viewport">
        <div className="ticker-track">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
