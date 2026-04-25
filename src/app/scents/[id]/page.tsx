import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import ScentDetailClient from "./ScentDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function ScentDetailPage({ params }: Props) {
  const supabase = createServerClient();

  const { data: scent, error } = await supabase
    .from("scents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !scent) notFound();

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("scent_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-zinc-500 text-sm hover:text-white transition-colors">
            ← Scents
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">{scent.name}</h1>
          {scent.mood && <p className="text-zinc-400 text-sm mt-1">{scent.mood}</p>}
        </div>
        <Link
          href={`/scents/${params.id}/edit`}
          className="border border-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded hover:border-white hover:text-white transition-colors"
        >
          Edit Scent
        </Link>
      </div>

      {/* Scent meta */}
      <div className="flex flex-wrap gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border border-zinc-700"
            style={{ background: scent.primary_colour }}
          />
          <span className="text-xs text-zinc-400">Cap: {scent.primary_colour}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border border-zinc-700"
            style={{ background: scent.secondary_colour }}
          />
          <span className="text-xs text-zinc-400">Logo: {scent.secondary_colour}</span>
        </div>
        {scent.hero_ingredients.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {scent.hero_ingredients.map((ing: string) => (
              <span
                key={ing}
                className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded"
              >
                {ing}
              </span>
            ))}
          </div>
        )}
        {scent.background_palette.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {scent.background_palette.map((col: string) => (
              <div
                key={col}
                className="w-5 h-5 rounded-sm border border-zinc-700"
                style={{ background: col }}
                title={col}
              />
            ))}
          </div>
        )}
      </div>

      <ScentDetailClient scent={scent} initialAssets={assets ?? []} />
    </div>
  );
}
