import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const scentId = searchParams.get("scentId");

  let query = supabase
    .from("assets")
    .select("*, scent:scents(id, name, primary_colour, secondary_colour)")
    .order("created_at", { ascending: false });

  if (scentId) {
    query = query.eq("scent_id", scentId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
