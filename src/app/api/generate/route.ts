import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { generatePrompt } from "@/lib/prompt";
import type { GenerateRequest, ProductState, AspectRatio, GenerationMode } from "@/types";

const ASPECT_RATIO_TO_SIZE: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
  "1:1": "1024x1024",
  "4:5": "1024x1024",
  "9:16": "1024x1536",
};

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { scentId, productState, aspectRatio, generationMode, referenceImageUrl, isOnBrandBoost } = body;

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

    const prompt = generatePrompt({
      scent,
      productState: productState as ProductState,
      aspectRatio: aspectRatio as AspectRatio,
      isOnBrandBoost: isOnBrandBoost ?? false,
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const size = ASPECT_RATIO_TO_SIZE[aspectRatio] ?? "1024x1024";

    let result;

    if (generationMode === "reference" && referenceImageUrl) {
      const imageResponse = await fetch(referenceImageUrl);
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], "reference.png", { type: imageBlob.type });

      result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        // @ts-expect-error – image param is valid for gpt-image-1
        image: [imageFile],
        size,
        n: 4,
      });
    } else {
      result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size,
        n: 4,
      });
    }

    const savedAssets = await Promise.all(
      (result.data ?? []).map(async (img, index) => {
        let storageUrl: string;

        if (img.url) {
          const imgResponse = await fetch(img.url);
          const imgBlob = await imgResponse.blob();
          const fileName = `${scentId}/${Date.now()}-${index}.png`;

          const { error: uploadError } = await supabase.storage
            .from("generated-assets")
            .upload(fileName, imgBlob, { contentType: "image/png", upsert: false });

          if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

          const { data: publicData } = supabase.storage
            .from("generated-assets")
            .getPublicUrl(fileName);

          storageUrl = publicData.publicUrl;
        } else if (img.b64_json) {
          const binary = Buffer.from(img.b64_json, "base64");
          const fileName = `${scentId}/${Date.now()}-${index}.png`;

          const { error: uploadError } = await supabase.storage
            .from("generated-assets")
            .upload(fileName, binary, { contentType: "image/png", upsert: false });

          if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

          const { data: publicData } = supabase.storage
            .from("generated-assets")
            .getPublicUrl(fileName);

          storageUrl = publicData.publicUrl;
        } else {
          throw new Error("No image data in OpenAI response");
        }

        const { data: asset, error: dbError } = await supabase
          .from("assets")
          .insert({
            scent_id: scentId,
            product_state: productState,
            prompt,
            image_url: storageUrl,
            aspect_ratio: aspectRatio,
            generation_mode: generationMode as GenerationMode,
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
