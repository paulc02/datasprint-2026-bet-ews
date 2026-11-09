import { useLayoutEffect, useRef, useState } from "react";

interface Opt<T extends string> { value: T; label: string }
/** Comutator segmentat cu indicator care alunecă sub opțiunea activă. */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Opt<T>[]; onChange: (v: T) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    else setInd(null);
  }, [value, options.length]);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const el = ref.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    });
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="seg" role="group" aria-label={label}>
      {ind && <span className="seg-ind" style={{ left: ind.left, width: ind.width }} aria-hidden />}
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}
