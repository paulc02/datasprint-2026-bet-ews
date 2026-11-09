import * as T from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

export const TooltipProvider = T.Provider;

/** Termen tehnic cu explicație de o frază. */
export function InfoTip({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <T.Root delayDuration={120}>
      <T.Trigger asChild>
        <button type="button" aria-label={label ? `Ce înseamnă ${label}?` : "Explicație"}
          className="inline-grid place-items-center w-[18px] h-[18px] rounded-full text-muted hover:text-accent align-middle">
          <Info size={14} strokeWidth={2.2} />
        </button>
      </T.Trigger>
      <T.Portal>
        <T.Content className="tip" sideOffset={6} collisionPadding={12}>
          {children}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
