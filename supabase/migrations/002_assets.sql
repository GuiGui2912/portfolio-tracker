-- ============================================================
-- 002_assets.sql — Actifs du portefeuille
-- ============================================================

CREATE TYPE asset_type AS ENUM ('crypto', 'stock', 'etf');

CREATE TABLE public.assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Identification
  symbol        TEXT NOT NULL,          -- 'BTC', 'AAPL', 'IWDA'
  name          TEXT NOT NULL,          -- 'Bitcoin', 'Apple Inc.'
  type          asset_type NOT NULL,

  -- Position actuelle (calculée depuis les transactions)
  qty           NUMERIC(20, 8) NOT NULL DEFAULT 0,

  -- Affichage
  color         TEXT NOT NULL DEFAULT '#C8A96E',

  -- Prix mis en cache (mis à jour par l'API)
  current_price NUMERIC(20, 8),
  price_change_24h NUMERIC(10, 4),      -- % variation 24h
  price_updated_at TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un symbole unique par utilisateur
  UNIQUE(user_id, symbol)
);

CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_symbol  ON public.assets(symbol);

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cache des prix (pour limiter les appels API)
CREATE TABLE public.price_cache (
  symbol       TEXT NOT NULL,
  asset_type   asset_type NOT NULL,
  price        NUMERIC(20, 8) NOT NULL,
  change_24h   NUMERIC(10, 4),
  change_pct   JSONB,                   -- { "1D":0.5, "1W":2.3, "1M":8.1, ... }
  history      JSONB,                   -- { "1S":[...], "1M":[...], ... }
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (symbol, asset_type)
);

CREATE INDEX idx_price_cache_fetched ON public.price_cache(fetched_at);
