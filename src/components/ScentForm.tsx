"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ColourPicker from "./ColourPicker";
import TagInput from "./TagInput";
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
};

export default function ScentForm({ initial, onSave }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ ...DEFAULTS, ...initial });
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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    <form onSubmit={submit} className="flex flex-col gap-6 max-w-xl">
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
