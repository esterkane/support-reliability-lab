"use client";

import { useState } from "react";

interface Result {
  status: number;
  body: unknown;
}

/**
 * Interactive reproduction for the payload-too-large incident: POST a small body
 * (accepted) or one over the limit (413) and see the exact platform response.
 */
export function UploadDemo({ limitBytes }: { limitBytes: number }) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(bytes: number) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: new Uint8Array(bytes),
      });
      setResult({ status: res.status, body: await res.json() });
    } finally {
      setBusy(false);
    }
  }

  const ok = result?.status === 200;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Reproduce the upload</h3>
      <p className="muted">
        Limit is {limitBytes.toLocaleString()} bytes. Send a body under or over it.
      </p>
      <div className="row" style={{ justifyContent: "flex-start", gap: "0.6rem" }}>
        <button disabled={busy} onClick={() => send(Math.floor(limitBytes / 2))}>
          Send {Math.floor(limitBytes / 2).toLocaleString()} B (ok)
        </button>
        <button disabled={busy} onClick={() => send(limitBytes * 2)}>
          Send {(limitBytes * 2).toLocaleString()} B (too large)
        </button>
      </div>
      {result && (
        <p style={{ marginBottom: 0 }}>
          <span className={`badge ${ok ? "ok" : "err"}`}>HTTP {result.status}</span>{" "}
          <code>{JSON.stringify(result.body)}</code>
        </p>
      )}
    </div>
  );
}
