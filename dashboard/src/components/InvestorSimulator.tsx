import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart } from "recharts";
import { ArrowRightLeft, Coins, PiggyBank, ShieldCheck, TrendingDown, Wallet, Sparkles, TrendingUp } from "lucide-react";
import { CONSTANTS } from "@/data/data";
import { simulate, type SimParams } from "@/lib/analytics";
import { fmtDate, fmtMonthYear, fmtNum, fmtPct, fmtRon } from "@/lib/format";
import { useCountUp } from "@/lib/hooks";
import { CardHead } from "./ui/card";
import { Segmented } from "./ui/segmented";
import { Slider } from "./ui/slider";
import { InfoTip } from "./ui/tooltip";

function Ctl({ id, label, value, children }: { id: string; label: React.ReactNode; value: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-semibold text-fg-2">{label}</label>
        <span className="mono tnum text-accent text-[13.5px]">{value}</span>
      </div>
      {children}
    </div>
  );
}

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

function ChartTip({ active, payload, kind }: { active?: boolean; payload?: { payload: Record<string, number> }[]; kind: "val" | "dd" }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const f = kind === "val" ? (v: number) => fmtRon(v) : (v: number) => fmtPct(v, 1);
  return (
    <div className="chart-tip">
      <div className="mono text-fg font-medium mb-1.5">{fmtDate(iso(p.t))}</div>
      <div className="flex justify-between gap-6"><span className="text-accent">Cu S.U.P.E.R.</span><b className="mono text-fg">{f(p.strat)}</b></div>
      <div className="flex justify-between gap-6"><span>Cumpără și ține</span><b className="mono text-fg">{f(p.bh)}</b></div>
    </div>
  );
}

