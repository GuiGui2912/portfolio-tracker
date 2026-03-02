// ============================================================
// types/index.ts — Types TypeScript partagés
// ============================================================

export type AssetType = 'crypto' | 'stock' | 'etf'
export type Currency  = 'USD' | 'EUR'

export interface Profile {
  id:         string
  email:      string
  full_name:  string | null
  avatar_url: string | null
  currency:   Currency
  created_at: string
}

export interface Asset {
  id:               string
  user_id:          string
  symbol:           string
  name:             string
  type:             AssetType
  qty:              number
  color:            string
  current_price:    number | null
  price_change_24h: number | null
  price_updated_at: string | null
  created_at:       string
}

export interface Transaction {
  id:             string
  user_id:        string
  asset_id:       string
  type:           'buy' | 'sell'
  qty:            number
  price_per_unit: number
  total_cost:     number
  currency:       Currency
  executed_at:    string
  notes:          string | null
  created_at:     string
}

export interface Dividend {
  id:               string
  user_id:          string
  asset_id:         string
  amount:           number
  amount_per_share: number | null
  currency:         Currency
  received_at:      string
  notes:            string | null
  created_at:       string
}

export interface PriceCache {
  symbol:     string
  asset_type: AssetType
  price:      number
  change_24h: number | null
  change_pct: Record<string, number>   // { "1S": 0.5, "1M": 8.1, ... }
  history:    Record<string, number[]> // { "1S": [...], "1M": [...], ... }
  fetched_at: string
}

// Vue enrichie (asset + position calculée)
export interface AssetPosition extends Asset {
  avg_buy_price:  number
  total_invested: number
  current_value:  number
  pnl_amount:     number
  pnl_pct:        number
  history:        Record<string, number[]>
  dividends:      Dividend[]
  transactions:   Transaction[]
}

// Réponse API prix
export interface PriceData {
  symbol:    string
  price:     number
  change24h: number
  history:   Record<string, number[]>
}
