"use client";

import { useRef, useState } from "react";

interface Props {
  label: string;
  description: string;
  value: string | null;
  onChange: (url: string) => void;
}

export default function PngUploadField({ label, description, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "reference-images");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    onChange(data.url);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={value}
            alt={label}
            className="w-12 h-12 object-contain rounded border border-zinc-700 bg-zinc-950"
          />
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => ref.current?.click()}
          className="border border-dashed border-zinc-600 rounded px-3 py-2 text-xs text-zinc-400 hover:border-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        >
          {uploading ? "Uploading…" : value ? "Replace PNG" : "Upload PNG"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
