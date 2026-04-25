import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { generatePrompt } from "@/lib/prompt";
import { generateScenePrompt } from "@/lib/scene-prompt";
import { compositeProductOnScene, resolveProductPngUrl } from "@/lib/composite";
import type { GenerateRequest, ProductState, AspectRatio } from "@/types";

const SIZE_MAP: Record<AspectRatio, "1024x1024" | "1024x1536" | "1536x1024"> = {
  "1:1": "1024x1024",
  "4:5": "1024x1024",
  "9:16": "1024x1536",
};

// Extract raw image buffer from an OpenAI image object
async function getImageBuffer(img: {
  url?: string | null;
  b64_json?: string | null;
}): Promise<Buffer> {
  if (img.b64_json) return Buffer.from(img.b64_json, "base64");
  if (img.url) {
    const res = await fetch(img.url);
    if (!res.ok) throw new Error(`Failed to fetch generated image (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("No image data in OpenAI response");
}

// Upload a buffer to Supabase Storage and return public URL
async function uploadBuffer(
  supabase: ReturnType<typeof createServerClient>,
  buffer: Buffer,
  scentId: string,
  index: number
): Promise<string> {
  const fileName = `${scentId}/${Date.now()}-${index}.png`;
  const { error } = await supabase.storage
    .from("generated-assets")
    .upload(fileName, buffer, { contentType: "image/png", upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from("generated-assets").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const {
      scentId,
      productState,
      aspectRatio,
      generationMode,
      referenceImageUrl,
      isOnBrandBoost = false,
      addShadow = true,
    } = body;

    if (!scentId || !productState || !aspectRatio || !generationMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: scent, error: scentError } = await supabase
      .from("scents")
      .select("*")
      .eq("id", scentId)
      .single();

    if (scentError || !scent) {
      return NextResponse.json({ error: "Scent not found" }, { status: 404 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const size = SIZE_MAP[aspectRatio as AspectRatio] ?? "1024x1024";

    // ── Mode: scene_plus_locked_product ──────────────────────────────────────
    if (generationMode === "scene_plus_locked_product") {
      const productPngUrl = resolveProductPngUrl(scent, productState);
      if (!productPngUrl) {
        return NextResponse.json(
          {
            error: `No locked product PNG found for state "${productState}". Upload a product PNG in the scent settings first.`,
          },
          { status: 400 }
        );
      }

      const scenePrompt = generateScenePrompt({
        scent,
        productState: productState as ProductState,
        aspectRatio: aspectRatio as AspectRatio,
        isOnBrandBoost,
      });

      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: scenePrompt,
        size,
        n: 4,
      });

      const savedAssets = await Promise.all(
        (result.data ?? []).map(async (img, index) => {
          const sceneBuffer = await getImageBuffer(img);

          const composited = await compositeProductOnScene({
            sceneBuffer,
            productPngUrl,
            aspectRatio: aspectRatio as AspectRatio,
            addShadow,
          });

          const imageUrl = await uploadBuffer(supabase, composited, scentId, index);

          const { data: asset, error: dbError } = await supabase
            .from("assets")
            .insert({
              scent_id: scentId,
              product_state: productState,
              prompt: scenePrompt,
              scene_prompt: scenePrompt,
              product_png_url: productPngUrl,
              image_url: imageUrl,
              aspect_ratio: aspectRatio,
              generation_mode: generationMode,
            })
            .select()
            .single();

          if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);
          return asset;
        })
      );

      return NextResponse.json({ assets: savedAssets, prompt: scenePrompt });
    }

    // ── Mode: reference_edit ─────────────────────────────────────────────────
    if (generationMode === "reference_edit") {
      if (!referenceImageUrl) {
        return NextResponse.json(
          { error: "referenceImageUrl is required for reference_edit mode" },
          { status: 400 }
        );
      }

      const prompt = generatePrompt({
        scent,
        productState: productState as ProductState,
        aspectRatio: aspectRatio as AspectRatio,
        isOnBrandBoost,
      });

      const refRes = await fetch(referenceImageUrl);
      if (!refRes.ok) throw new Error(`Failed to fetch reference image (${refRes.status})`);
      const refBlob = await refRes.blob();
      const refFile = new File([refBlob], "reference.png", { type: refBlob.type });

      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        // @ts-expect-error – image param is valid for gpt-image-1
        image: [refFile],
        size,
        n: 4,
      });

      const savedAssets = await Promise.all(
        (result.data ?? []).map(async (img, index) => {
          const buffer = await getImageBuffer(img);
          const imageUrl = await uploadBuffer(supabase, buffer, scentId, index);

          const { data: asset, error: dbError } = await supabase
            .from("assets")
            .insert({
              scent_id: scentId,
              product_state: productState,
              prompt,
              image_url: imageUrl,
              aspect_ratio: aspectRatio,
              generation_mode: generationMode,
            })
            .select()
            .single();

          if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);
          return asset;
        })
      );

      return NextResponse.json({ assets: savedAssets, prompt });
    }

    // ── Mode: ai_full_generation ─────────────────────────────────────────────
    const prompt = generatePrompt({
      scent,
      productState: productState as ProductState,
      aspectRatio: aspectRatio as AspectRatio,
      isOnBrandBoost,
    });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      n: 4,
    });

    const savedAssets = await Promise.all(
      (result.data ?? []).map(async (img, index) => {
        const buffer = await getImageBuffer(img);
        const imageUrl = await uploadBuffer(supabase, buffer, scentId, index);

        const { data: asset, error: dbError } = await supabase
          .from("assets")
          .insert({
            scent_id: scentId,
            product_state: productState,
            prompt,
            image_url: imageUrl,
            aspect_ratio: aspectRatio,
            generation_mode: generationMode,
          })
          .select()
          .single();

        if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);
        return asset;
      })
    );

    return NextResponse.json({ assets: savedAssets, prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
