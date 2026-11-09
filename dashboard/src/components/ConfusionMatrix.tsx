import { useMemo, useState } from "react";
import { AlertTriangle, BellOff, CheckCircle2, Grid2x2, Moon, Target } from "lucide-react";
import { CM } from "@/data/data";
import { confusionSet, type CmSet } from "@/lib/analytics";
import { fmtNum, fmtPct } from "@/lib/format";
import { useCountUp } from "@/lib/hooks";
import { CardHead } from "./ui/card";
import { Segmented } from "./ui/segmented";
import { Slider } from "./ui/slider";
import { InfoTip } from "./ui/tooltip";

type Tone = "green" | "amber" | "red" | "calm";
const TONE: Record<Tone, { c: string; bg: string; bd: string }> = {
  green: { c: "var(--green)", bg: "var(--green-soft)", bd: "color-mix(in srgb, var(--green) 45%, transparent)" },
  amber: { c: "var(--amber)", bg: "var(--amber-soft)", bd: "color-mix(in srgb, var(--amber) 45%, transparent)" },
  red: { c: "var(--red)", bg: "var(--red-soft)", bd: "color-mix(in srgb, var(--red) 45%, transparent)" },
  calm: { c: "color-mix(in srgb, var(--green) 70%, var(--muted))", bg: "color-mix(in srgb, var(--green-soft) 45%, var(--surface-2))", bd: "var(--hairline)" },
};

function Cell({ tone, icon, name, hint, n, pct, explain }: { tone: Tone; icon: React.ReactNode; name: string; hint: string; n: number; pct: number; explain: string }) {
  const v = useCountUp(n, 700);
  const t = TONE[tone];
  return (
    <div className="relative rounded-[18px] border p-4 sm:p-5 flex flex-col justify-center gap-2.5 min-w-0 overflow-hidden hover-lift"
      style={{ background: `radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, ${t.c} 16%, transparent), transparent 60%), ${t.bg}`, borderColor: t.bd }}
      >
      <div className="flex items-center gap-2 font-semibold text-[13.5px]" style={{ color: t.c }}>{icon}<span className="truncate">{name}</span><InfoTip label={name}>{explain}</InfoTip></div>
      <div className="tnum text-[36px] xl:text-[44px] leading-none font-extrabold tracking-[-0.03em] text-fg">{fmtNum(Math.round(v))}</div>
      <div className="meter" style={{ background: "color-mix(in srgb, var(--bg) 50%, transparent)" }}><i style={{ width: `${pct * 100}%`, background: t.c, boxShadow: `0 0 12px ${t.c}` }} /></div>
      <div className="mono text-[12px] text-muted">{fmtPct(pct, 0)} {hint}</div>
    </div>
  );
}

