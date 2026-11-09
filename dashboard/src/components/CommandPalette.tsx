import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarSearch, CornerDownLeft, History, Pause, Play, RotateCcw, Search } from "lucide-react";
import { series } from "@/data/data";
import { fmtDate, fmtPct } from "@/lib/format";
import { SECTIONS } from "./Dock";

interface Action { id: string; group: string; label: string; hint?: string; icon: React.ReactNode; run: () => void }

/** Momente din istoria BET la care merită să sari cu mașina timpului. */
const MOMENTE = [
  { date: "2016-06-24", label: "Brexit" },
  { date: "2018-10-11", label: "Corecția din octombrie 2018" },
  { date: "2018-12-19", label: "Ordonanța 114 („taxa pe lăcomie”)" },
  { date: "2020-02-24", label: "Începutul crizei COVID-19" },
  { date: "2022-02-24", label: "Invazia Rusiei în Ucraina" },
  { date: "2024-11-25", label: "Turul 1 al alegerilor prezidențiale" },
  { date: "2025-04-07", label: "Șocul tarifelor vamale SUA" },
];
const nearest = (iso: string) => { const i = series.findIndex((d) => d.date >= iso); return i < 0 ? series.length - 1 : i; };

/** Acceptă 18.09.2026, 18/09/2026 sau 2026-09-18. */
function parseDate(q: string): string | null {
  const m1 = q.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, "0")}-${m1[1].padStart(2, "0")}`;
  const m2 = q.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m2 ? q : null;
}

export function CommandPalette({ open, onOpenChange, onHist, playing, onPlay }: {
  open: boolean; onOpenChange: (o: boolean) => void; onHist: (i: number | null) => void; playing: boolean; onPlay: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange(!open); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);
  useEffect(() => { if (open) { setQ(""); setSel(0); } }, [open]);

  const actions = useMemo<Action[]>(() => {
    const go = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    const base: Action[] = [
      ...SECTIONS.map((s) => ({ id: "s-" + s.id, group: "Secțiuni", label: s.label, icon: <s.icon size={16} />, run: go(s.id) })),
      { id: "play", group: "Mașina timpului", label: playing ? "Oprește derularea în timp" : "Derulează riscul prin timp", hint: "redare", icon: playing ? <Pause size={16} /> : <Play size={16} />, run: () => { onPlay(); go("semafor")(); } },
      { id: "azi", group: "Mașina timpului", label: "Înapoi la ultima zi", hint: fmtDate(series[series.length - 1].date), icon: <RotateCcw size={16} />, run: () => { onHist(null); go("semafor")(); } },
      ...MOMENTE.map((m) => {
        const i = nearest(m.date);
        return { id: "m-" + m.date, group: "Momente din istoria BET", label: m.label, hint: `${fmtDate(series[i].date)} · risc ${fmtPct(series[i].prob, 1)}`, icon: <History size={16} />, run: () => { onHist(i); go("semafor")(); } };
      }),
    ];
    const iso = parseDate(q.trim());
    if (iso) {
      const i = nearest(iso);
      base.unshift({ id: "date", group: "Salt la dată", label: `Arată ziua ${fmtDate(series[i].date)}`, hint: `risc ${fmtPct(series[i].prob, 1)}`, icon: <CalendarSearch size={16} />, run: () => { onHist(i); go("semafor")(); } });
    }
    return base;
  }, [q, playing, onHist, onPlay]);

  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const shown = actions.filter((a) => a.id === "date" || norm(a.label + " " + a.group).includes(norm(q.trim())));
  const groups = [...new Set(shown.map((a) => a.group))];
  const run = (a: Action) => { onOpenChange(false); setTimeout(a.run, 30); };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="palette" aria-describedby={undefined}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            if (e.key === "Enter" && shown[sel]) { e.preventDefault(); run(shown[sel]); }
          }}>
          <Dialog.Title className="sr-only">Paletă de comenzi</Dialog.Title>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--hairline)]">
            <Search size={18} className="text-accent flex-none" />
            <input id="palette-q" autoFocus value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }}
              placeholder="Caută o secțiune, un moment sau scrie o dată (ex. 24.02.2022)…" aria-label="Caută comenzi" />
            <kbd>Esc</kbd>
          </div>
          <div ref={listRef} className="overflow-y-auto p-2 flex flex-col gap-1" role="listbox" aria-label="Comenzi">
            {shown.length === 0 && <p className="p-4 text-[13.5px] text-muted">Nicio potrivire. Încearcă o dată, de exemplu 07.04.2025.</p>}
            {groups.map((g) => (
              <div key={g} className="flex flex-col gap-0.5">
                <div className="label-up px-3 pt-2 pb-1">{g}</div>
                {shown.filter((a) => a.group === g).map((a) => {
                  const i = shown.indexOf(a);
                  return (
                    <button key={a.id} type="button" role="option" aria-selected={i === sel} data-active={i === sel} className="palette-item"
                      onMouseEnter={() => setSel(i)} onClick={() => run(a)}>
                      <span className="text-accent">{a.icon}</span>
                      <span className="flex-1 min-w-0 truncate">{a.label}</span>
                      {a.hint && <span className="mono text-[12px] text-muted">{a.hint}</span>}
                      {i === sel && <CornerDownLeft size={14} className="text-muted" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--hairline)] flex gap-4 text-[12px] text-muted">
            <span><kbd>↑</kbd> <kbd>↓</kbd> navighează</span><span><kbd>Enter</kbd> execută</span><span><kbd>Ctrl</kbd> <kbd>K</kbd> deschide oricând</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
