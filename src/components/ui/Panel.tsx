"use client";
import * as React from "react";
import { m, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  accent?: boolean;
}

export function Panel({ title, defaultOpen = true, collapsible = true, accent = false, className, children, ...props }: PanelProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border-b border-line flex flex-col", className)} {...props}>
      <header>
        <button
          aria-expanded={collapsible ? isOpen : undefined}
          className={cn(
            "flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors",
            collapsible && "cursor-pointer hover:bg-raised/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-line-strong"
          )}
          disabled={!collapsible}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <div className="flex items-center gap-2">
            {accent && <span className="w-1 h-3.5 rounded-full bg-observed/60" aria-hidden="true" />}
            <h3 className="text-[11px] font-mono font-medium uppercase tracking-widest text-fg-3">{title}</h3>
          </div>
          {collapsible && (
            <m.div
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
              className="text-fg-3"
            >
              <ChevronDown size={13} />
            </m.div>
          )}
        </button>
      </header>
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
