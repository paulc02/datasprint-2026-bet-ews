import { useEffect, useRef, useState } from "react";
import { History, Pause, Play, RotateCcw } from "lucide-react";
import { series, CONSTANTS } from "@/data/data";
import { fmtDate, fmtPct } from "@/lib/format";
import { Slider } from "./ui/slider";
import { Segmented } from "./ui/segmented";
import { InfoTip } from "./ui/tooltip";

const N = series.length;
const SPEEDS = { "1": 1, "5": 5, "20": 20 } as const;
type Speed = keyof typeof SPEEDS;

/** Banda de risc: fiecare zi = o linie colorată după nivel; dedesubt, zilele de stres reale. */
function RiskBarcode({ idx, onSeek }: { idx: number; onSeek: (i: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = ref.current;
    if (!c || !w) return;
    const dpr = window.devicePixelRatio || 1, h = 28;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const col = (v: string) => css.getPropertyValue(v).trim();
    const G = col("--green"), A = col("--amber"), R = col("--red");
    g.clearRect(0, 0, w, h);
    const bw = w / N;
    for (let i = 0; i < N; i++) {
      const p = series[i].prob;
      g.fillStyle = p >= CONSTANTS.NIVEL_RIDICAT ? R : p >= CONSTANTS.NIVEL_MODERAT ? A : G;
      g.globalAlpha = p >= CONSTANTS.NIVEL_RIDICAT ? 0.95 : p >= CONSTANTS.NIVEL_MODERAT ? 0.45 : 0.28;
      g.fillRect(i * bw, 0, Math.max(1, bw + 0.3), 18);
      if (series[i].y_true === 1) { g.globalAlpha = 0.9; g.fillStyle = R; g.fillRect(i * bw, 22, Math.max(1, bw + 0.3), 4); }
    }
    g.globalAlpha = 1;
  }, [w]);
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onSeek(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (N - 1)));
  };
  const years = Array.from(new Set(series.map((d) => d.date.slice(0, 4)))).filter((y) => y !== series[0].date.slice(0, 4));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative cursor-pointer" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seek(e); }}
        onPointerMove={(e) => { if (e.buttons) seek(e); }} role="presentation">
        <canvas ref={ref} className="barcode" aria-hidden />
        <span className="absolute top-[-3px] bottom-[-3px] w-[2px] rounded-full pointer-events-none"
          style={{ left: `calc(${(idx / (N - 1)) * 100}% - 1px)`, background: "var(--text)", boxShadow: "0 0 10px var(--accent), 0 0 2px #fff" }} />
      </div>
      <div className="relative h-4 mono text-[10.5px] text-muted" aria-hidden>
        {years.filter((_, k) => k % 2 === 0).map((y) => {
          const i = series.findIndex((d) => d.date.startsWith(y));
          return <span key={y} className="absolute -translate-x-1/2" style={{ left: `${(i / (N - 1)) * 100}%` }}>{y}</span>;
        })}
      </div>
    </div>
  );
}

export function TimeMachine({ idx, onChange, playing, onPlayingChange }: {
  idx: number | null; onChange: (i: number | null) => void; playing: boolean; onPlayingChange: (p: boolean) => void;
}) {
  const cur = idx ?? N - 1;
  const d = series[cur];
  const [speed, setSpeed] = useState<Speed>("5");
  const curRef = useRef(cur);
  curRef.current = cur;

  useEffect(() => {
    if (!playing) return;
    if (curRef.current >= N - 1) onChange(0);
    const id = window.setInterval(() => {
      const next = curRef.current + SPEEDS[speed];
      if (next >= N - 1) { onChange(null); onPlayingChange(false); }
      else onChange(next);
    }, 45);
    return () => window.clearInterval(id);
  }, [playing, speed, onChange, onPlayingChange]);

  const lvl = d.prob >= CONSTANTS.NIVEL_RIDICAT ? "red" : d.prob >= CONSTANTS.NIVEL_MODERAT ? "amber" : "green";

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="icon-box ib-acc"><History size={24} /></div>
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="tm" className="card-title inline-flex items-center gap-1">Mașina timpului<InfoTip label="mașina timpului">Fiecare linie subțire din bandă e o zi de tranzacționare, colorată după nivelul de risc estimat în acea zi. Liniuțele roșii de dedesubt sunt zilele de stres reale: zile după care BET a scăzut cu cel puțin 5% în următoarele 20 de zile.</InfoTip></label>
          <p className="text-[12.5px] text-muted">Trage, apasă pe bandă sau pornește redarea: semaforul și explicațiile urmează ziua aleasă.</p>
        </div>
        <span className="chip mono" style={{ borderColor: `color-mix(in srgb, var(--${lvl}) 45%, transparent)` }}>
          <span className={`dot dot-${lvl}`} style={{ width: 8, height: 8, boxShadow: "none", animation: "none" }} />
          {fmtDate(d.date)} · {fmtPct(d.prob, 1)}
        </span>
      </div>

      <RiskBarcode idx={cur} onSeek={(i) => { onPlayingChange(false); onChange(i); }} />
      <Slider id="tm" label="Data afișată" value={cur} min={0} max={N - 1} step={1}
        onChange={(v) => { onPlayingChange(false); onChange(v >= N - 1 ? null : v); }} valueText={fmtDate(d.date)} />

      <div className="flex items-center gap-2 flex-wrap">
        <button className={`btn min-w-[150px] ${playing ? "" : "btn-acc"}`} onClick={() => onPlayingChange(!playing)} aria-pressed={playing}>
          {playing ? <Pause size={15} /> : <Play size={15} />}{playing ? "Pauză" : "Redă prin timp"}
        </button>
        <Segmented label="Viteză redare" value={speed} onChange={setSpeed}
          options={[{ value: "1", label: "1×" }, { value: "5", label: "5×" }, { value: "20", label: "20×" }]} />
        {idx !== null && (
          <button className="btn btn-ghost ml-auto" onClick={() => { onPlayingChange(false); onChange(null); }}><RotateCcw size={15} />Azi</button>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-2 rounded-sm inline-block" style={{ background: "var(--green)", opacity: .5 }} />scăzut</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-2 rounded-sm inline-block" style={{ background: "var(--amber)", opacity: .7 }} />moderat</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-2 rounded-sm inline-block" style={{ background: "var(--red)" }} />ridicat</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded-sm inline-block" style={{ background: "var(--red)" }} />zile de stres reale</span>
      </div>
    </div>
  );
}