export function InvestorSimulator() {
  const [p, setP] = useState<SimParams>({ amount: 100000, exposureOnAlert: 0.5, bps: 20, cashRate: 0.05, thr: CONSTANTS.PRAG_RIDICAT, period: "test" });
  const set = <K extends keyof SimParams>(k: K, v: SimParams[K]) => setP((o) => ({ ...o, [k]: v }));
  const r = useMemo(() => simulate(p), [p]);

  const step = Math.max(1, Math.ceil(r.t.length / 500));
  const val = useMemo(() => r.t.filter((_, i) => i % step === 0 || i === r.t.length - 1).map((t) => {
    const i = r.t.indexOf(t);
    return { t, bh: r.bh[i], strat: r.strat[i], ddBh: r.ddBh[i], ddStrat: r.ddStrat[i] };
  }), [r, step]);
  const avoided = useCountUp(r.avoided, 900);

  const axis = { stroke: "var(--border)", tickLine: false } as const;
  const PRESETS = [
    { k: "Prudent", d: "20% expunere de la riscul moderat", v: { exposureOnAlert: 0.2, thr: CONSTANTS.PRAG_ALERTA } },
    { k: "Echilibrat", d: "50% expunere la risc ridicat", v: { exposureOnAlert: 0.5, thr: CONSTANTS.PRAG_RIDICAT } },
    { k: "Ieșire totală", d: "0% expunere la risc ridicat", v: { exposureOnAlert: 0, thr: CONSTANTS.PRAG_RIDICAT } },
  ];
  const activePreset = PRESETS.find((x) => Math.abs(x.v.exposureOnAlert - p.exposureOnAlert) < 1e-9 && Math.abs(x.v.thr - p.thr) < 1e-9)?.k;
  const diff = r.finalStrat - r.finalBh;

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-5">
      <CardHead eyebrow="impact" icon={<PiggyBank size={24} />} title="Simulator investitor: cât protejează S.U.P.E.R.?"
        sub="Pe BET real: 2013–2023 cu predicțiile out-of-fold, 2024–2026 cu modelul final. Când alerta e aprinsă (2 zile peste prag), reduci expunerea pe BET de a doua zi; restul stă în cash cu dobândă." />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="label-up mr-1 inline-flex items-center gap-1.5"><Sparkles size={13} className="text-accent" />strategii rapide</span>
        {PRESETS.map((x) => (
          <button key={x.k} type="button" className="btn !py-1.5" aria-pressed={activePreset === x.k} onClick={() => setP((o) => ({ ...o, ...x.v }))}>
            {x.k}<span className="text-[11.5px] font-medium text-muted hidden md:inline">· {x.d}</span>
          </button>
        ))}
        <span className={`chip ml-auto mono justify-center min-w-[380px] ${diff >= 0 ? "chip-green" : "chip-red"}`}>
          {diff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {diff >= 0 ? "+" : "−"}{fmtRon(Math.abs(diff))} față de „Cumpără și ține”
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px] lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* controale */}
        <div className="rounded-[18px] border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--bg-soft)_65%,transparent)] p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="sim-amt" className="text-[13px] font-semibold text-fg-2">Sumă investită (RON)</label>
            <input id="sim-amt" className="field mono tnum" inputMode="numeric" value={fmtNum(p.amount)}
              onChange={(e) => { const v = Number(e.target.value.replace(/\D/g, "")); set("amount", Math.min(1e9, v || 0)); }} />
          </div>
          <Ctl id="sim-exp" label="Expunere la alertă" value={fmtPct(p.exposureOnAlert)}>
            <Slider id="sim-exp" label="Expunere la alertă" value={p.exposureOnAlert} min={0} max={1} step={0.05} onChange={(v) => set("exposureOnAlert", v)} valueText={fmtPct(p.exposureOnAlert)} />
          </Ctl>
          <Ctl id="sim-bps" label="Cost tranzacție" value={`${fmtNum(p.bps)} bps`}>
            <Slider id="sim-bps" label="Cost tranzacție" value={p.bps} min={0} max={100} step={1} onChange={(v) => set("bps", v)} valueText={`${p.bps} bps`} />
          </Ctl>
          <Ctl id="sim-cash" label="Dobândă cash" value={`${fmtNum(p.cashRate * 100, 1)}% / an`}>
            <Slider id="sim-cash" label="Dobândă cash" value={p.cashRate} min={0} max={0.1} step={0.0025} onChange={(v) => set("cashRate", v)} valueText={fmtPct(p.cashRate, 1)} />
          </Ctl>
          <Ctl id="sim-thr" label="Prag alertă" value={fmtPct(p.thr, 1)}>
            <Slider id="sim-thr" label="Prag alertă" value={p.thr} min={0.03} max={0.4} step={0.005} onChange={(v) => set("thr", v)} valueText={fmtPct(p.thr, 1)} />
            <div className="flex gap-1.5 flex-wrap">
              <button className="chip !text-[12px] hover:border-line-strong" aria-pressed={p.thr === CONSTANTS.PRAG_ALERTA} onClick={() => set("thr", CONSTANTS.PRAG_ALERTA)}>moderat {fmtPct(CONSTANTS.PRAG_ALERTA, 1)}</button>
              <button className="chip !text-[12px] hover:border-line-strong" aria-pressed={p.thr === CONSTANTS.PRAG_RIDICAT} onClick={() => set("thr", CONSTANTS.PRAG_RIDICAT)}>ridicat {fmtPct(CONSTANTS.PRAG_RIDICAT, 1)}</button>
            </div>
          </Ctl>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-fg-2">Perioadă</span>
            <Segmented label="Perioadă simulare" value={p.period} onChange={(v) => set("period", v)}
              options={[{ value: "test", label: "Test 2024–26" }, { value: "validare", label: "2013–2023" }, { value: "all", label: "Tot" }]} />
          </div>
        </div>

        {/* grafice */}
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-2"><span className="w-4 h-[3px] rounded-full bg-accent" />Cu S.U.P.E.R.</span>
            <span className="inline-flex items-center gap-2"><span className="w-4 h-[3px] rounded-full bg-muted" />Cumpără și ține (fără model)</span>
          </div>
          <div className="h-[250px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={val} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="simG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={fmtMonthYear} minTickGap={40} {...axis} />
                <YAxis tickFormatter={(v) => fmtNum(v / 1000, 0) + "k"} width={44} domain={["auto", "auto"]} axisLine={false} {...axis} />
                <Tooltip content={<ChartTip kind="val" />} cursor={{ stroke: "var(--border-strong)" }} />
                <Area dataKey="strat" stroke="var(--accent-2)" strokeWidth={2.4} fill="url(#simG)" dot={false} isAnimationActive={false}
                  style={{ filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent))" }} />
                <Line dataKey="bh" stroke="var(--muted)" strokeWidth={1.6} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-1 text-[12.5px] font-semibold text-fg-2">
            Drawdown <InfoTip label="drawdown"><b>Drawdown</b> este scăderea procentuală a portofoliului față de cel mai mare nivel atins anterior.</InfoTip>
          </div>
          <div className="h-[130px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={val} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={fmtMonthYear} minTickGap={40} {...axis} />
                <YAxis tickFormatter={(v) => fmtPct(v)} width={44} domain={["dataMin", 0]} axisLine={false} {...axis} />
                <Tooltip content={<ChartTip kind="dd" />} cursor={{ stroke: "var(--border-strong)" }} />
                <Area dataKey="ddBh" stroke="var(--muted)" fill="var(--muted)" fillOpacity={0.12} strokeWidth={1.4} isAnimationActive={false} />
                <Area dataKey="ddStrat" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={1.8} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* rezultate */}
        <div className="flex flex-col gap-3 lg:col-span-2 xl:col-span-1">
          <div className="rounded-[20px] p-5 flex flex-col gap-2"
            style={{
              background: "radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--green) 16%, transparent), transparent 60%), var(--green-soft)",
              border: "1.5px solid color-mix(in srgb, var(--green) 45%, transparent)",
              boxShadow: "0 0 0 6px color-mix(in srgb, var(--green) 7%, transparent), 0 24px 60px -24px color-mix(in srgb, var(--green) 45%, transparent)",
            }}>
            <div className="flex items-center gap-2 text-green font-semibold text-[13.5px]"><ShieldCheck size={18} />Pierderi evitate în episoadele de stres
              <InfoTip label="pierderi evitate">Cât ai fi pierdut în plus fără model în zilele din ferestrele de stres (zilele de stres și cele 20 de după), calculat pe valoarea portofoliului „Cumpără și ține”.</InfoTip></div>
            <div className="tnum text-[38px] leading-none font-extrabold tracking-[-0.03em] text-fg">{fmtNum(avoided)} <span className="text-[18px] text-muted font-semibold">RON</span></div>
            <div className="text-[12.5px] text-muted">diferența față de „Cumpără și ține” în zilele din ferestrele de stres</div>
          </div>
          <dl className="rounded-[18px] border border-[var(--hairline)] divide-y divide-[var(--hairline)] text-[13.5px] bg-[color-mix(in_srgb,var(--surface-2)_45%,transparent)]">
            <Stat icon={<Wallet size={15} />} k="Valoare finală" a={fmtRon(r.finalStrat)} b={fmtRon(r.finalBh)} />
            <Stat icon={<TrendingDown size={15} />} k="Max drawdown" tip="Cea mai mare scădere a portofoliului față de un vârf anterior, în perioada simulată." a={fmtPct(r.maxDdStrat, 1)} b={fmtPct(r.maxDdBh, 1)} />
            <Row icon={<Coins size={15} />} k="Cost al alarmelor false" tip="Câștigul ratat în zilele liniștite în care ai stat cu expunere redusă din cauza unei alerte, plus costurile de tranzacționare." v={fmtRon(r.falseCost)} />
            <Row icon={<ArrowRightLeft size={15} />} k="Număr tranzacții" v={fmtNum(r.trades)} />
            <Row icon={<TrendingDown size={15} />} k="Zile cu expunere redusă" v={fmtPct(r.daysOnAlert)} />
            <Row icon={<ShieldCheck size={15} />} k="Lei protejați / leu pierdut pe alarme false" tip="Pierderile evitate împărțite la costul alarmelor false. Peste 1:1, modelul a protejat mai mult decât a costat." v={isFinite(r.ratio) ? fmtNum(Math.max(0, r.ratio), 1) + " : 1" : "fără costuri"} strong />
          </dl>
        </div>
      </div>
      <p className="text-[12px] text-muted mono">Simulare pe date istorice; nu e garanție de performanță viitoare. Decizia de azi se aplică de mâine; costul se plătește la fiecare schimbare de expunere. </p>
    </div>
  );
}

function Stat({ icon, k, a, b, tip }: { icon: React.ReactNode; k: string; a: string; b: string; tip?: string }) {
  return (
    <div className="px-4 py-3 flex flex-col gap-1.5">
      <dt className="text-muted flex items-center gap-2">{icon}{k}{tip && <InfoTip label={k}>{tip}</InfoTip>}</dt>
      <dd className="grid grid-cols-2 gap-2">
        <span><span className="block text-[11.5px] text-accent font-semibold">Cu S.U.P.E.R.</span><b className="mono tnum text-fg">{a}</b></span>
        <span><span className="block text-[11.5px] text-muted font-semibold">Fără model</span><b className="mono tnum text-fg-2 font-medium">{b}</b></span>
      </dd>
    </div>
  );
}
function Row({ icon, k, v, strong, tip }: { icon: React.ReactNode; k: string; v: string; strong?: boolean; tip?: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <dt className="text-muted flex items-center gap-2 min-w-0">{icon}<span>{k}</span>{tip && <InfoTip label={k}>{tip}</InfoTip>}</dt>
      <dd className={`mono tnum text-right whitespace-nowrap ${strong ? "text-green font-semibold" : "text-fg"}`}>{v}</dd>
    </div>
  );
}
