import React from 'react';

export default function ModeSelector({ mode, setMode }) {
  return (
    <div className="translator-card translator-rounded translator-border shadow-sm p-2 flex gap-2">
      <button
        onClick={() => setMode("text")}
        aria-pressed={mode === "text"}
        className={`flex-1 translator-rounded-md px-4 py-3 font-medium transition-all flex items-center justify-center gap-2 ${
          mode === "text"
            ? "translator-primary shadow"
            : "translator-muted translator-text-foreground hover:opacity-90"
        }`}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H6a1 1 0 110-2V4zm3 1h2v2H7V5zm0 3h2v2H7V8zm0 3h2v2H7v-2zm3-6h2v2h-2V5zm0 3h2v2h-2V8zm0 3h2v2h-2v-2z" />
        </svg>
        Text Translation
      </button>
      <button
        onClick={() => setMode("file")}
        aria-pressed={mode === "file"}
        className={`flex-1 translator-rounded-md px-4 py-3 font-medium transition-all flex items-center justify-center gap-2 ${
          mode === "file"
            ? "translator-primary shadow"
            : "translator-muted translator-text-foreground hover:opacity-90"
        }`}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0zM15 7a2 2 0 11-4 0 2 2 0 014 0zM2.5 9a1 1 0 100-2 1 1 0 000 2zM12.683 15.007a2 2 0 10-1.414-3.414l-5.57 5.57a1 1 0 000 1.414l1.414 1.414a1 1 0 001.414 0l5.57-5.57z" />
        </svg>
        File Translation
      </button>
    </div>
  );
}