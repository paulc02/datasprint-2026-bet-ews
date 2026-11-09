import { useEffect, useMemo, useState } from "react";
import { Area, Brush, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { LineChart as LineIcon } from "lucide-react";
import { series, CONSTANTS } from "@/data/data";
import { confirmedAlerts, stressBlocks } from "@/lib/analytics";
import { fmtDate, fmtMonthYear, fmtNum, fmtPct } from "@/lib/format";
import { CardHead } from "./ui/card";
import { Segmented } from "./ui/segmented";
import { InfoTip } from "./ui/tooltip";

const STEP = 2;
interface Pt { t: number; date: string; close: number | null; prob: number; alert: number | null; alertY: number | null; y: 0 | 1 | null; split: string }

/* Marcaj = ziua în care alerta de risc ridicat se confirmă (2 zile de tranzacționare peste prag). */
const RIDICAT = confirmedAlerts(CONSTANTS.PRAG_RIDICAT);
const data: Pt[] = (() => {
  const out: Pt[] = [];
  for (let i = 0; i < series.length; i += STEP) {
    const j = Math.min(i + STEP - 1, series.length - 1);
    let alert = false;
    for (let k = i; k <= j; k++) if (RIDICAT[k] && (k === 0 || !RIDICAT[k - 1])) alert = true;
    const d = series[j];
    out.push({ t: d.t, date: d.date, close: d.bet_close, prob: d.prob, alert: alert ? 1 : null, alertY: alert ? CONSTANTS.PRAG_RIDICAT : null, y: d.y_true, split: d.split });
  }
  return out;
})();
const P_TOP = Math.ceil(Math.max(...series.map((d) => d.prob)) * 10) / 10;
const blocks = stressBlocks().map(([s, e]) => [series[s].t, series[Math.min(e + 1, series.length - 1)].t] as const);
const testStart = series.find((d) => d.split === "test")!.t;
const N = data.length;
const idxAt = (t: number) => { const i = data.findIndex((d) => d.t >= t); return i < 0 ? N - 1 : i; };

type Range = "1A" | "3A" | "5A" | "Tot";
const rangeFor = (r: Range): [number, number] => {
  if (r === "Tot") return [0, N - 1];
  const yrs = r === "1A" ? 1 : r === "3A" ? 3 : 5;
  return [Math.max(0, N - 1 - Math.round((252 * yrs) / STEP)), N - 1];
};

function Tri(props: { cx?: number; cy?: number; payload?: Pt }) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload || payload.alert == null) return <g />;
  return <path d={`M ${cx} ${cy - 3} l 6 -10 h -12 z`} fill="var(--red)" stroke="var(--surface)" strokeWidth={1.2} />;
}

function Tip({ active, payload }: { active?: boolean; payload?: { payload: Pt }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="mono text-fg font-medium mb-1.5">{fmtDate(p.date)}</div>
      <div className="flex justify-between gap-6"><span>BET</span><b className="mono text-fg">{p.close != null ? fmtNum(p.close, 0) : "—"}</b></div>
      <div className="flex justify-between gap-6"><span>Risc estimat</span><b className="mono text-accent">{fmtPct(p.prob, 1)}</b></div>
      {p.y === 1 && <div className="mt-1.5 text-red font-semibold">● fereastră de stres</div>}
      {p.alert != null && <div className="mt-0.5 text-red font-semibold">▼ intrare în risc ridicat</div>}
      <div className="mt-1.5 text-muted">{p.split === "test" ? "test · modelul final" : "validare · out-of-fold"}</div>
    </div>
  );
}

