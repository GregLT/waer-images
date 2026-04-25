import { createServerClient } from "@/lib/supabase/server";
import GalleryClient from "./GalleryClient";
import type { Scent } from "@/types";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const supabase = createServerClient();

  const [{ data: assets }, { data: scents }] = await Promise.all([
    supabase
      .from("assets")
      .select("*, scent:scents(id, name, primary_colour, secondary_colour)")
      .order("created_at", { ascending: false }),
    supabase.from("scents").select("id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
        <p className="text-zinc-400 text-sm mt-1">All generated assets</p>
      </div>
      <GalleryClient
        initialAssets={assets ?? []}
        scents={(scents ?? []) as Pick<Scent, "id" | "name">[]}
      />
    </div>
  );
}
