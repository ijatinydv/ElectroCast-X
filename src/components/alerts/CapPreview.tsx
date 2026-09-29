"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CapAlert } from "@/lib/i18n/cap";

// defines the generated payload and shared composer feedback callback for this preview
interface CapPreviewProps {
  cap: CapAlert;
  onCopied: (message: string) => void;
}

// separates JSON keys, strings, and numbers with a deliberately small local tokenizer
function highlightJson(json: string) {
  const tokenPattern = /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?/g;
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let match = tokenPattern.exec(json);

  while (match) {
    const token = match[0];
    if (match.index > cursor) nodes.push(json.slice(cursor, match.index));
    const isKey = /^"/.test(token) && /^\s*:/.test(json.slice(match.index + token.length));
    const className = isKey ? "text-fg-2" : /^"/.test(token) ? "text-observed" : "text-risk";
    nodes.push(<span className={className} key={`${match.index}-${token}`}>{token}</span>);
    cursor = match.index + token.length;
    match = tokenPattern.exec(json);
  }
  if (cursor < json.length) nodes.push(json.slice(cursor));
  return nodes;
}

// presents an inspectable CAP payload and copies the exact generated JSON when requested
export function CapPreview({ cap, onCopied }: CapPreviewProps) {
  const [copying, setCopying] = useState(false);
  const json = useMemo(() => JSON.stringify(cap, null, 2), [cap]);
  const highlightedJson = useMemo(() => highlightJson(json), [json]);

  // writes the rendered payload and routes confirmation through the composer toast
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopying(true);
      onCopied("CAP JSON copied");
      window.setTimeout(() => setCopying(false), 2_000);
    } catch {
      onCopied("Unable to copy CAP JSON");
    }
  };

  return (
    <section aria-label="CAP 1.2 JSON preview" className="border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="text-xs text-fg-2">CAP 1.2 JSON preview</p>
        <Button type="button" variant="outline" size="sm" onClick={copy} className="border-line bg-raised text-fg hover:bg-raised hover:text-fg">
          {copying ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copying ? "Copied" : "Copy JSON"}
        </Button>
      </div>
      <pre className="num max-h-80 overflow-auto p-3 text-xs leading-5 text-fg whitespace-pre-wrap">{highlightedJson}</pre>
    </section>
  );
}
