-- ============================================================
-- 005_rls_policies.sql — Sécurité Row Level Security
-- Chaque utilisateur ne voit QUE ses propres données
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividends    ENABLE ROW LEVEL SECURITY;

-- ── Profiles ─────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Assets ───────────────────────────────────────────────────
CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- ── Transactions ─────────────────────────────────────────────
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ── Dividends ────────────────────────────────────────────────
CREATE POLICY "Users can view own dividends"
  ON public.dividends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dividends"
  ON public.dividends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dividends"
  ON public.dividends FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dividends"
  ON public.dividends FOR DELETE
  USING (auth.uid() = user_id);

-- ── Price cache (lecture publique, écriture service uniquement) ──
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price cache"
  ON public.price_cache FOR SELECT
  USING (true);

-- Seul le service role peut écrire (via API route Next.js)
CREATE POLICY "Service role can upsert price cache"
  ON public.price_cache FOR ALL
  USING (auth.role() = 'service_role');
