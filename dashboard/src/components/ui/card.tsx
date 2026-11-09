import type { CSSProperties, ReactNode } from "react";

export function Card({ className = "", style, delay = 0, children, ...rest }: { className?: string; style?: CSSProperties; delay?: number; children: ReactNode } & Record<string, unknown>) {
  return (
    <section className={`card rise ${className}`} style={{ animationDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </section>
  );
}

export function CardHead({ icon, tone = "acc", title, sub, right, eyebrow }: { icon: ReactNode; tone?: "acc" | "red" | "amber" | "green"; title: ReactNode; sub?: ReactNode; right?: ReactNode ; eyebrow?: string }) {
  return (
    <header className="flex items-start gap-3.5 flex-wrap">
      <div className={`icon-box ib-${tone}`}>{icon}</div>
      <div className="min-w-[200px] flex-1">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="card-title leading-tight">{title}</h2>
        {sub && <p className="card-sub mt-0.5">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-wrap">{right}</div>}
    </header>
  );
}
