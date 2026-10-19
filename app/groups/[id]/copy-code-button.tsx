"use client";

import { useState } from "react";

// Shows the invite code; tapping it copies the code to the clipboard.
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS on a phone). The code is
      // still visible, so people can copy it by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex min-h-14 w-full items-center justify-between rounded-lg border border-foreground/15 px-4 py-3 text-left hover:bg-foreground/5"
    >
      <span className="flex flex-col">
        <span className="text-xs text-foreground/60">Invite code</span>
        <span className="font-mono text-xl tracking-widest">{code}</span>
      </span>
      <span aria-live="polite" className="text-sm text-foreground/70">
        {copied ? "Copied!" : "Tap to copy"}
      </span>
    </button>
  );
}
