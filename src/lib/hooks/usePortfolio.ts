// ============================================================
// lib/hooks/usePortfolio.ts
// Hook principal — actifs + prix temps réel + refresh auto
// ============================================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AssetPosition, PriceData } from '@/types'

const PRICE_REFRESH_INTERVAL = 60_000   // 60 secondes

export function usePortfolio() {
  const [assets,    setAssets]    = useState<AssetPosition[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ── Charger les actifs depuis Supabase ────────────────────
  const fetchAssets = useCallback(async () => {
    try {
      const res  = await fetch('/api/assets')
      if (!res.ok) throw new Error('Erreur chargement actifs')
      const data = await res.json()
      return data as AssetPosition[]
    } catch (e) {
      throw e
    }
  }, [])

  // ── Rafraîchir les prix via les APIs ─────────────────────
  const refreshPrices = useCallback(async (currentAssets: AssetPosition[]) => {
    if (!currentAssets.length) return currentAssets

    const cryptos = currentAssets.filter(a => a.type === 'crypto').map(a => a.symbol)
    const stocks  = currentAssets.filter(a => a.type !== 'crypto').map(a => a.symbol)

    const priceMap: Record<string, PriceData> = {}

    // Fetch crypto prices
    if (cryptos.length > 0) {
      try {
        const res  = await fetch(`/api/prices/crypto?symbols=${cryptos.join(',')}`)
        if (res.ok) {
          const data = await res.json()
          Object.assign(priceMap, data)
        }
      } catch { /* on continue même si ça échoue */ }
    }

    // Fetch stock prices
    if (stocks.length > 0) {
      try {
        const res  = await fetch(`/api/prices/stocks?symbols=${stocks.join(',')}`)
        if (res.ok) {
          const data = await res.json()
          Object.assign(priceMap, data)
        }
      } catch { /* idem */ }
    }

    // Fusionner les prix dans les actifs
    return currentAssets.map(asset => {
      const priceData = priceMap[asset.symbol]
      if (!priceData) return asset

      const currentPrice  = priceData.price
      const pnlAmount     = (currentPrice - asset.avg_buy_price) * asset.qty
      const pnlPct        = asset.avg_buy_price > 0
        ? ((currentPrice - asset.avg_buy_price) / asset.avg_buy_price) * 100
        : 0

      return {
        ...asset,
        current_price:    currentPrice,
        price_change_24h: priceData.change24h,
        current_value:    currentPrice * asset.qty,
        pnl_amount:       pnlAmount,
        pnl_pct:          pnlPct,
        history:          priceData.history || asset.history,
      }
    })
  }, [])

  // ── Chargement initial ────────────────────────────────────
  const initialize = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rawAssets  = await fetchAssets()
      const withPrices = await refreshPrices(rawAssets)
      setAssets(withPrices)
      setLastUpdate(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fetchAssets, refreshPrices])

  // ── Refresh périodique des prix ───────────────────────────
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(async () => {
      try {
        const updated = await refreshPrices(assets)
        setAssets(updated)
        setLastUpdate(new Date())
      } catch { /* silencieux */ }
    }, PRICE_REFRESH_INTERVAL)
  }, [assets, refreshPrices])

  useEffect(() => { initialize() }, [])
  useEffect(() => { startAutoRefresh(); return () => { if (intervalRef.current) clearInterval(intervalRef.current) } }, [assets.length])

  // ── Actions ───────────────────────────────────────────────
  const addAsset = useCallback(async (formData: {
    symbol: string; name: string; type: string; color: string
    buyDate: string; buyTime: string; buyPrice: number
    buyQty: number; currentPrice?: number
  }) => {
    const res = await fetch('/api/assets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formData),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erreur ajout actif')
    }
    await initialize()  // rechargement complet
  }, [initialize])

  const deleteAsset = useCallback(async (id: string) => {
    const res = await fetch(`/api/assets?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur suppression')
    setAssets(prev => prev.filter(a => a.id !== id))
  }, [])

  const addDividend = useCallback(async (assetId: string, data: {
    amount: number; amountPerShare?: number; receivedAt: string
  }) => {
    const res = await fetch('/api/dividends', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ assetId, ...data }),
    })
    if (!res.ok) throw new Error('Erreur ajout dividende')
    await initialize()
  }, [initialize])

  // ── Calculs totaux ────────────────────────────────────────
  const totalValue     = assets.reduce((s, a) => s + (a.current_value ?? 0), 0)
  const totalInvested  = assets.reduce((s, a) => s + (a.total_invested ?? 0), 0)
  const totalPnlAmount = totalValue - totalInvested
  const totalPnlPct    = totalInvested > 0 ? (totalPnlAmount / totalInvested) * 100 : 0

  return {
    assets, loading, error, lastUpdate,
    totalValue, totalInvested, totalPnlAmount, totalPnlPct,
    addAsset, deleteAsset, addDividend,
    refresh: initialize,
  }
}
