-- Migration to add popularity and type columns
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS popularity numeric;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS type text;
