import { META, CONSTANTS } from "@/data/data";
import { fmtNum } from "@/lib/format";
import { Wordmark } from "./Topbar";

export function Footer() {
  return (
    <footer className="mt-2 border-t border-line pt-5 pb-2 grid gap-3 md:grid-cols-[1fr_auto] text-[12.5px] text-muted">
      <p className="max-w-[100ch]">
        <b className="text-fg-2 font-semibold">Metodologie pe scurt.</b> Validare walk-forward pe ani (2010–2023), cu pauză de 35 de zile între antrenare și validare,
        fără amestecare în timp; anii 2020–2022 sunt scoși din antrenare și păstrați doar pentru validare. Model final: stacking peste regresie logistică,
        LightGBM și un model de hazard discret. Datele lunare și trimestriale intră doar de la data publicării; documentele text, de a doua zi.
        Probabilitățile afișate sunt cele brute ale modelului; cele trimise pe Kaggle trec în plus printr-un strat de decizie (prag {fmtNum(CONSTANTS.PRAG_KAGGLE * 100, 1)}%).
      </p>
      <p className="mono md:text-right whitespace-nowrap"><Wordmark /> · Versiune model: {META.modelVersion}</p>
    </footer>
  );
}
