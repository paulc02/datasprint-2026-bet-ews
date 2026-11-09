import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { METRICS, CM } from "@/data/data";
import { fmtNum, fmtSigned } from "@/lib/format";
import { useCountUp, useMounted } from "@/lib/hooks";
import { InfoTip } from "./ui/tooltip";
import { Segmented } from "./ui/segmented";

type Set = "validare" | "test";
const TIPS = {
  f2: <><b>F2</b> combină precizia și recall-ul, dar pune de 4 ori mai mult accent pe recall: e mai grav să ratezi o scădere decât să dai o alarmă falsă.</>,
  auc: <><b>ROC-AUC</b> este șansa ca modelul să dea un scor mai mare unei zile de stres decât unei zile liniștite. 0,5 înseamnă ghicit, 1 înseamnă perfect.</>,
  bss: <><b>Brier Skill Score</b> arată cât de bune sunt probabilitățile față de a prezice mereu frecvența medie. 0 = nicio îmbunătățire; peste 0 = mai bine.</>,
};

/** Inel dublu: exterior = modelul, interior = baseline-ul. */
function Ring({ name, tip, m, b, delay }: { name: string; tip: React.ReactNode; m: number; b: number; delay: number }) {
  const mounted = useMounted(200 + delay);
  const v = useCountUp(m, 1100 + delay);
  const S = 132, r1 = 54, r2 = 42, C1 = 2 * Math.PI * r1, C2 = 2 * Math.PI * r2;
  const frac = (x: number) => Math.max(0, Math.min(1, x));
  return (
    <div className="flex flex-col items-center gap-2 min-w-0 group">
      <div className="relative" style={{ width: S, height: S }}>
        <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} className="-rotate-90 overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={`rg-${name}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-2)" /><stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <circle cx={S / 2} cy={S / 2} r={r1} fill="none" stroke="var(--grid)" strokeWidth={10} />
          <circle cx={S / 2} cy={S / 2} r={r2} fill="none" stroke="var(--grid)" strokeWidth={6} opacity={0.7} />
          <circle cx={S / 2} cy={S / 2} r={r1} fill="none" stroke={`url(#rg-${name})`} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={C1} strokeDashoffset={mounted ? C1 * (1 - frac(m)) : C1}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)", filter: "drop-shadow(0 0 6px var(--accent))" }} />
          <circle cx={S / 2} cy={S / 2} r={r2} fill="none" stroke="var(--muted)" strokeWidth={6} strokeLinecap="round" opacity={0.75}
            strokeDasharray={C2} strokeDashoffset={mounted ? C2 * (1 - frac(b)) : C2}
            style={{ transition: "stroke-dashoffset 1.2s .15s cubic-bezier(.2,.7,.2,1)" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="tnum text-[24px] font-extrabold tracking-[-0.03em] text-accent-2 leading-none">{fmtNum(v, 3)}</div>
          </div>
        </div>
      </div>
      <div className="text-[13px] font-semibold text-fg-2 flex items-center gap-1">{name}<InfoTip label={name}>{tip}</InfoTip></div>
      <div className="mono text-[11.5px] text-muted -mt-1">baseline {fmtNum(b, 3)}</div>
      <span className="chip chip-acc mono !text-[12px] !py-0.5 !px-2">{fmtSigned(m - b, 3)}</span>
    </div>
  );
}

export function MetricsVsBaseline() {
  const [set, setSet] = useState<Set>("validare");
  const d = useMemo(() => {
    if (set === "validare") return { model: METRICS.model, base: METRICS.baseline, sub: "validare walk-forward 2013–2023 · predicții out-of-fold" };
    const t = CM.test.metrici;
    // baseline constant pe test: o probabilitate fixă = alertă în toate zilele → F2 = 5P / (4P + 1); AUC 0,5; BSS 0
    const P = CM.test.y.reduce((a: number, b: number) => a + b, 0) / CM.test.y.length;
    const f2 = (5 * P) / (4 * P + 1);
    return { model: t, base: { f2, auc: 0.5, bss: 0, scor: 0.625 * f2 + 0.25 * 0.5 }, sub: "test 2024–2026 · submisia trimisă pe Kaggle" };
  }, [set]);

  return (
    <div className="flex flex-col h-full gap-4 p-5 sm:p-6">
      <header className="flex items-start gap-3.5 flex-wrap">
        <div className="icon-box ib-acc"><Trophy size={24} /></div>
        <div className="min-w-[200px] flex-1">
          <div className="eyebrow">performanță</div>
          <h2 className="card-title">Modelul vs. baseline</h2>
          <p className="card-sub">baseline = probabilitate constantă egală cu rata istorică de stres</p>
        </div>
        <Segmented label="Perioadă metrici" value={set} onChange={setSet}
          options={[{ value: "validare", label: "Validare" }, { value: "test", label: "Test" }]} />
      </header>

      <div className="flex items-center gap-4 text-[12px] text-muted mono">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-[6px] rounded-full bg-accent" />S.U.P.E.R. (inel exterior)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-[6px] rounded-full bg-muted" />baseline (inel interior)</span>
      </div>

      <div key={set} className="grid grid-cols-3 gap-2 flex-1 items-center">
        <Ring name="F2" tip={TIPS.f2} m={d.model.f2} b={d.base.f2} delay={0} />
        <Ring name="ROC-AUC" tip={TIPS.auc} m={d.model.auc} b={d.base.auc} delay={120} />
        <Ring name="Brier Skill" tip={TIPS.bss} m={d.model.bss} b={d.base.bss} delay={240} />
      </div>

      <div className="rounded-2xl border px-4 py-3 flex flex-col gap-2 text-[13px]"
        style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent)", borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-fg-2 font-semibold flex items-center gap-1">Scor DataSprint <InfoTip label="scorul DataSprint"><b>Scorul oficial</b> = 0,625·F2 + 0,25·ROC-AUC + 0,125·BSS.</InfoTip></span>
          <span className="mono"><b className="text-accent-2 text-[16px]">{fmtNum(d.model.scor, 3)}</b> <span className="text-muted">vs. {fmtNum(d.base.scor, 3)}</span></span>
        </div>
        <div className="relative h-2 rounded-full bg-[var(--grid)] overflow-hidden">
          <i className="absolute inset-y-0 left-0 rounded-full bg-[var(--muted)] opacity-60" style={{ width: `${d.base.scor * 100}%`, transition: "width .9s" }} />
          <i className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${d.model.scor * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))", boxShadow: "0 0 12px var(--accent)", transition: "width .9s" }} />
        </div>
      </div>
      <p className="text-[12px] text-muted mono truncate">{d.sub}</p>
    </div>
  );
}
