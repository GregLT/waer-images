-- Migration 001: Locked product PNG support + generation mode expansion

-- Add locked product PNG columns to scents
alter table scents
  add column if not exists vial_png_url text,
  add column if not exists case_png_url text,
  add column if not exists open_case_png_url text;

-- Add compositing metadata columns to assets
alter table assets
  add column if not exists scene_prompt text,
  add column if not exists product_png_url text;

-- generation_mode values are now:
--   'scene_plus_locked_product'  (default – composited pipeline)
--   'ai_full_generation'         (text-to-image, no compositing)
--   'reference_edit'             (reference image input)
-- No enum constraint so no migration needed for existing text column.
