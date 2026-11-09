import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { ScrollText, X } from "lucide-react";
import { series, contributions, CATEGORIES, CONSTANTS } from "@/data/data";
import { alertRuns, periodRange, type Period } from "@/lib/analytics";
import { fmtDate, fmtNum, fmtPct } from "@/lib/format";
import { Segmented } from "./ui/segmented";

type Level = "ridicat" | "moderat";

export function AlertLog({ onPick }: { onPick: (i: number) => void }) {
  const [period, setPeriod] = useState<Period>("test");
  const [level, setLevel] = useState<Level>("ridicat");
  const [open, setOpen] = useState(false);
  const thr = level === "ridicat" ? CONSTANTS.PRAG_RIDICAT : CONSTANTS.PRAG_ALERTA;
  const rows = useMemo(() => {
    const [a, b] = periodRange(period);
    return alertRuns(a, b, thr).reverse().map((r) => {
      const c = contributions[r.startIdx];
      const top = c ? CATEGORIES.map((cat, k) => ({ label: cat.label, v: c[k] })).filter((x) => x.v > 0).sort((x, y) => y.v - x.v).slice(0, 3) : [];
      const status = r.open ? "nevalidabilă" : r.isFalse ? "falsă" : "confirmată";
      return { ...r, top, status };
    });
  }, [period, thr]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="btn"><ScrollText size={16} />Jurnal alerte</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="drawer" aria-describedby={undefined}>
          <div className="p-5 border-b border-line flex items-start gap-3">
            <div className="icon-box sm ib-red"><ScrollText size={20} /></div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="card-title">Jurnal alerte</Dialog.Title>
              <p className="card-sub">Fiecare aprindere a alertei (2 zile de tranzacționare la rând peste prag), cu categoriile care au împins riscul în sus.</p>
            </div>
            <Dialog.Close className="btn btn-ghost !p-2" aria-label="Închide jurnalul"><X size={18} /></Dialog.Close>
          </div>
          <div className="px-5 py-3 border-b border-line flex flex-col gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Segmented label="Nivel alertă" value={level} onChange={setLevel}
                options={[{ value: "ridicat", label: `Ridicat ≥ ${fmtNum(CONSTANTS.PRAG_RIDICAT * 100, 1)}%` }, { value: "moderat", label: `Moderat ≥ ${fmtNum(CONSTANTS.PRAG_ALERTA * 100, 1)}%` }]} />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Segmented label="Perioadă jurnal" value={period} onChange={setPeriod}
                options={[{ value: "test", label: "2024–2026" }, { value: "validare", label: "2013–2023" }]} />
              <span className="mono text-[12px] text-muted">{rows.length} alerte</span>
            </div>
          </div>
          <ol className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {rows.length === 0 && <li className="p-4 text-[13.5px] text-muted">Nicio alertă la acest nivel în perioada aleasă.</li>}
            {rows.map((r) => (
              <li key={r.startIdx}>
                <button className="w-full text-left rounded-2xl border border-line bg-surface-2 hover:border-line-strong p-3.5 flex flex-col gap-2"
                  onClick={() => { onPick(r.startIdx); setOpen(false); }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="mono text-fg font-medium">{fmtDate(series[r.startIdx].date)}</span>
                    <span className="mono text-[12px] text-muted">{r.endIdx - r.startIdx + 1} zile</span>
                    <span className={`chip !py-0.5 !text-[12px] ml-auto ${r.status === "confirmată" ? "chip-green" : r.status === "falsă" ? "chip-amber" : "chip-acc"}`}>
                      {r.status === "confirmată" ? "✓ urmată de stres" : r.status === "falsă" ? "! alarmă falsă" : "… în curs"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 text-[13px] text-muted">
                    <span>la aprindere</span><b className="mono text-accent">{fmtPct(series[r.startIdx].prob, 1)}</b>
                    <span>· maxim</span><b className="mono text-fg-2">{fmtPct(r.peak, 1)}</b>
                  </div>
                  {r.top.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.top.map((t) => (
                        <span key={t.label} className="chip !py-0.5 !text-[12px]">{t.label} <span className="mono text-red">+{fmtNum(t.v * 100, 1)} pp</span></span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ol>
          <p className="px-5 py-3 text-[12px] text-muted border-t border-line">Apasă pe o alertă ca să vezi starea din acea zi în semafor. Contribuțiile pe categorii există pentru 2024–2026. „Urmată de stres” = cel puțin o zi de stres în alertă sau în cele 20 de zile de după.</p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
