"use client";

import { useState } from "react";

// Shows the invite code, with a link-style button that copies it.
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
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-lavender-pale px-6 py-5">
      <span className="font-heading text-4xl tracking-[0.25em] text-lavender-ink">
        <span className="sr-only">Invite code: </span>
        {code}
      </span>
      <button
        type="button"
        onClick={copy}
        className="flex h-11 shrink-0 items-center text-lg text-lavender-ink"
      >
        <span aria-live="polite" className="border-b border-dashed border-lavender-ink">
          {copied ? "Copied!" : "Copy code"}
        </span>
      </button>
    </div>
  );
}
