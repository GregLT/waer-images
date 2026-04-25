import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import ScentForm from "@/components/ScentForm";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditScentPage({ params }: Props) {
  const supabase = createServerClient();
  const { data: scent, error } = await supabase
    .from("scents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !scent) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/scents/${params.id}`}
          className="text-zinc-500 text-sm hover:text-white transition-colors"
        >
          ← {scent.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Edit Scent</h1>
      </div>
      <ScentForm initial={scent} />
    </div>
  );
}
