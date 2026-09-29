"use client";
import * as React from "react";
import { m, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
}

export function Panel({ title, defaultOpen = true, collapsible = true, className, children, ...props }: PanelProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("bg-rail border-b border-line flex flex-col", className)} {...props}>
      <header className={isOpen ? "border-b border-line/50" : ""}>
        <button
          aria-expanded={collapsible ? isOpen : undefined}
          className={cn("flex w-full items-center justify-between px-4 py-2 text-left transition-colors", collapsible && "cursor-pointer hover:bg-raised/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-line-strong")}
          disabled={!collapsible}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
        <h3 className="text-xs font-medium text-fg-2">{title}</h3>
        {collapsible && (
          <div className="text-fg-3">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
        </button>
      </header>
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
