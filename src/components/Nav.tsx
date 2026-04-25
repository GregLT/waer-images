import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-white font-semibold tracking-widest text-sm">
        WAER
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">
          Scents
        </Link>
        <Link href="/gallery" className="text-zinc-400 hover:text-white text-sm transition-colors">
          Gallery
        </Link>
      </div>
    </nav>
  );
}
