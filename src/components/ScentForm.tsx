"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ColourPicker from "./ColourPicker";
import TagInput from "./TagInput";
import PngUploadField from "./PngUploadField";
import type { Scent } from "@/types";

interface Props {
  initial?: Partial<Scent>;
  onSave?: (scent: Scent) => void;
}

const DEFAULTS = {
  name: "",
  primary_colour: "#ffffff",
  secondary_colour: "#000000",
  hero_ingredients: [] as string[],
  mood: "",
  background_palette: [] as string[],
  vial_png_url: "" as string,
  case_png_url: "" as string,
  open_case_png_url: "" as string,
};

export default function ScentForm({ initial, onSave }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...DEFAULTS,
    ...initial,
    vial_png_url: initial?.vial_png_url ?? "",
    case_png_url: initial?.case_png_url ?? "",
    open_case_png_url: initial?.open_case_png_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof DEFAULTS>(key: K, value: (typeof DEFAULTS)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const isEdit = !!initial?.id;
    const url = isEdit ? `/api/scents/${initial!.id}` : "/api/scents";
    const method = isEdit ? "PUT" : "POST";

    // Send null for empty optional URLs so they're stored as null in DB
    const payload = {
      ...form,
      vial_png_url: form.vial_png_url || null,
      case_png_url: form.case_png_url || null,
      open_case_png_url: form.open_case_png_url || null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setSaving(false);
      return;
    }

    onSave?.(data);
    router.push(`/scents/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-8 max-w-xl">
      {/* Basic info */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Scent Name
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Citrus Rain"
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ColourPicker
            label="Primary Colour (cap)"
            value={form.primary_colour}
            onChange={(v) => set("primary_colour", v)}
          />
          <ColourPicker
            label="Secondary Colour (logo)"
            value={form.secondary_colour}
            onChange={(v) => set("secondary_colour", v)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Mood
          </label>
          <input
            type="text"
            value={form.mood}
            onChange={(e) => set("mood", e.target.value)}
            placeholder="e.g. fresh, energetic, citrus-led"
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
          />
        </div>

        <TagInput
          label="Hero Ingredients"
          values={form.hero_ingredients}
          onChange={(v) => set("hero_ingredients", v)}
          placeholder="bergamot, lime, ginger..."
        />

        <TagInput
          label="Background Palette"
          values={form.background_palette}
          onChange={(v) => set("background_palette", v)}
          placeholder="#f0e6d3, pale orange..."
        />
      </div>

      {/* Locked product PNGs */}
      <div className="flex flex-col gap-4 p-4 border border-zinc-800 rounded-lg">
        <div>
          <p className="text-sm font-medium text-white">Locked Product PNGs</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Transparent PNG renders used by the Scene + Locked Product pipeline. Upload
            your locked product renders here to guarantee perfect consistency.
          </p>
        </div>

        <PngUploadField
          label="Vial PNG"
          description="Required for vial_only and case_with_vial generation"
          value={form.vial_png_url}
          onChange={(v) => set("vial_png_url", v as string)}
        />

        <PngUploadField
          label="Case PNG"
          description="Used for case_only and case_open generation"
          value={form.case_png_url}
          onChange={(v) => set("case_png_url", v as string)}
        />

        <PngUploadField
          label="Open Case PNG"
          description="Optional — falls back to Case PNG if not set"
          value={form.open_case_png_url}
          onChange={(v) => set("open_case_png_url", v as string)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-white text-black font-medium text-sm px-6 py-2.5 rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 self-start"
      >
        {saving ? "Saving…" : initial?.id ? "Update Scent" : "Create Scent"}
      </button>
    </form>
  );
}
