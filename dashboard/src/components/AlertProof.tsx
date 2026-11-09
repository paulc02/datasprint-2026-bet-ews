import { useMemo, useState } from "react";
import { BadgeCheck, BellRing, Clock, Crosshair, Radar } from "lucide-react";
import { series, CONSTANTS } from "@/data/data";
import { episodes, median, periodRange, precisionAbove, share, type Episode, type Period } from "@/lib/analytics";
import { Segmented } from "./ui/segmented";
import { fmtDate, fmtNum, fmtPct } from "@/lib/format";
import { useCountUp } from "@/lib/hooks";
import { CardHead } from "./ui/card";
import { AlertLog } from "./AlertLog";
import { InfoTip } from "./ui/tooltip";

function Kpi({ icon, tone, label, value, unit, foot }: { icon: React.ReactNode; tone: string; label: React.ReactNode; value: React.ReactNode; unit?: string; foot: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--surface-2)_60%,transparent)] p-3.5 flex flex-col gap-2 min-w-0 hover-lift">
      <div className="flex items-center gap-2">
        <span className={`grid place-items-center w-7 h-7 rounded-[9px] flex-none ib-${tone}`}>{icon}</span>
        <span className="text-[12.5px] text-muted font-semibold leading-tight">{label}</span>
      </div>
      <div className="tnum text-[30px] leading-none font-extrabold tracking-[-0.03em]">{value}{unit && <span className="text-[15px] text-muted font-semibold ml-1">{unit}</span>}</div>
      <div className="text-[12px] text-muted mono">{foot}</div>
    </div>
  );
}

export function AlertProof({ onHist, onZoom }: { onHist: (i: number | null) => void; onZoom: (e: Episode) => void }) {
  const thr = CONSTANTS.PRAG_ALERTA;
  const [period, setPeriod] = useState<Period>("test");
  const s = useMemo(() => {
    const eps = episodes(period, thr);
    const epsHigh = episodes(period, CONSTANTS.PRAG_RIDICAT);
    const [a, b] = periodRange(period);
    const other: Period = period === "test" ? "validare" : "test";
    const [oa, ob] = periodRange(other);
    const leads = eps.filter((e) => e.caught).map((e) => e.lead ?? 0);
    return {
      eps, caught: leads.length, caughtHigh: epsHigh.filter((e) => e.caught).length,
      lead: median(leads), shareVal: share(a, b, thr), shareOther: share(oa, ob, thr),
      prec: precisionAbove(CONSTANTS.PRAG_RIDICAT, period),
    };
  }, [thr, period]);
  const label = period === "test" ? "test 2024–2026 · modelul final" : "validare 2013–2023 · out-of-fold";
  const lead = useCountUp(s.lead, 900);

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-4 h-full">
      <CardHead eyebrow="dovezi" icon={<Radar size={24} />} tone="acc" title="Dovada alertelor"
        sub={`${label} · alertă = risc ≥ ${fmtNum(thr * 100, 1)}% două zile de tranzacționare la rând · episod = debut de stres după ≥60 de zile calme`}
        right={<>
          <Segmented label="Perioadă" value={period} onChange={setPeriod}
            options={[{ value: "test", label: "Test 2024–26" }, { value: "validare", label: "2013–2023" }]} />
          <AlertLog onPick={(i) => onHist(i)} />
        </>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Kpi icon={<BadgeCheck size={16} />} tone="green" label="Episoade prinse"
          value={<>{s.caught}<span className="text-muted text-[20px]"> / {s.eps.length}</span></>}
          foot={`alertă activă în cele 30 de zile dinainte · la risc ridicat: ${s.caughtHigh} / ${s.eps.length}`} />
        <Kpi icon={<Clock size={16} />} tone="acc" label="Avans median" value={fmtNum(lead, 0)} unit="zile"
          foot="calendaristice, de la prima alertă la debut (maxim 30)" />
        <Kpi icon={<BellRing size={16} />} tone="amber"
          label={<>Zile în alertă <InfoTip label="zile în alertă">Pragul de alertă e ales să maximizeze F2, care pune recall-ul pe primul loc. Prețul: alerta e aprinsă în multe zile. Nivelul „risc ridicat” e semnalul rar și mai precis.</InfoTip></>}
          value={fmtPct(s.shareVal)} foot={`${period === "test" ? "2013–2023" : "2024–2026"}: ${fmtPct(s.shareOther)} din zile`} />
        <Kpi icon={<Crosshair size={16} />} tone="red" label="Precizie la risc ridicat" value={fmtPct(s.prec.precision, 1)}
          foot={`vs. ${fmtPct(s.prec.base, 1)} în medie (${fmtNum(s.prec.precision / s.prec.base, 1)}×) · ${fmtNum(s.prec.n)} zile`} />
      </div>

      <div className="overflow-auto rounded-2xl border border-[var(--hairline)] h-[330px] bg-[color-mix(in_srgb,var(--bg-soft)_45%,transparent)]">
        <table className="tbl tnum">
          <thead className="sticky top-0 z-[1]" style={{ background: "var(--surface)" }}>
            <tr><th>Debut episod</th><th>Prima alertă</th><th>Zile avans</th><th>Zile de stres</th><th>Scădere maximă BET</th><th>Status</th></tr>
          </thead>
          <tbody>
            {s.eps.map((e) => (
              <tr key={e.startIdx} tabIndex={0} title="Arată episodul în grafic"
                onClick={() => onZoom(e)} onKeyDown={(k) => { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); onZoom(e); } }}>
                <td className="mono">{fmtDate(series[e.startIdx].date)}</td>
                <td className="mono">{e.firstAlertIdx != null ? fmtDate(series[e.firstAlertIdx].date) : <span className="text-muted">—</span>}</td>
                <td className="mono">
                  {e.lead != null ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-[22px] text-right">{fmtNum(e.lead)}</span>
                      <span className="meter w-[70px]"><i style={{ width: `${(e.lead / 30) * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} /></span>
                    </span>
                  ) : <span className="text-muted">—</span>}
                </td>
                <td className="mono">{fmtNum(e.days)}</td>
                <td className="mono text-red">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-[52px] text-right">{fmtPct(e.maxDrop, 1)}</span>
                    <span className="meter w-[70px]"><i style={{ width: `${Math.min(1, -e.maxDrop / 0.3) * 100}%`, background: "var(--red)", boxShadow: "0 0 8px var(--red)" }} /></span>
                  </span>
                </td>
                <td>{e.caught
                  ? <span className="chip chip-green !py-0.5 !text-[12px]">✓ Prins</span>
                  : <span className="chip chip-red !py-0.5 !text-[12px]">✕ Ratat</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-muted -mt-1">
        Apasă pe un rând ca graficul istoric să facă zoom pe episod. Avansul e plafonat la 30 de zile, ca în notebook. BET-ul 2024–2026 vine de la BVB; etichetele de stres sunt calculate cu aceeași regulă ca în train.
      </p>
    </div>
  );
}
