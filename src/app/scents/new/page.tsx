import Link from "next/link";
import ScentForm from "@/components/ScentForm";

export default function NewScentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-zinc-500 text-sm hover:text-white transition-colors">
          ← Scents
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">New Scent</h1>
      </div>
      <ScentForm />
    </div>
  );
}
