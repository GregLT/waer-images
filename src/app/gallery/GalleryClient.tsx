"use client";

import { useState, useMemo } from "react";
import AssetCard from "@/components/AssetCard";
import type { Asset, Scent, ProductState } from "@/types";

interface Props {
  initialAssets: Asset[];
  scents: Pick<Scent, "id" | "name">[];
}

const ALL = "__all__";

export default function GalleryClient({ initialAssets, scents }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [filterScent, setFilterScent] = useState(ALL);
  const [filterState, setFilterState] = useState<ProductState | typeof ALL>(ALL);
  const [filterFav, setFilterFav] = useState(false);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (filterScent !== ALL && a.scent_id !== filterScent) return false;
      if (filterState !== ALL && a.product_state !== filterState) return false;
      if (filterFav && !(a as Asset & { is_favourite?: boolean }).is_favourite) return false;
      return true;
    });
  }, [assets, filterScent, filterState, filterFav]);

  function onDelete(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  function onFavouriteToggle(updated: Asset) {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  const productStates: ProductState[] = ["vial_only", "case_with_vial", "case_only", "case_open"];

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500 uppercase tracking-wide">Scent</label>
          <select
            value={filterScent}
            onChange={(e) => setFilterScent(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-sm text-white rounded px-3 py-1.5 focus:outline-none focus:border-white"
          >
            <option value={ALL}>All Scents</option>
            {scents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500 uppercase tracking-wide">Product State</label>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as ProductState | typeof ALL)}
            className="bg-zinc-900 border border-zinc-700 text-sm text-white rounded px-3 py-1.5 focus:outline-none focus:border-white"
          >
            <option value={ALL}>All States</option>
            {productStates.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 justify-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterFav}
              onChange={(e) => setFilterFav(e.target.checked)}
              className="w-4 h-4 accent-white"
            />
            <span className="text-sm text-zinc-300">Favourites only</span>
          </label>
        </div>

        <div className="ml-auto self-end text-xs text-zinc-500">
          {filtered.length} / {assets.length} assets
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-500 text-sm">No assets match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              showScent
              onDelete={onDelete}
              onFavouriteToggle={onFavouriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
