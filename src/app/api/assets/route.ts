// ============================================================
// app/api/assets/route.ts — CRUD actifs + transactions
// ============================================================

import { NextRequest, NextResponse }       from 'next/server'
import { createServerSupabaseClient }      from '@/lib/supabase'

// ── GET /api/assets — Liste tous les actifs avec positions ───
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('asset_positions')   // Vue SQL créée dans la migration
    .select(`
      *,
      transactions(*),
      dividends(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── POST /api/assets — Créer un actif + transaction d'achat ──
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { symbol, name, type, color, buyDate, buyTime, buyPrice, buyQty, currentPrice } = body

  // Validation
  if (!symbol || !name || !type || !buyPrice || !buyQty) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  // 1. Créer ou récupérer l'actif
  const { data: existing } = await supabase
    .from('assets')
    .select('id, qty')
    .eq('user_id', user.id)
    .eq('symbol', symbol.toUpperCase())
    .single()

  let assetId: string

  if (existing) {
    // Actif existant → mettre à jour la quantité
    assetId = existing.id
    await supabase
      .from('assets')
      .update({
        qty:           existing.qty + buyQty,
        current_price: currentPrice || buyPrice,
        color,
      })
      .eq('id', assetId)
  } else {
    // Nouvel actif
    const { data: newAsset, error: assetErr } = await supabase
      .from('assets')
      .insert({
        user_id:       user.id,
        symbol:        symbol.toUpperCase(),
        name,
        type,
        qty:           buyQty,
        color:         color || '#C8A96E',
        current_price: currentPrice || buyPrice,
        price_change_24h: 0,
      })
      .select('id')
      .single()

    if (assetErr) return NextResponse.json({ error: assetErr.message }, { status: 500 })
    assetId = newAsset.id
  }

  // 2. Enregistrer la transaction d'achat
  const executedAt = buyDate && buyTime
    ? new Date(`${buyDate}T${buyTime}:00`).toISOString()
    : new Date().toISOString()

  const { error: txErr } = await supabase
    .from('transactions')
    .insert({
      user_id:        user.id,
      asset_id:       assetId,
      type:           'buy',
      qty:            buyQty,
      price_per_unit: buyPrice,
      currency:       'USD',
      executed_at:    executedAt,
    })

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

  return NextResponse.json({ success: true, assetId }, { status: 201 })
}

// ── DELETE /api/assets?id=xxx — Supprimer un actif ───────────
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)  // RLS + vérification explicite

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ── PATCH /api/assets — Mettre à jour les prix ───────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates } = await req.json()
  // updates = [{ id, current_price, price_change_24h }, ...]

  const { error } = await supabase.rpc('update_asset_prices', {
    price_updates: updates
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
