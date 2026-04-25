"use client";

import { useState } from "react";
import GeneratePanel from "@/components/GeneratePanel";
import AssetCard from "@/components/AssetCard";
import type { Scent, Asset } from "@/types";

interface Props {
  scent: Scent;
  initialAssets: Asset[];
}

export default function ScentDetailClient({ scent, initialAssets }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  function onGenerated(newAssets: Asset[], prompt: string) {
    setAssets((prev) => [...newAssets, ...prev]);
    setLastPrompt(prompt);
    setShowPrompt(true);
  }

  function onDelete(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  function onFavouriteToggle(updated: Asset) {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GeneratePanel scent={scent} onGenerated={onGenerated} />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {lastPrompt && showPrompt && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Last Prompt</p>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="text-zinc-600 hover:text-zinc-300 text-xs"
                >
                  hide
                </button>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-mono">{lastPrompt}</p>
            </div>
          )}

          {assets.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-lg p-12 text-center flex items-center justify-center h-full min-h-[200px]">
              <p className="text-zinc-500 text-sm">No assets yet — generate some above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDelete={onDelete}
                  onFavouriteToggle={onFavouriteToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
