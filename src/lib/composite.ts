import sharp from "sharp";
import type { AspectRatio } from "@/types";

// Matches the sizes passed to OpenAI in the generate route
const CANVAS_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 },
  "4:5": { w: 1024, h: 1024 },
  "9:16": { w: 1024, h: 1536 },
};

// Product occupies this fraction of canvas height
const PRODUCT_HEIGHT_RATIO = 0.65;
// Bottom of product sits at this fraction from the top of the canvas
const BASELINE_RATIO = 0.86;

interface CompositeOptions {
  sceneBuffer: Buffer;
  productPngUrl: string;
  aspectRatio: AspectRatio;
  addShadow?: boolean;
}

export async function compositeProductOnScene({
  sceneBuffer,
  productPngUrl,
  aspectRatio,
  addShadow = true,
}: CompositeOptions): Promise<Buffer> {
  const { w, h } = CANVAS_DIMS[aspectRatio] ?? CANVAS_DIMS["1:1"];
  const targetH = Math.round(h * PRODUCT_HEIGHT_RATIO);
  const baseline = Math.round(h * BASELINE_RATIO);

  const productRes = await fetch(productPngUrl);
  if (!productRes.ok) {
    throw new Error(`Failed to fetch product PNG (${productRes.status}): ${productPngUrl}`);
  }
  const productBuf = Buffer.from(await productRes.arrayBuffer());

  // Derive target width from original aspect ratio, preserve transparency
  const meta = await sharp(productBuf).metadata();
  const origW = meta.width ?? 1;
  const origH = meta.height ?? 1;
  const targetW = Math.round(targetH * (origW / origH));

  const productResized = await sharp(productBuf)
    .resize(targetW, targetH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const left = Math.round((w - targetW) / 2);
  const top = Math.max(0, baseline - targetH);

  const layers: sharp.OverlayOptions[] = [];

  if (addShadow) {
    const sW = Math.round(targetW * 1.4);
    const sH = Math.max(16, Math.round(targetH * 0.055));
    // SVG ellipse — blurred in the next step to produce a soft contact shadow
    const svgEllipse = `<svg xmlns="http://www.w3.org/2000/svg" width="${sW}" height="${sH}">
      <ellipse cx="${sW / 2}" cy="${sH / 2}" rx="${sW / 2}" ry="${sH / 2}" fill="rgba(0,0,0,0.5)"/>
    </svg>`;

    const shadowBuf = await sharp(Buffer.from(svgEllipse))
      .blur(16)
      .png()
      .toBuffer();

    // Sit shadow at vial base — slight vertical overlap creates ground contact feel
    const sLeft = Math.round((w - sW) / 2);
    const sTop = baseline - Math.round(sH * 0.55);

    layers.push({ input: shadowBuf, top: sTop, left: sLeft });
  }

  layers.push({ input: productResized, top, left });

  return sharp(sceneBuffer).composite(layers).png().toBuffer();
}

// Select the correct locked PNG URL for a given product state
export function resolveProductPngUrl(
  scent: { vial_png_url?: string | null; case_png_url?: string | null; open_case_png_url?: string | null },
  productState: string
): string | null {
  switch (productState) {
    case "vial_only":
    case "case_with_vial":
      return scent.vial_png_url ?? null;
    case "case_only":
      return scent.case_png_url ?? null;
    case "case_open":
      return scent.open_case_png_url ?? scent.case_png_url ?? null;
    default:
      return null;
  }
}
