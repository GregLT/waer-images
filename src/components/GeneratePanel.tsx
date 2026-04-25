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

const GENERATION_MODES: {
  value: GenerationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "scene_plus_locked_product",
    label: "Scene + Locked Product",
    description: "Generate background, composite your locked PNG on top. Highest consistency.",
  },
  {
    value: "ai_full_generation",
    label: "AI Full Generation",
    description: "AI generates the complete image including the product from the prompt.",
  },
  {
    value: "reference_edit",
    label: "Reference Edit",
    description: "Provide a reference photo — AI uses it to anchor product proportions.",
  },
];

function resolveLockedPng(scent: Scent, productState: ProductState): string | null {
  switch (productState) {
    case "vial_only":
    case "case_with_vial":
      return scent.vial_png_url;
    case "case_only":
      return scent.case_png_url;
    case "case_open":
      return scent.open_case_png_url ?? scent.case_png_url;
  }
}

export default function GeneratePanel({ scent, onGenerated }: Props) {
  const [productState, setProductState] = useState<ProductState>("vial_only");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    "scene_plus_locked_product"
  );
  const [isOnBrandBoost, setIsOnBrandBoost] = useState(false);
  const [addShadow, setAddShadow] = useState(true);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const lockedPng = resolveLockedPng(scent, productState);
  const missingLockedPng =
    generationMode === "scene_plus_locked_product" && !lockedPng;

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
        referenceImageUrl: generationMode === "reference_edit" ? referenceUrl : undefined,
        isOnBrandBoost,
        addShadow,
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

  const canGenerate =
    !generating &&
    !missingLockedPng &&
    !(generationMode === "reference_edit" && !referenceUrl);

  return (
    <div className="flex flex-col gap-5 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
      <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
        Generate Assets
      </h2>

      {/* Generation Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">
          Generation Mode
        </label>
        <div className="flex flex-col gap-2">
          {GENERATION_MODES.map((m) => {
            const active = generationMode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setGenerationMode(m.value)}
                className={`text-left px-3 py-2.5 rounded border text-sm transition-colors ${
                  active
                    ? "border-white bg-white/5 text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                <span className="font-medium">
                  {m.label}
                  {m.value === "scene_plus_locked_product" && (
                    <span className="ml-2 text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">
                      recommended
                    </span>
                  )}
                </span>
                <span className="block text-xs text-zinc-500 mt-0.5">{m.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Locked PNG status */}
      {generationMode === "scene_plus_locked_product" && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded text-xs ${
            lockedPng
              ? "bg-emerald-950 border border-emerald-800 text-emerald-400"
              : "bg-red-950 border border-red-900 text-red-400"
          }`}
        >
          <span>{lockedPng ? "✓" : "✕"}</span>
          <span>
            {lockedPng
              ? "Locked product PNG ready"
              : `No locked PNG for "${productState.replace(/_/g, " ")}". Upload one in Edit Scent.`}
          </span>
        </div>
      )}

      {/* Product State */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wide">
          Product State
        </label>
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
        <label className="text-xs text-zinc-400 uppercase tracking-wide">
          Aspect Ratio
        </label>
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

      {/* Reference Image Upload — reference_edit mode only */}
      {generationMode === "reference_edit" && (
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
              : "Click to upload reference image"}
          </button>
          {referenceUrl && (
            <img
              src={referenceUrl}
              alt="Reference"
              className="w-20 h-20 object-cover rounded border border-zinc-700"
            />
          )}
        </div>
      )}

      {/* Shadow toggle — scene_plus_locked_product only */}
      {generationMode === "scene_plus_locked_product" && (
        <Toggle
          label="Add contact shadow"
          value={addShadow}
          onChange={setAddShadow}
        />
      )}

      {/* On Brand Boost */}
      <Toggle
        label="Make More On Brand"
        value={isOnBrandBoost}
        onChange={setIsOnBrandBoost}
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="button"
        onClick={generate}
        disabled={!canGenerate}
        className="bg-white text-black font-semibold text-sm px-6 py-2.5 rounded hover:bg-zinc-200 transition-colors disabled:opacity-40"
      >
        {generating ? "Generating 4 images…" : "Generate Assets"}
      </button>

      {generating && (
        <p className="text-xs text-zinc-500">
          Scene generation + compositing — typically 30–60 seconds.
        </p>
      )}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
          value ? "bg-white" : "bg-zinc-700"
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full transition-transform ${
            value ? "translate-x-5 bg-black" : "translate-x-0 bg-zinc-400"
          }`}
        />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}
