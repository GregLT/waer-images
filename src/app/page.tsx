import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { Scent } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: scents } = await supabase
    .from("scents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scents</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your fragrance library</p>
        </div>
        <Link
          href="/scents/new"
          className="bg-white text-black font-medium text-sm px-4 py-2 rounded hover:bg-zinc-200 transition-colors"
        >
          + New Scent
        </Link>
      </div>

      {!scents || scents.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-lg p-12 text-center">
          <p className="text-zinc-400 text-sm">No scents yet.</p>
          <Link
            href="/scents/new"
            className="mt-4 inline-block text-white underline text-sm hover:text-zinc-300"
          >
            Create your first scent →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(scents as Scent[]).map((scent) => (
            <Link
              key={scent.id}
              href={`/scents/${scent.id}`}
              className="group border border-zinc-800 rounded-lg p-5 hover:border-zinc-600 transition-colors bg-zinc-950"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-5 h-5 rounded-full border border-zinc-700"
                  style={{ background: scent.primary_colour }}
                />
                <div
                  className="w-5 h-5 rounded-full border border-zinc-700"
                  style={{ background: scent.secondary_colour }}
                />
              </div>
              <h2 className="font-medium text-white group-hover:text-zinc-200">
                {scent.name}
              </h2>
              {scent.mood && (
                <p className="text-zinc-500 text-xs mt-1 truncate">{scent.mood}</p>
              )}
              {scent.hero_ingredients.length > 0 && (
                <p className="text-zinc-600 text-xs mt-2 truncate">
                  {scent.hero_ingredients.join(", ")}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
