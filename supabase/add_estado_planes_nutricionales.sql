-- Agrega estado activa/archivada para planes_nutricionales

ALTER TABLE public.planes_nutricionales
ADD COLUMN IF NOT EXISTS estado TEXT;

UPDATE public.planes_nutricionales
SET estado = 'activa'
WHERE estado IS NULL;

ALTER TABLE public.planes_nutricionales
ALTER COLUMN estado SET DEFAULT 'activa';

ALTER TABLE public.planes_nutricionales
ALTER COLUMN estado SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'planes_nutricionales_estado_check'
      AND conrelid = 'public.planes_nutricionales'::regclass
  ) THEN
    ALTER TABLE public.planes_nutricionales
    ADD CONSTRAINT planes_nutricionales_estado_check
    CHECK (estado IN ('activa', 'archivada'));
  END IF;
END $$;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at DESC, id DESC
  ) AS rn
  FROM public.planes_nutricionales
  WHERE estado = 'activa'
)
UPDATE public.planes_nutricionales p
SET estado = 'archivada'
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS planes_nutricionales_unica_activa_idx
  ON public.planes_nutricionales (user_id)
  WHERE estado = 'activa';

CREATE INDEX IF NOT EXISTS planes_nutricionales_user_estado_created_idx
  ON public.planes_nutricionales (user_id, estado, created_at DESC);
