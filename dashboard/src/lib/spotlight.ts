import { useEffect } from "react";

/** Lumina care urmărește cursorul: pe fundal (--cx/--cy) și pe cardul de sub cursor (--mx/--my). */
export function useSpotlight() {
  useEffect(() => {
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    let raf = 0, x = 0, y = 0;
    let last: HTMLElement | null = null;
    const apply = () => {
      raf = 0;
      document.documentElement.style.setProperty("--cx", `${x}px`);
      document.documentElement.style.setProperty("--cy", `${y}px`);
      const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>(".card");
      if (last && last !== el) { last.style.removeProperty("--mx"); last.style.removeProperty("--my"); }
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${x - r.left}px`);
        el.style.setProperty("--my", `${y - r.top}px`);
      }
      last = el ?? null;
    };
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("pointermove", move, { passive: true });
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
  }, []);
}

/** Secțiunea vizibilă acum (pentru dock). */
export function useScrollSpy(ids: string[], onChange: (id: string) => void) {
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (vis[0]) onChange(vis[0].target.id);
    }, { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join("|")]);
}
