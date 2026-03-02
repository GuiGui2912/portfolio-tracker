-- ============================================================
-- 003_transactions.sql — Historique des achats/ventes
-- ============================================================

CREATE TYPE transaction_type AS ENUM ('buy', 'sell');

CREATE TABLE public.transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id      UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,

  type          transaction_type NOT NULL,
  qty           NUMERIC(20, 8) NOT NULL CHECK (qty > 0),
  price_per_unit NUMERIC(20, 8) NOT NULL CHECK (price_per_unit > 0),
  total_cost    NUMERIC(20, 8) GENERATED ALWAYS AS (qty * price_per_unit) STORED,
  currency      TEXT NOT NULL DEFAULT 'USD',

  executed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- date/heure d'achat
  notes         TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id  ON public.transactions(user_id);
CREATE INDEX idx_transactions_asset_id ON public.transactions(asset_id);
CREATE INDEX idx_transactions_executed ON public.transactions(executed_at DESC);

-- Vue : prix moyen d'achat par actif (méthode FIFO simplifiée)
CREATE VIEW public.asset_positions AS
SELECT
  a.id          AS asset_id,
  a.user_id,
  a.symbol,
  a.name,
  a.type,
  a.color,
  a.current_price,
  a.price_change_24h,
  -- Quantité nette (achats - ventes)
  COALESCE(SUM(
    CASE t.type
      WHEN 'buy'  THEN  t.qty
      WHEN 'sell' THEN -t.qty
    END
  ), 0) AS qty,
  -- Prix moyen d'achat pondéré
  CASE
    WHEN SUM(CASE WHEN t.type='buy' THEN t.qty ELSE 0 END) > 0
    THEN SUM(CASE WHEN t.type='buy' THEN t.qty * t.price_per_unit ELSE 0 END)
       / SUM(CASE WHEN t.type='buy' THEN t.qty ELSE 0 END)
    ELSE 0
  END AS avg_buy_price,
  -- Coût total investi
  SUM(CASE WHEN t.type='buy' THEN t.total_cost ELSE 0 END) AS total_invested
FROM public.assets a
LEFT JOIN public.transactions t ON t.asset_id = a.id
GROUP BY a.id, a.user_id, a.symbol, a.name, a.type, a.color,
         a.current_price, a.price_change_24h;

-- ============================================================
-- 004_dividends.sql — Dividendes reçus
-- ============================================================

CREATE TABLE public.dividends (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id      UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,

  amount        NUMERIC(20, 8) NOT NULL CHECK (amount > 0),
  amount_per_share NUMERIC(20, 8),
  currency      TEXT NOT NULL DEFAULT 'USD',
  received_at   DATE NOT NULL,
  notes         TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dividends_user_id  ON public.dividends(user_id);
CREATE INDEX idx_dividends_asset_id ON public.dividends(asset_id);
CREATE INDEX idx_dividends_received ON public.dividends(received_at DESC);
