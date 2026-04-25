"use client";

import { useState, useRef } from "react";
import type { Scent, ProductState, AspectRatio, GenerationMode, Asset } from "@/types";

interface Props {
  scent: Scent;
  onGenerated: (assets: Asset[], prompt: string) => void;
}

const PRODUCT_STATES: { value: ProductState; label: string }[] = [
  { value: "vial_only", label: "Vial Only" },
  { value: "case_with_vial", label: "Case + Vial" },
  { value: "case_only", label: "Case Only" },
  { value: "case_open", label: "Case Open" },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "9:16", label: "9:16" },
];

export default function GeneratePanel({ scent, onGenerated }: Props) {
  const [productState, setProductState] = useState<ProductState>("vial_only");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [generationMode, setGenerationMode] = useState<GenerationMode>("text");
  const [isOnBrandBoost, setIsOnBrandBoost] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadReference(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", "reference-images");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setReferenceUrl(data.url);
  }

  async function generate() {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scentId: scent.id,
        productState,
        aspectRatio,
        generationMode,
        referenceImageUrl: generationMode === "reference" ? referenceUrl : undefined,
        isOnBrandBoost,
      }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(data.error ?? "Generation failed");
      return;
    }

    onGenerated(data.assets, data.prompt);
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
      <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
        Generate Assets
      </h2>

      {/* Product State */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">Product State</label>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_STATES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setProductState(s.value)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                productState === s.value
                  ? "bg-white text-black font-medium"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">Aspect Ratio</label>
        <div className="flex gap-2">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setAspectRatio(r.value)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                aspectRatio === r.value
                  ? "bg-white text-black font-medium"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generation Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">Generation Mode</label>
        <div className="flex gap-2">
          {(["text", "reference"] as GenerationMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setGenerationMode(m)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                generationMode === m
                  ? "bg-white text-black font-medium"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Reference Image Upload */}
      {generationMode === "reference" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-400 uppercase tracking-wide">
            Reference Image
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadReference(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="border border-dashed border-zinc-600 rounded p-4 text-sm text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            {uploading
              ? "Uploading…"
              : referenceUrl
              ? "Reference uploaded — click to replace"
              : "Click to upload vial or case reference image"}
          </button>
          {referenceUrl && (
            <img
              src={referenceUrl}
              alt="Reference"
              className="w-24 h-24 object-cover rounded border border-zinc-700"
            />
          )}
        </div>
      )}

      {/* On Brand Boost */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setIsOnBrandBoost((v) => !v)}
          className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
            isOnBrandBoost ? "bg-white" : "bg-zinc-700"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full transition-transform ${
              isOnBrandBoost ? "translate-x-5 bg-black" : "translate-x-0 bg-zinc-400"
            }`}
          />
        </div>
        <span className="text-sm text-zinc-300">Make More On Brand</span>
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="button"
        onClick={generate}
        disabled={generating || (generationMode === "reference" && !referenceUrl)}
        className="bg-white text-black font-semibold text-sm px-6 py-2.5 rounded hover:bg-zinc-200 transition-colors disabled:opacity-40"
      >
        {generating ? "Generating 4 images…" : "Generate Assets"}
      </button>

      {generating && (
        <p className="text-xs text-zinc-500">
          This can take up to 60 seconds for 4 variations.
        </p>
      )}
    </div>
  );
}