export function HistoryChart({ zoom, cursorIdx }: { zoom: { from: number; to: number; n: number } | null; cursorIdx: number | null }) {
  const [range, setRange] = useState<Range | null>("Tot");
  const [win, setWin] = useState<[number, number]>(rangeFor("Tot"));
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!zoom) return;
    setWin([Math.max(0, idxAt(zoom.from)), Math.min(N - 1, idxAt(zoom.to))]);
    setRange(null);
    setRev((r) => r + 1);
  }, [zoom]);

  const pick = (r: Range) => { setRange(r); setWin(rangeFor(r)); setRev((x) => x + 1); };
  const visibleYears = useMemo(() => (data[win[1]].t - data[win[0]].t) / 3.15576e10, [win]);
  /* statistici pentru fereastra vizibilă */
  const stats = useMemo(() => {
    const t0 = data[win[0]].t, t1 = data[win[1]].t;
    const a = series.findIndex((d) => d.t >= t0);
    let b = series.length - 1; while (b > 0 && series[b].t > t1) b--;
    let sum = 0, max = 0, maxI = a, stress = 0, lab = 0, high = 0;
    let c0: number | null = null, c1: number | null = null;
    for (let i = a; i <= b; i++) {
      const d = series[i];
      sum += d.prob; if (d.prob > max) { max = d.prob; maxI = i; }
      if (d.y_true !== null) { lab++; stress += d.y_true; }
      if (RIDICAT[i] && (i === 0 || !RIDICAT[i - 1])) high++;
      if (d.bet_close != null) { if (c0 == null) c0 = d.bet_close; c1 = d.bet_close; }
    }
    return { avg: sum / Math.max(1, b - a + 1), max, maxDate: series[maxI].date, stressShare: lab ? stress / lab : 0, high, ret: c0 && c1 ? c1 / c0 - 1 : 0 };
  }, [win]);

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-4">
      <CardHead eyebrow="istoric" icon={<LineIcon size={24} />} title="Istoric: BET și riscul estimat"
        sub="Riscul estimat și BET-ul real. 2013–2023: predicții out-of-fold din validarea walk-forward; 2024–2026: modelul final pe perioada de test. Benzile roșii sunt zilele de stres reale (scădere ≥5% în următoarele 20 de zile)."
        right={<Segmented label="Perioadă grafic" value={(range ?? "") as Range} onChange={pick}
          options={[{ value: "1A", label: "1A" }, { value: "3A", label: "3A" }, { value: "5A", label: "5A" }, { value: "Tot", label: "Tot" }]} />} />

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-2"><span className="w-4 h-[2px] bg-fg-2" />Indicele BET (stânga)</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 h-3 rounded-sm" style={{ background: "linear-gradient(var(--accent), transparent)" }} />Risc estimat (dreapta)</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 h-3 rounded-sm" style={{ background: "var(--red-soft)", border: "1px solid color-mix(in srgb, var(--red) 40%, transparent)" }} />Fereastră de stres</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--amber)" }} />Moderat ≥ {fmtNum(CONSTANTS.PRAG_ALERTA * 100, 1)}%</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: "var(--red)" }} />Ridicat ≥ {fmtNum(CONSTANTS.PRAG_RIDICAT * 100, 1)}%</span>
        <span className="inline-flex items-center gap-2"><span style={{ color: "var(--red)" }}>▼</span>Intrare în risc ridicat</span>
        <span className="mono ml-auto">{fmtNum(visibleYears, 1)} ani afișați · trage de mânerele de jos pentru zoom</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {[
          { k: "Risc mediu", v: fmtPct(stats.avg, 1), sub: "în perioada afișată", c: "var(--accent-2)", tip: "Media probabilității estimate de model în zilele din fereastra vizibilă a graficului." },
          { k: "Risc maxim", v: fmtPct(stats.max, 1), sub: fmtDate(stats.maxDate), c: "var(--red)", tip: "Cea mai mare probabilitate estimată în fereastra vizibilă și ziua în care a apărut." },
          { k: "Zile de stres", v: fmtPct(stats.stressShare, 1), sub: "din zilele cu etichetă", c: "var(--amber)", tip: "Ce parte din zile au fost urmate de o scădere a BET de cel puțin 5% în următoarele 20 de zile de tranzacționare." },
          { k: "Intrări în risc ridicat", v: fmtNum(stats.high), sub: "triunghiuri pe grafic", c: "var(--red)", tip: "De câte ori riscul a trecut peste pragul de risc ridicat și a stat acolo cel puțin două zile la rând." },
          { k: "Randament BET", v: (stats.ret >= 0 ? "+" : "") + fmtPct(stats.ret, 1), sub: "prima vs. ultima zi", c: stats.ret >= 0 ? "var(--green)" : "var(--red)", tip: "Variația indicelui BET între prima și ultima zi a ferestrei vizibile." },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-[var(--hairline)] px-3.5 py-2.5 bg-[color-mix(in_srgb,var(--surface-2)_55%,transparent)] hover-lift">
            <div className="label-up !text-[10.5px] flex items-center gap-1">{s.k}<InfoTip label={s.k}>{s.tip}</InfoTip></div>
            <div className="tnum text-[20px] font-bold tracking-[-0.02em]" style={{ color: s.c }}>{s.v}</div>
            {s.sub && <div className="mono text-[11px] text-muted">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="h-[360px] sm:h-[420px] -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart key={rev} data={data} margin={{ top: 22, right: 6, bottom: 0, left: 6 }}>
            <defs>
              <linearGradient id="gradProb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradBet" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--muted)" />
                <stop offset="100%" stopColor="var(--text)" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <ReferenceArea yAxisId="p" x1={data[0].t} x2={testStart} fill="var(--muted)" fillOpacity={0.06} ifOverflow="hidden"
              label={{ value: "validare walk-forward (out-of-fold)", position: "insideTopLeft", fill: "var(--muted)", fontSize: 11, className: "mono" }} />
            <ReferenceArea yAxisId="p" x1={testStart} x2={data[N - 1].t} fill="var(--accent)" fillOpacity={0.035} ifOverflow="hidden"
              label={{ value: "test · model final", position: "insideTopLeft", fill: "var(--accent)", fontSize: 11, className: "mono" }} />
            {blocks.map(([a, b], i) => (
              <ReferenceArea key={i} yAxisId="p" x1={a} x2={b} fill="var(--red)" fillOpacity={0.16} ifOverflow="hidden" />
            ))}
            <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={fmtMonthYear}
              stroke="var(--border)" tickLine={false} minTickGap={36} />
            <YAxis yAxisId="l" orientation="left" domain={["auto", "auto"]} tickFormatter={(v) => fmtNum(v, 0)} width={58}
              stroke="var(--border)" tickLine={false} axisLine={false} />
            <YAxis yAxisId="p" orientation="right" domain={[0, P_TOP]} ticks={Array.from({ length: Math.round(P_TOP * 10) + 1 }, (_, k) => k / 10)} tickFormatter={(v) => fmtPct(v)} width={44}
              stroke="var(--border)" tickLine={false} axisLine={false} />
            <Area yAxisId="p" type="monotone" dataKey="prob" stroke="var(--accent)" strokeWidth={1.6} fill="url(#gradProb)"
              isAnimationActive={false} dot={false} activeDot={{ r: 4, fill: "var(--accent)" }} />
            <Line yAxisId="l" type="monotone" dataKey="close" stroke="url(#gradBet)" strokeWidth={1.8} dot={false} connectNulls={false}
              isAnimationActive={false} activeDot={{ r: 4, fill: "var(--text)" }} />
            <ReferenceLine yAxisId="p" y={CONSTANTS.PRAG_ALERTA} stroke="var(--amber)" strokeDasharray="3 5" strokeWidth={1.3} />
            <ReferenceLine yAxisId="p" y={CONSTANTS.PRAG_RIDICAT} stroke="var(--red)" strokeDasharray="3 5" strokeWidth={1.4} />
            <Scatter yAxisId="p" dataKey="alertY" shape={<Tri />} isAnimationActive={false} legendType="none" />
            {cursorIdx !== null && (
              <ReferenceLine yAxisId="p" x={series[cursorIdx].t} stroke="var(--accent-2)" strokeWidth={2} ifOverflow="hidden"
                label={{ value: "mașina timpului", position: "insideTopRight", fill: "var(--accent-2)", fontSize: 11, className: "mono" }} />
            )}
            <Tooltip content={<Tip />} cursor={{ stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "3 3" }} />
            <Brush dataKey="t" height={34} travellerWidth={10} stroke="var(--accent)" fill="var(--bg-soft)"
              startIndex={win[0]} endIndex={win[1]} tickFormatter={(t) => fmtMonthYear(t as number)}
              onChange={(e: { startIndex?: number; endIndex?: number }) => {
                if (e.startIndex == null || e.endIndex == null) return;
                setWin([e.startIndex, e.endIndex]); setRange(null);
              }}>
              <ComposedChart data={data}>
                <YAxis hide domain={["auto", "auto"]} />
                <Area dataKey="prob" stroke="var(--accent)" fill="var(--accent-soft)" isAnimationActive={false} dot={false} />
              </ComposedChart>
            </Brush>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