export function ConfusionMatrix() {
  const [set, setSet] = useState<CmSet>("test");
  const [thrBy, setThrBy] = useState<Record<"train" | "test", number>>({ train: CM.train.thr, test: CM.test.thr });
  const thr = set === "combinat" ? null : thrBy[set];
  const setThr = (v: number) => { if (set !== "combinat") setThrBy((o) => ({ ...o, [set]: Math.max(0, Math.min(0.5, v)) })); };
  const c = useMemo(() => confusionSet(set, thr ?? undefined), [set, thr]);
  const stress = c.tp + c.fn, calm = c.fp + c.tn;
  const official = set === "combinat" ? null : CM[set].thr;
  const atOfficial = set === "combinat" || Math.abs((thr ?? 0) - (official ?? 0)) < 1e-9;

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-4 h-full">
      <CardHead eyebrow="evaluare" icon={<Grid2x2 size={24} />} title="Matricea de confuzie"
        right={<Segmented label="Set de date" value={set} onChange={setSet}
          options={[{ value: "train", label: "Train" }, { value: "test", label: "Test" }, { value: "combinat", label: "Combinate" }]} />} />

      {/* rândul pragului rămâne mereu pe loc; la „Combinate” e blocat (fiecare set își păstrează pragul recomandat) */}
      <div className="flex items-center gap-3 flex-wrap">
        <label htmlFor="cm-thr" className="text-[13px] font-semibold text-fg-2 inline-flex items-center gap-1">Prag
          <InfoTip label="pragul">{set === "combinat"
            ? <>La <b>Combinate</b> fiecare set e evaluat cu pragul lui recomandat: {fmtNum(CM.train.thr * 100, 1)}% pe train (probabilități brute) și {fmtNum(CM.test.thr * 100, 2)}% pe test (probabilitățile trimise pe Kaggle).</>
            : <>Peste acest prag modelul dă <b>alertă</b>. Mută-l ca să vezi cum se schimbă matricea. Pragul recomandat: {fmtNum((official as number) * 100, 2)}%{set === "train" ? ", ales să maximizeze F2 în validarea din notebook" : ", cel din submisia trimisă pe Kaggle"}.</>}
          </InfoTip>
        </label>
        <div className={`flex-1 min-w-[160px] ${set === "combinat" ? "opacity-40 pointer-events-none" : ""}`}>
          <Slider id="cm-thr" label="Prag de decizie" value={thr ?? CM.test.thr} min={0} max={0.5} step={0.0025} onChange={setThr}
            valueText={fmtNum(thr ?? CM.test.thr, 3)} disabled={set === "combinat"} />
        </div>
        <span className={`mono tnum text-[16px] w-[64px] text-right ${atOfficial ? "text-accent-2" : "text-amber"}`}>{thr === null ? "mixt" : fmtNum(thr * 100, 1) + "%"}</span>
        <button className="btn" aria-pressed={atOfficial} disabled={set === "combinat"} onClick={() => official !== null && setThr(official)}
          title={atOfficial ? "Pragul recomandat e activ" : "Revino la pragul recomandat"}>
          <Target size={15} />Prag recomandat
        </button>
      </div>

      <div className="grid grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-2.5 items-stretch flex-1 min-h-[220px]">
        <div />
        <div className="label-up text-center">Model: alertă</div>
        <div className="label-up text-center">Model: fără alertă</div>
        <div className="label-up [writing-mode:vertical-rl] rotate-180 text-center self-center">Realitate: stres</div>
        <Cell tone="green" icon={<CheckCircle2 size={17} />} name="Stres prins" hint="din zilele de stres" n={c.tp} pct={stress ? c.tp / stress : 0}
          explain="Zile urmate de o scădere ≥5% în care alerta era aprinsă." />
        <Cell tone="red" icon={<BellOff size={17} />} name="Stres ratat" hint="din zilele de stres" n={c.fn} pct={stress ? c.fn / stress : 0}
          explain="Zile urmate de o scădere ≥5% în care modelul nu a dat alertă: eroarea cea mai scumpă." />
        <div className="label-up [writing-mode:vertical-rl] rotate-180 text-center self-center">Realitate: liniște</div>
        <Cell tone="amber" icon={<AlertTriangle size={17} />} name="Alarmă falsă" hint="din zilele liniștite" n={c.fp} pct={calm ? c.fp / calm : 0}
          explain="Alertă aprinsă, dar BET nu a scăzut cu 5% în următoarele 20 de zile." />
        <Cell tone="calm" icon={<Moon size={17} />} name="Liniște corectă" hint="din zilele liniștite" n={c.tn} pct={calm ? c.tn / calm : 0}
          explain="Fără alertă, și piața chiar a rămas liniștită." />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { k: "Acuratețe", v: c.accuracy, tip: <><b>Acuratețea</b> arată ce parte din toate zilele au fost clasificate corect (stres prins + liniște corectă). La date dezechilibrate, cu puține zile de stres, poate fi mare și la un model slab, de aceea competiția folosește F2.</> },
          { k: "Precizie", v: c.precision, tip: <><b>Precizia</b> arată ce parte din alerte au fost urmate chiar de stres.</> },
          { k: "Recall", v: c.recall, tip: <><b>Recall</b> arată ce parte din zilele de stres au fost prinse de alertă.</> },
          { k: "F2", v: c.f2, tip: <><b>F2</b> combină precizia și recall-ul, punând de 4 ori mai mult accent pe recall.</> },
        ].map((mm) => (
          <div key={mm.k} className="rounded-2xl border border-[var(--hairline)] px-3.5 py-3 hover-lift bg-[color-mix(in_srgb,var(--surface-2)_60%,transparent)]">
            <div className="text-[12.5px] text-muted font-semibold flex items-center gap-1">{mm.k}<InfoTip label={mm.k}>{mm.tip}</InfoTip></div>
            <div className="tnum text-[22px] font-bold tracking-[-0.02em]">{fmtNum(mm.v, 3)}</div>
            <div className="meter mt-1.5"><i style={{ width: `${mm.v * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} /></div>
          </div>
        ))}
      </div>

    </div>
  );
}
