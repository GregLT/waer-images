export type ProductState =
  | "vial_only"
  | "case_with_vial"
  | "case_only"
  | "case_open";

export type GenerationMode = "text" | "reference";

export type AspectRatio = "1:1" | "4:5" | "9:16";

export interface Scent {
  id: string;
  name: string;
  primary_colour: string;
  secondary_colour: string;
  hero_ingredients: string[];
  mood: string;
  background_palette: string[];
  created_at: string;
}

export interface Asset {
  id: string;
  scent_id: string;
  product_state: ProductState;
  prompt: string;
  image_url: string;
  aspect_ratio: AspectRatio;
  generation_mode: GenerationMode;
  created_at: string;
  scent?: Scent;
}

export interface GenerateRequest {
  scentId: string;
  productState: ProductState;
  aspectRatio: AspectRatio;
  generationMode: GenerationMode;
  referenceImageUrl?: string;
  isOnBrandBoost?: boolean;
}

export interface GenerateResponse {
  assets: Asset[];
  prompt: string;
}
