import { useState } from "react";
import { ArrowDown, ArrowUp, History, Layers, MousePointer2 } from "lucide-react";
import { series, contributions, CATEGORIES, CONSTANTS, META } from "@/data/data";
import { FEATURE_LABELS } from "@/data/featureLabels";
import { riskLevel } from "@/lib/analytics";
import { fmtNum, fmtPct } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { InfoTip } from "./ui/tooltip";

const LVL = { scazut: "var(--green)", moderat: "var(--amber)", ridicat: "var(--red)" } as const;
const dmy = (iso: string) => iso.split("-").reverse().join(".");

/** Cascadă Shapley: de la valoarea de bază, fiecare categorie urcă sau coboară riscul până la probabilitatea zilei. */
export function ContributionBars({ idx }: { idx: number }) {
  const mounted = useMounted(250);
  const [hover, setHover] = useState<string | null>(null);
  const c = contributions[idx];
  if (!c) return <Empty idx={idx} />;

  const p = series[idx].prob;
  const rows = CATEGORIES.map((cat, k) => ({ ...cat, v: c[k] })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  let cum = CONSTANTS.BAZA;
  const steps = rows.map((r) => { const from = cum; cum += r.v; return { ...r, from, to: cum }; });
  const xMax = Math.max(CONSTANTS.BAZA, p, ...steps.map((s) => Math.max(s.from, s.to))) * 1.12;
  const pos = (x: number) => `${(Math.max(0, x) / xMax) * 100}%`;
  const total = c.reduce((a, b) => a + b, 0);
  const isToday = idx === series.length - 1;
  const varsOf = (label: string) => META.features.filter((f) => f.cat === label);

  const Bar = ({ from, to, color, glow }: { from: number; to: number; color: string; glow?: boolean }) => (
    <div className="absolute inset-y-[4px] rounded-[7px]"
      style={{
        left: pos(Math.min(from, to)), width: mounted ? `${(Math.abs(to - from) / xMax) * 100}%` : "0%",
        minWidth: 2, background: color, boxShadow: glow ? `0 0 16px ${color}` : undefined,
        transition: "width .9s cubic-bezier(.2,.7,.2,1), left .6s cubic-bezier(.2,.7,.2,1)",
      }} />
  );

  return (
    <div className="flex flex-col h-full gap-4 p-5 sm:p-6">
      <header className="flex items-start gap-3.5">
        <div className="icon-box ib-acc"><Layers size={24} /></div>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">explicabilitate</div>
          <h2 className="card-title">{isToday ? "De ce e riscul așa azi" : `De ce era riscul așa pe ${dmy(series[idx].date)}`}</h2>
          <p className="card-sub">
            cascadă Shapley exactă pe categorii, modelul final{" "}
            <InfoTip label="SHAP"><b>Valorile Shapley</b> împart probabilitatea zilei între categoriile de variabile: pornind de la valoarea de bază a modelului, fiecare categorie adaugă sau scade puncte procentuale. Se adună exact la probabilitatea zilei.</InfoTip>
          </p>
        </div>
      </header>

      <div className="flex items-center justify-between text-[12px] text-muted mono">
        <span className="inline-flex items-center gap-1"><ArrowDown size={13} className="text-green" />scade riscul</span>
        <span className="inline-flex items-center gap-1">crește riscul<ArrowUp size={13} className="text-red" /></span>
      </div>

      <div className="relative flex flex-col gap-1.5" onMouseLeave={() => setHover(null)}>
        {/* ghidaj vertical la valoarea de bază și la rezultat */}
        <div className="absolute top-0 bottom-0 left-[162px] right-[74px] pointer-events-none" aria-hidden>
          <div className="absolute top-0 bottom-0 border-l border-dashed" style={{ left: pos(CONSTANTS.BAZA), borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)" }} />
          <div className="absolute top-0 bottom-0 border-l border-dashed" style={{ left: pos(p), borderColor: `color-mix(in srgb, ${LVL[riskLevel(p)]} 50%, transparent)` }} />
        </div>

        <Row label="Valoare de bază" info={<>Media probabilităților modelului pe datele de fundal: punctul de plecare înainte de a ține cont de ziua aleasă.</>} value={fmtPct(CONSTANTS.BAZA, 1)} muted>
          <Bar from={0} to={CONSTANTS.BAZA} color="color-mix(in srgb, var(--accent) 55%, transparent)" />
        </Row>
        {steps.map((s) => {
          const up = s.v >= 0;
          const dim = hover !== null && hover !== s.key;
          return (
            <div key={s.key} onMouseEnter={() => setHover(s.key)} onFocus={() => setHover(s.key)} tabIndex={0}
              className="rounded-[10px] transition-opacity duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" style={{ opacity: dim ? 0.35 : 1 }}>
              <Row label={s.label} info={
                <><b>{s.label}</b> {s.v >= 0 ? "a ridicat" : "a coborât"} riscul cu <b>{fmtNum(Math.abs(s.v) * 100, 2)} pp</b>, prin {varsOf(s.label).length} variabile:
                  <ul className="mt-1.5 flex flex-col gap-0.5">{varsOf(s.label).map((f) => <li key={f.name}>· {FEATURE_LABELS[f.name]?.label ?? f.name}</li>)}</ul></>
              } value={<span className={`inline-flex items-center gap-0.5 ${up ? "text-red" : "text-green"}`}>{up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{fmtNum(Math.abs(s.v) * 100, 2)}</span>} active={hover === s.key}>
                <Bar from={s.from} to={s.to} color={up ? "linear-gradient(90deg, color-mix(in srgb, var(--red) 60%, transparent), var(--red))" : "linear-gradient(270deg, color-mix(in srgb, var(--green) 60%, transparent), var(--green))"} />
              </Row>
            </div>
          );
        })}
        <Row label="Riscul zilei" info={<>Valoarea de bază plus toate contribuțiile: exact probabilitatea afișată în semafor.</>} value={<b style={{ color: LVL[riskLevel(p)] }}>{fmtPct(p, 1)}</b>} strong>
          <Bar from={0} to={p} color={LVL[riskLevel(p)]} glow />
        </Row>
      </div>

      <div className="mt-auto rounded-2xl border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--bg-soft)_70%,transparent)] px-4 py-3 text-[13px]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-muted inline-flex items-center gap-1.5"><MousePointer2 size={13} />Apasă pe <b className="text-fg-2">ⓘ</b> de lângă o categorie ca să vezi ce variabile conține.</span>
          <span className="mono text-fg-2">{fmtPct(CONSTANTS.BAZA, 1)} {total >= 0 ? "+" : "−"} {fmtNum(Math.abs(total) * 100, 2)} pp = <b className="text-accent-2">{fmtPct(p, 1)}</b></span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, children, muted, strong, active, info }: { label: string; value: React.ReactNode; children: React.ReactNode; muted?: boolean; strong?: boolean; active?: boolean; info?: React.ReactNode }) {
  return (
    <div className={`grid grid-cols-[150px_1fr_62px] items-center gap-2 px-1 py-0.5 rounded-[10px] ${active ? "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]" : ""}`}>
      <span className={`text-[13px] inline-flex items-center gap-1 min-w-0 ${strong ? "font-bold text-fg" : muted ? "text-muted" : "text-fg-2 font-medium"}`}>
        <span className="truncate">{label}</span>{info && <InfoTip label={label}>{info}</InfoTip>}
      </span>
      <div className="relative h-[26px] rounded-[8px] bg-[color-mix(in_srgb,var(--grid)_55%,transparent)]">{children}</div>
      <span className="mono tnum text-[12.5px] text-right">{value}</span>
    </div>
  );
}

function Empty({ idx }: { idx: number }) {
  return (
    <div className="flex flex-col h-full gap-4 p-5 sm:p-6">
      <header className="flex items-start gap-3.5">
        <div className="icon-box ib-acc"><Layers size={24} /></div>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">explicabilitate</div>
          <h2 className="card-title">De ce era riscul așa pe {dmy(series[idx].date)}</h2>
          <p className="card-sub">cascadă Shapley exactă pe categorii, modelul final</p>
        </div>
      </header>
      <div className="flex-1 grid place-items-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--bg-soft)_60%,transparent)] p-6 text-center">
        <div className="max-w-[46ch] flex flex-col items-center gap-2">
          <History size={22} className="text-muted" />
          <p className="font-semibold">Contribuțiile sunt calculate pentru perioada de test (2024–2026)</p>
          <p className="text-[13px] text-muted">
            Ziua aleasă face parte din validarea walk-forward: predicția vine de la modelul antrenat pentru acel an, nu de la modelul final,
            deci descompunerea pe categorii nu se aplică. Mută mașina timpului după 01.01.2024.
          </p>
        </div>
      </div>
    </div>
  );
}
