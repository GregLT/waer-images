import type { Scent, ProductState, AspectRatio } from "@/types";

interface ScenePromptOptions {
  scent: Scent;
  productState: ProductState;
  aspectRatio: AspectRatio;
  isOnBrandBoost?: boolean;
}

const PRODUCT_EXCLUSION =
  "absolutely no vial, no bottle, no glass tube, no fragrance container, no product object of any kind anywhere in the image";

const CENTER_RESERVE =
  "leave a completely clear empty centre zone in the image — this space will be used for product placement in post-production, nothing must overlap this centre area";

const LIGHTING =
  "bright directional studio lighting, clean highlights, soft shadows, fashion editorial aesthetic";

const CAMERA = "85mm lens, medium format, f/2.8, shallow depth of field, editorial";

const ON_BRAND_BOOST =
  "youthful, colour-forward, sensory, playful, fashion-led, graphic, tactile, modern, slightly surreal — avoid generic luxury perfume styling";

const STATE_CONTEXT: Record<ProductState, string> = {
  vial_only:
    "clean minimalist editorial backdrop with open negative space at the centre",
  case_with_vial:
    "editorial still-life scene with a brushed metal WAER travel case object placed in the background slightly offset left or right, centre remains clear",
  case_only:
    "clean industrial editorial surface, focus on material texture and directional light, clear open centre",
  case_open:
    "editorial backdrop with a partially open brushed metal case softly suggested in the background, centre clear for product placement",
};

export function generateScenePrompt({
  scent,
  productState,
  isOnBrandBoost = false,
}: ScenePromptOptions): string {
  const backgroundSection =
    scent.background_palette.length > 0
      ? `bold soft gradient background using ${scent.background_palette.join(", ")}, clean and minimal`
      : "clean minimal gradient background";

  const ingredientSection =
    productState !== "case_only" && scent.hero_ingredients.length > 0
      ? `${scent.hero_ingredients.join(", ")} arranged in a playful graphic composition around the outer edges and corners of the frame — ingredients float around the perimeter only, nothing enters the centre zone`
      : null;

  const parts = [
    "Abstract editorial backdrop for fragrance product photography",
    STATE_CONTEXT[productState],
    backgroundSection,
    ingredientSection,
    LIGHTING,
    CAMERA,
    PRODUCT_EXCLUSION,
    CENTER_RESERVE,
    isOnBrandBoost ? ON_BRAND_BOOST : null,
  ].filter(Boolean);

  return parts.join(". ");
}
