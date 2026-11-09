import * as SliderPrimitive from "@radix-ui/react-slider";

interface Props {
  id?: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; label: string; valueText?: string; disabled?: boolean;
}
// Slider în stil shadcn/ui, construit pe Radix.
export function Slider({ id, value, min, max, step, onChange, label, valueText, disabled }: Props) {
  return (
    <SliderPrimitive.Root id={id} className="slider-root" value={[value]} min={min} max={max} step={step}
      onValueChange={(v) => onChange(v[0])} aria-label={label} disabled={disabled}>
      <SliderPrimitive.Track className="slider-track">
        <SliderPrimitive.Range className="slider-range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="slider-thumb" aria-label={label} aria-valuetext={valueText} />
    </SliderPrimitive.Root>
  );
}
