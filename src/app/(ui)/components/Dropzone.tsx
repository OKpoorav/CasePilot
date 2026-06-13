"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

const ACCEPT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

type Phase = "idle" | "uploading" | "registering" | "error";

/** Presigned direct-to-R2 upload, then register + kick off ingestion (PRD F1.1, FRONTEND_DESIGN §7.1). */
export function Dropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!ACCEPT[file.type]) {
        setError("Upload a PDF or DOCX contract.");
        setPhase("error");
        return;
      }
      try {
        setPhase("uploading");
        const presignRes = await fetch("/api/contracts/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        if (!presignRes.ok) throw new Error(`presign failed (${presignRes.status})`);
        const presign = await presignRes.json();

        const putRes = await fetch(presign.url, {
          method: "PUT",
          headers: { "content-type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error(`storage upload failed (${putRes.status})`);

        setPhase("registering");
        const regRes = await fetch("/api/contracts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            r2Key: presign.key,
            title: file.name.replace(/\.[^.]+$/, ""),
            originalFilename: file.name,
            mimeType: file.type,
          }),
        });
        if (!regRes.ok) throw new Error(`register failed (${regRes.status})`);
        const contract = await regRes.json();

        router.push(`/contracts/${contract.id}`);
      } catch (e) {
        // A failed cross-origin PUT throws a TypeError with no status — usually R2 CORS.
        const msg = e instanceof Error ? e.message : "unknown error";
        setError(`Upload failed: ${msg}. If this is the storage step, the R2 bucket CORS may not allow this origin.`);
        setPhase("error");
      }
    },
    [router],
  );

  const busy = phase === "uploading" || phase === "registering";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void handleFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      className={`group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center transition-colors ${
        dragging
          ? "border-[var(--claret)] bg-[color-mix(in_srgb,var(--claret)_5%,var(--paper-2))]"
          : "border-[var(--paper-edge)] bg-[var(--paper-2)] hover:border-[var(--claret)]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={Object.values(ACCEPT).join(",")}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {/* Upload glyph — neutral, shifts to claret on hover/drag */}
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--paper-edge)] bg-[var(--paper)] transition-colors group-hover:border-[var(--claret)]"
        style={{ color: dragging ? "var(--claret)" : "var(--ink-3)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`transition-colors group-hover:stroke-[var(--claret)] ${busy ? "animate-pulse" : ""}`}>
          <path d="M12 16V4" />
          <path d="M7 9l5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      </div>

      <p className="text-xl text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
        {busy
          ? phase === "uploading"
            ? "Uploading contract…"
            : "Filing & starting analysis…"
          : "Drop a contract here"}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-3)]">
        {busy ? "Please wait…" : "PDF or DOCX · up to 100 pages"}
      </p>

      {!busy && (
        <span className="mt-4 text-sm text-[var(--claret)] underline-offset-4 group-hover:underline">
          or click to browse
        </span>
      )}
      {error && <p className="mt-3 text-sm text-[var(--risk-critical)]">{error}</p>}
    </div>
  );
}
