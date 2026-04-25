export type ProductState =
  | "vial_only"
  | "case_with_vial"
  | "case_only"
  | "case_open";

export type GenerationMode =
  | "scene_plus_locked_product"
  | "ai_full_generation"
  | "reference_edit";

export type AspectRatio = "1:1" | "4:5" | "9:16";

export interface Scent {
  id: string;
  name: string;
  primary_colour: string;
  secondary_colour: string;
  hero_ingredients: string[];
  mood: string;
  background_palette: string[];
  vial_png_url: string | null;
  case_png_url: string | null;
  open_case_png_url: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  scent_id: string;
  product_state: ProductState;
  prompt: string;
  scene_prompt: string | null;
  product_png_url: string | null;
  image_url: string;
  aspect_ratio: AspectRatio;
  generation_mode: GenerationMode;
  is_favourite: boolean;
  created_at: string;
  scent?: Pick<Scent, "id" | "name" | "primary_colour" | "secondary_colour">;
}

export interface GenerateRequest {
  scentId: string;
  productState: ProductState;
  aspectRatio: AspectRatio;
  generationMode: GenerationMode;
  referenceImageUrl?: string;
  isOnBrandBoost?: boolean;
  addShadow?: boolean;
}

export interface GenerateResponse {
  assets: Asset[];
  prompt: string;
}
