import { Search } from "lucide-react";
import logoSvg from "@/assets/logo.svg?raw";

export function Wordmark({ shine = false }: { shine?: boolean }) {
  return (
    <span className="font-extrabold tracking-[-0.02em]">
      {"SUPER".split("").map((c, i) => (
        <span key={i}><span className={shine ? "shine-text" : undefined}>{c}</span><span className="text-accent" style={{ textShadow: "0 0 12px var(--accent)" }}>.</span></span>
      ))}
    </span>
  );
}

/** Logo-ul din prezentare (norul cu simbolul S.U.P.E.R.). */
export function Logo({ className = "" }: { className?: string }) {
  return <span className={`logo-svg inline-block ${className}`} aria-hidden dangerouslySetInnerHTML={{ __html: logoSvg }} />;
}

/** „S.U.P.E.R. — BET” în formatul din prezentare: punctele în violet, liniuța ca bară rotunjită. */
export function BrandTitle() {
  return (
    <span className="brand-title" aria-label="S.U.P.E.R. – BET">
      <Wordmark />
      <span className="brand-dash" aria-hidden />
      <span>BET</span>
    </span>
  );
}

export function Topbar({ onPalette }: { onPalette: () => void }) {
  return (
    <header className="flex items-center gap-x-4 gap-y-3 flex-wrap rise">
      <div className="flex items-center gap-3.5 min-w-0">
        <Logo className="w-[72px] h-[48px] flex-none" />
        <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap min-w-0">
          <h1 className="m-0 text-[24px] sm:text-[28px] leading-none"><BrandTitle /></h1>
          <span className="text-muted font-medium text-[14px]">sistem de avertizare timpurie pentru indicele BET</span>
        </div>
      </div>
      <button type="button" onClick={onPalette} className="btn ml-auto !rounded-full !pl-3.5 !pr-2 !py-1.5 text-muted"
        aria-label="Deschide paleta de comenzi (Ctrl K)">
        <Search size={15} />
        <span className="font-medium text-[13px] text-muted hidden lg:inline">Caută o zi, un moment, o secțiune</span>
        <span className="flex gap-1"><kbd>Ctrl</kbd><kbd>K</kbd></span>
      </button>
    </header>
  );
}
