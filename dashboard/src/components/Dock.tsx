import { useState } from "react";
import { Command, Gauge, Layers, LineChart, PiggyBank, Radar } from "lucide-react";
import { useScrollSpy } from "@/lib/spotlight";

export const SECTIONS = [
  { id: "semafor", label: "Semafor și matrice", icon: Gauge },
  { id: "istoric", label: "Istoric", icon: LineChart },
  { id: "explicatii", label: "Explicații și metrici", icon: Layers },
  { id: "alerte", label: "Dovada alertelor", icon: Radar },
  { id: "simulator", label: "Simulator", icon: PiggyBank },
] as const;

export function Dock({ onPalette }: { onPalette: () => void }) {
  const [active, setActive] = useState<string>("semafor");
  useScrollSpy(SECTIONS.map((s) => s.id), setActive);
  return (
    <nav className="dock" aria-label="Secțiuni">
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <a key={id} href={`#${id}`} aria-current={active === id} aria-label={label}
          onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); setActive(id); }}>
          <Icon size={19} />
          <span className="dock-label">{label}</span>
        </a>
      ))}
      <span className="sep" aria-hidden />
      <button type="button" onClick={onPalette} aria-label="Paletă de comenzi (Ctrl K)">
        <Command size={18} />
        <span className="dock-label">Comenzi · Ctrl K</span>
      </button>
    </nav>
  );
}
