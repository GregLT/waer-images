import type { Scent, ProductState, AspectRatio } from "@/types";

interface PromptOptions {
  scent: Scent;
  productState: ProductState;
  aspectRatio: AspectRatio;
  isOnBrandBoost?: boolean;
}

const BASE_PROMPT =
  "Editorial product photography of a modern WAER fragrance vial, transparent glass tube filled with liquid, ultra-clean industrial design, sharp glass reflections, premium contemporary fragrance aesthetic, hyper-realistic, 8k, standing upright and perfectly straight, logo legible, no distortion, no objects directly behind the vial";

const CAMERA =
  "85mm lens, medium format, f/2.8, shallow depth of field, high detail";

const LIGHTING =
  "Bright directional lighting with clean highlights, soft shadows, luminous reflections through glass, fashion editorial aesthetic";

const ON_BRAND_BOOST =
  "Make the image more aligned with WAER's brand world: youthful, colour-forward, sensory, playful, fashion-led, graphic, tactile, modern, slightly surreal. Avoid generic luxury perfume styling.";

const PRODUCT_STATE_RULES: Record<ProductState, string> = {
  vial_only:
    "The vial is the sole hero object, centered, dominant, clean composition",
  case_with_vial:
    "A brushed metal travel case with subtle WAER engraving is placed slightly behind or offset from the vial, acting as a neutral anchor, both objects visible, vial remains the focal point",
  case_only:
    "Minimal product photography of a brushed metal travel case, clean industrial design, focus on form, material and light, no ingredients",
  case_open:
    "Travel case slightly open revealing the vial inside, precise alignment, engineered feel, soft internal shadows, premium product design aesthetic",
};

export function generatePrompt({
  scent,
  productState,
  isOnBrandBoost = false,
}: PromptOptions): string {
  const colourRules = [
    `The vial has a glossy pump cap in ${scent.primary_colour}.`,
    `The WAER vertical logo is printed in ${scent.secondary_colour}.`,
    "Do not swap these colours.",
    "Do not apply the primary colour to the logo.",
    "Do not apply the secondary colour to the cap.",
  ].join(" ");

  const ingredientSection =
    productState !== "case_only" && scent.hero_ingredients.length > 0
      ? `Surrounded by ${scent.hero_ingredients.join(", ")} arranged in a playful, slightly surreal, graphic composition, ingredients interacting around the base or floating, not obstructing the product silhouette`
      : null;

  const backgroundSection =
    scent.background_palette.length > 0
      ? `Background is a bold soft gradient using colours from ${scent.background_palette.join(", ")}, clean, minimal, no clutter behind product`
      : null;

  const parts = [
    BASE_PROMPT,
    PRODUCT_STATE_RULES[productState],
    colourRules,
    ingredientSection,
    backgroundSection,
    LIGHTING,
    CAMERA,
    isOnBrandBoost ? ON_BRAND_BOOST : null,
  ].filter(Boolean);

  return parts.join(". ");
}
