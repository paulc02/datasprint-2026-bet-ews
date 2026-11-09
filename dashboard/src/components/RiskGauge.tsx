import { ArrowDownRight, ArrowUpRight, Coffee, Gauge, Minus, SearchCheck, ShieldAlert, ShieldCheck, Siren } from "lucide-react";
import { series, CONSTANTS } from "@/data/data";
import { precisionAbove, riskLevel } from "@/lib/analytics";
import { fmtDateLong, fmtNum } from "@/lib/format";
import { useCountUp } from "@/lib/hooks";
import { InfoTip } from "./ui/tooltip";

const LEVEL = {
  scazut: { label: "Risc scăzut", dot: "dot-green", color: "var(--green)" },
  moderat: { label: "Risc moderat", dot: "dot-amber", color: "var(--amber)" },
  ridicat: { label: "Risc ridicat", dot: "dot-red", color: "var(--red)" },
} as const;

const CX = 160, CY = 156, R = 118, SEG = 48;
const polar = (v: number, r: number) => {
  const a = Math.PI * (1 - v);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const segColor = (v: number) => (v >= 2 / 3 ? "var(--red)" : v >= 1 / 3 ? "var(--amber)" : "var(--green)");

/* Scală pe zone (nu liniară): fiecare nivel ocupă o treime din arc, ca acul să fie lizibil la probabilități mici. */
const A = CONSTANTS.NIVEL_MODERAT, B = CONSTANTS.NIVEL_RIDICAT, P_MAX = 0.6;
const toArc = (p: number) =>
  p < A ? (p / A) / 3 : p < B ? 1 / 3 + ((p - A) / (B - A)) / 3 : 2 / 3 + Math.min(1, (p - B) / (P_MAX - B)) / 3;

export function RiskGauge({ idx, historical }: { idx: number; historical: boolean }) {
  const d = series[idx];
  const p = d.prob;
  const lvl = riskLevel(p);
  const L = LEVEL[lvl];
  const shown = useCountUp(p * 100, 1100);
  const alert = p >= CONSTANTS.PRAG_ALERTA && idx > 0 && series[idx - 1].prob >= CONSTANTS.PRAG_ALERTA;
  const arc = toArc(p);
  const angle = -90 + arc * 180;
  const prevWeek = series[Math.max(0, idx - 5)].prob;
  const delta = p - prevWeek;

  return (
    <div className="relative flex flex-col h-full gap-3 p-5 sm:p-6">
      <div className="scan" aria-hidden />
      <header className="flex items-center gap-3.5">
        <div className="icon-box ib-acc"><Gauge size={24} /></div>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">{historical ? "mod istoric" : "astăzi"}</div>
          <h2 className="card-title">Semaforul zilei</h2>
        </div>
        <span className="chip mono !text-[12px]">{fmtDateLong(d.date)}</span>
      </header>

      <div className="relative mx-auto w-full max-w-[320px]">
        <svg viewBox="0 0 320 178" className="w-full overflow-visible" role="img"
          aria-label={`Indicator de risc: ${fmtNum(p * 100, 1)}%, ${L.label.toLowerCase()}`}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="hub" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--text)" />
              <stop offset="100%" stopColor="var(--muted)" />
            </radialGradient>
          </defs>
          {/* pista de fundal */}
          <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} fill="none" stroke="var(--grid)" strokeWidth={26} strokeLinecap="round" opacity={0.7} />
          <g filter="url(#glow)">
            {Array.from({ length: SEG }, (_, i) => {
              const a = i / SEG + 0.003, b = (i + 1) / SEG - 0.003;
              const mid = (i + 0.5) / SEG;
              const [x1, y1] = polar(a, R), [x2, y2] = polar(b, R);
              const on = mid <= arc;
              return (
                <path key={i} d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`} fill="none"
                  stroke={segColor(mid)} strokeWidth={on ? 20 : 12} opacity={on ? 1 : 0.16}
                  style={{ transition: `opacity .4s ${i * 8}ms, stroke-width .4s ${i * 8}ms` }} />
              );
            })}
          </g>
          {/* gradații fine */}
          {Array.from({ length: 31 }, (_, i) => {
            const v = i / 30;
            const [x1, y1] = polar(v, R - 20), [x2, y2] = polar(v, R - (i % 5 === 0 ? 28 : 24));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--muted)" strokeWidth={i % 5 === 0 ? 1.4 : 0.8} opacity={0.5} />;
          })}
          {[[1 / 3, A], [2 / 3, B]].map(([v, val]) => {
            const [tx, ty] = polar(v, R + 26);
            return <text key={v} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fill="var(--text-2)" className="mono">{fmtNum(val * 100, 1)}%</text>;
          })}
          <text x={CX - R} y={CY + 22} textAnchor="middle" fontSize="10.5" fill="var(--muted)" className="mono">0%</text>
          <text x={CX + R} y={CY + 22} textAnchor="middle" fontSize="10.5" fill="var(--muted)" className="mono">{fmtNum(P_MAX * 100)}%+</text>
          {/* ac cu arc elastic */}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${CX}px ${CY}px`, transition: "transform .9s cubic-bezier(.34,1.56,.64,1)" }}>
            <path d={`M ${CX - 4} ${CY} L ${CX} ${CY - (R - 30)} L ${CX + 4} ${CY} Z`} fill="var(--text)" style={{ filter: `drop-shadow(0 0 6px ${L.color})` }} />
          </g>
          <circle cx={CX} cy={CY} r={11} fill="url(#hub)" stroke="var(--surface)" strokeWidth={3} />
          <circle cx={CX} cy={CY} r={4} fill={L.color} />
        </svg>
      </div>

      <div className="text-center leading-none -mt-2">
        <span className="tnum font-extrabold tracking-[-0.045em] text-[64px] sm:text-[76px]"
          style={{ color: L.color, textShadow: `0 0 40px color-mix(in srgb, ${L.color} 45%, transparent)` }}>
          {fmtNum(shown, 1)}
        </span>
        <span className="text-[30px] font-bold text-muted align-top ml-0.5">%</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <span className="inline-flex items-center gap-2.5 font-semibold text-[15px]">
          <span className={`dot ${L.dot}`} aria-hidden />{L.label}
          <InfoTip label="nivelurile de risc">
            <b>Scăzut</b> sub {fmtNum(A * 100, 1)}% · <b>Moderat</b> de la {fmtNum(A * 100, 1)}% (pragul care maximizează F2) · <b>Ridicat</b> de la {fmtNum(B * 100, 1)}%, unde stresul a urmat de cel puțin 2 ori mai des decât în medie.
            Alerta se aprinde când riscul stă peste {fmtNum(A * 100, 1)}% două zile de tranzacționare la rând.
          </InfoTip>
        </span>
        {alert ? (
          <span className="chip chip-red pulse-pill"><ShieldAlert size={15} />ALERTĂ ACTIVĂ</span>
        ) : (
          <span className="chip chip-green"><ShieldCheck size={15} />Fără alertă</span>
        )}
        <span className={`chip mono !text-[12px] ${Math.abs(delta) < 0.0005 ? "" : delta > 0 ? "chip-red" : "chip-green"}`} title="față de acum 5 zile de tranzacționare">
          {Math.abs(delta) < 0.0005 ? <Minus size={13} /> : delta > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {delta > 0 ? "+" : delta < 0 ? "−" : ""}{fmtNum(Math.abs(delta) * 100, 1)} pp / săpt.
        </span>
      </div>

      <Advice level={lvl} />
    </div>
  );
}

/* Mesaj de acțiune pentru fiecare nivel de risc. Frecvențele vin din validarea 2013–2023. */
const P_MOD = precisionAbove(A), P_RID = precisionAbove(B);
const ADVICE = {
  scazut: {
    icon: Coffee, tone: "green", title: "Piața e liniștită",
    text: "Nu e nevoie de nicio schimbare. Păstrează strategia obișnuită și verifică semaforul o dată pe săptămână.",
    steps: ["Portofoliul rămâne neschimbat", "Verificare săptămânală"],
  },
  moderat: {
    icon: SearchCheck, tone: "amber", title: "Analizează înainte să acționezi",
    text: `Riscul a crescut peste normal: în trecut, ${fmtNum(P_MOD.precision * 100, 0)}% din zilele de acest fel au fost urmate de o scădere de cel puțin 5%. Nu e încă momentul să vinzi, dar e momentul să te uiți atent.`,
    steps: ["Verifică cât din portofoliu e pe acțiuni românești", "Vezi în cascada de mai jos ce împinge riscul", "Pregătește un plan de reducere a expunerii", "Urmărește semaforul zilnic"],
  },
  ridicat: {
    icon: Siren, tone: "red", title: "Acționează: redu expunerea",
    text: `Semnal puternic de stres: în trecut, ${fmtNum(P_RID.precision * 100, 0)}% din zilele cu risc ridicat au fost urmate de o scădere de cel puțin 5%, de ${fmtNum(P_RID.precision / P_RID.base, 1)} ori mai des decât în medie.`,
    steps: ["Retrage cel puțin jumătate din expunerea pe BET", "Mută banii în depozite sau titluri de stat până trece alerta", "Amână cumpărările noi de acțiuni", "Revino la expunerea normală când riscul scade sub " + fmtNum(B * 100, 1) + "%"],
  },
} as const;

/** Toate cele trei mesaje stau suprapuse în aceeași celulă: cardul are mereu înălțimea celui mai lung, deci nu „sare”. */
function Advice({ level }: { level: "scazut" | "moderat" | "ridicat" }) {
  return (
    <div className="mt-auto grid" role="status" aria-live="polite">
      {(Object.keys(ADVICE) as (keyof typeof ADVICE)[]).map((k) => {
        const a = ADVICE[k];
        const c = `var(--${a.tone})`;
        const on = k === level;
        return (
          <div key={k} aria-hidden={!on} className="rounded-2xl border p-4 flex flex-col gap-2.5"
            style={{
              gridArea: "1 / 1", visibility: on ? "visible" : "hidden", opacity: on ? 1 : 0, transition: "opacity .35s ease",
              borderColor: `color-mix(in srgb, ${c} 45%, transparent)`,
              background: `radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, ${c} 16%, transparent), transparent 65%), var(--${a.tone}-soft)`,
            }}>
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-8 h-8 rounded-[10px] flex-none" style={{ background: `color-mix(in srgb, ${c} 22%, transparent)`, color: c }}><a.icon size={17} /></span>
              <span className="font-bold text-[15px]" style={{ color: c }}>{a.title}</span>
            </div>
            <p className="text-[13px] text-fg-2 leading-snug">{a.text}</p>
            <ul className="flex flex-col gap-1.5">
              {a.steps.map((st) => (
                <li key={st} className="flex items-start gap-2 text-[13px] text-fg">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-none" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />{st}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted mt-auto">Sugestie bazată pe semnalul modelului, nu recomandare de investiții.</p>
          </div>
        );
      })}
    </div>
  );
}
