"use client";

import { useState } from "react";
import Image from "next/image";
import type { Asset } from "@/types";

interface Props {
  asset: Asset;
  showScent?: boolean;
  onDelete?: (id: string) => void;
  onFavouriteToggle?: (asset: Asset) => void;
}

export default function AssetCard({ asset, showScent, onDelete, onFavouriteToggle }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    onDelete?.(asset.id);
  }

  async function toggleFavourite() {
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favourite: !(asset as Asset & { is_favourite?: boolean }).is_favourite }),
    });
    const updated = await res.json();
    onFavouriteToggle?.(updated);
  }

  const isFav = (asset as Asset & { is_favourite?: boolean }).is_favourite;

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="relative aspect-square bg-zinc-950">
        <Image
          src={asset.image_url}
          alt={`${asset.product_state} – ${asset.scent?.name ?? ""}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {/* Overlay actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <a
          href={asset.image_url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-black text-xs font-medium px-3 py-1.5 rounded hover:bg-zinc-200 transition-colors"
        >
          Download
        </a>
        <button
          onClick={toggleFavourite}
          className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
            isFav
              ? "bg-yellow-400 text-black hover:bg-yellow-300"
              : "bg-zinc-700 text-white hover:bg-zinc-600"
          }`}
        >
          {isFav ? "Unfavourite" : "Favourite"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-red-500 transition-colors disabled:opacity-50"
        >
          {deleting ? "…" : confirmDelete ? "Confirm?" : "Delete"}
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div>
          {showScent && asset.scent && (
            <p className="text-xs text-zinc-400 truncate">{asset.scent.name}</p>
          )}
          <p className="text-xs text-zinc-500 capitalize">
            {asset.product_state.replace(/_/g, " ")} · {asset.aspect_ratio} ·{" "}
            {asset.generation_mode}
          </p>
        </div>
        {isFav && <span className="text-yellow-400 text-xs">★</span>}
      </div>
    </div>
  );
}
