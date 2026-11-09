import { useCallback, useEffect, useRef, useState } from "react";
import { series } from "@/data/data";
import { riskLevel, type Episode } from "@/lib/analytics";
import { useSpotlight } from "@/lib/spotlight";
import { Card } from "./components/ui/card";
import { TooltipProvider } from "./components/ui/tooltip";
import { Topbar } from "./components/Topbar";
import { Ticker } from "./components/Ticker";
import { RiskGauge } from "./components/RiskGauge";
import { ContributionBars } from "./components/ContributionBars";
import { MetricsVsBaseline } from "./components/MetricsVsBaseline";
import { HistoryChart } from "./components/HistoryChart";
import { ConfusionMatrix } from "./components/ConfusionMatrix";
import { AlertProof } from "./components/AlertProof";
import { TimeMachine } from "./components/TimeMachine";
import { InvestorSimulator } from "./components/InvestorSimulator";
import { Footer } from "./components/Footer";
import { Dock } from "./components/Dock";
import { CommandPalette } from "./components/CommandPalette";

const N = series.length;

export default function App() {
  useSpotlight();
  // dark only: fixăm tema indiferent de setarea gazdei
  useEffect(() => { document.documentElement.setAttribute("data-theme", "dark"); }, []);

  const [histIdx, setHistIdx] = useState<number | null>(null);
  const idx = histIdx ?? N - 1;
  const [zoom, setZoom] = useState<{ from: number; to: number; n: number } | null>(null);
  const [palette, setPalette] = useState(false);
  const [playing, setPlaying] = useState(false);
  const histRef = useRef<HTMLDivElement>(null);

  const setHist = useCallback((i: number | null) => setHistIdx(i === null || i >= N - 1 ? null : i), []);
  const zoomTo = (e: Episode) => {
    const a = Math.max(0, e.startIdx - 60), b = Math.min(N - 1, e.troughIdx + 60);
    setZoom((z) => ({ from: series[a].t, to: series[b].t, n: (z?.n ?? 0) + 1 }));
    histRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pickHist = (i: number | null) => {
    setHist(i);
    if (i !== null) document.getElementById("semafor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const togglePlay = useCallback(() => setPlaying((p) => !p), []);

  const level = riskLevel(series[idx].prob);
  const histOutline = histIdx !== null ? { outline: "2px dashed color-mix(in srgb, var(--accent) 70%, transparent)", outlineOffset: 4 } : undefined;

  return (
    <TooltipProvider>
      <div className="bg-aurora" aria-hidden><i /><i /><i /></div>
      <div className="bg-grid" aria-hidden />
      <div className="bg-cursor" aria-hidden />
      <div className="bg-grain" aria-hidden />
      <div className="relative z-[1] mx-auto max-w-[1600px] flex flex-col gap-5 pt-5 pb-28 px-[max(16px,env(safe-area-inset-left,0px))] sm:px-6 lg:px-8">
        <Topbar onPalette={() => setPalette(true)} />
        <Ticker />

        <div id="semafor" className="scroll-mt-4 flex flex-col gap-3">
          {/* RÂNDUL 1: semafor | matricea de confuzie (aceeași înălțime); dedesubt mașina timpului pe toată lățimea */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] items-stretch">
            <Card className="card-hero" data-risk={level} delay={60} aria-label="Semaforul zilei" style={histOutline}>
              <RiskGauge idx={idx} historical={histIdx !== null} />
            </Card>
            <Card delay={140}><ConfusionMatrix /></Card>
          </div>
          <Card delay={200}>
            <TimeMachine idx={histIdx} onChange={setHist} playing={playing} onPlayingChange={setPlaying} />
          </Card>
        </div>

        {/* RÂNDUL 2 */}
        <div id="istoric" ref={histRef} className="scroll-mt-4">
          <Card delay={280}><HistoryChart zoom={zoom} cursorIdx={histIdx} /></Card>
        </div>

        {/* RÂNDUL 3: explicații + metrici */}
        <div id="explicatii" className="scroll-mt-4 grid gap-5 lg:grid-cols-2 lg:[&>section]:min-h-[520px]">
          <Card delay={340} style={histOutline}><ContributionBars idx={idx} /></Card>
          <Card delay={400}><MetricsVsBaseline /></Card>
        </div>

        {/* RÂNDUL 4: dovada alertelor */}
        <div id="alerte" className="scroll-mt-4">
          <Card delay={450}><AlertProof onHist={pickHist} onZoom={zoomTo} /></Card>
        </div>

        {/* RÂNDUL 5: simulator */}
        <div id="simulator" className="scroll-mt-4">
          <Card delay={500}><InvestorSimulator /></Card>
        </div>

        <Footer />
      </div>
      <Dock onPalette={() => setPalette(true)} />
      <CommandPalette open={palette} onOpenChange={setPalette} onHist={setHist} playing={playing} onPlay={togglePlay} />
    </TooltipProvider>
  );
}
