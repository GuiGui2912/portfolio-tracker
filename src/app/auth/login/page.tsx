// ============================================================
// app/(auth)/login/page.tsx — Page de connexion
// ============================================================

'use client'

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import { createClient }   from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode,     setMode]     = useState<'login' | 'register'>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        })
        if (error) throw error
        setError('✅ Vérifiez votre email pour confirmer votre compte.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/portfolio')
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0E0D0A', border: '1px solid #252015',
    borderRadius: 12, padding: '12px 14px', color: '#F0EDE8',
    fontSize: 14, fontFamily: "'DM Mono', monospace", outline: 'none',
    marginTop: 6,
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0906',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: 380, background: '#151210', borderRadius: 24,
        padding: '36px 32px', border: '1px solid #252015',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'linear-gradient(135deg, #C8A96E, #8B6914)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 24,
          }}>📊</div>
          <div style={{ color: '#F0EDE8', fontSize: 22, fontWeight: 700 }}>Portfolio</div>
          <div style={{ color: '#5A5550', fontSize: 13, marginTop: 4 }}>
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créer un compte gratuit'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div>
              <label style={{ color: '#6A6560', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'DM Mono, monospace' }}>
                Nom complet
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Jean Dupont" style={inputStyle} required/>
            </div>
          )}
          <div>
            <label style={{ color: '#6A6560', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'DM Mono, monospace' }}>
              Email
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jean@example.com" style={inputStyle} required/>
          </div>
          <div>
            <label style={{ color: '#6A6560', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'DM Mono, monospace' }}>
              Mot de passe
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={inputStyle} required minLength={6}/>
          </div>

          {error && (
            <div style={{
              background: error.startsWith('✅') ? '#1A2A1A' : '#2A1A1A',
              border: `1px solid ${error.startsWith('✅') ? '#4ADE8040' : '#F8717140'}`,
              borderRadius: 10, padding: '10px 14px',
              color: error.startsWith('✅') ? '#4ADE80' : '#F87171',
              fontSize: 13,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            background: 'linear-gradient(135deg, #C8A96E, #A08040)',
            border: 'none', borderRadius: 14, padding: '14px',
            color: '#111009', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null) }}
            style={{ background: 'none', border: 'none', color: '#C8A96E', fontSize: 13, cursor: 'pointer' }}>
            {mode === 'login' ? "Pas encore de compte ? S'inscrire →" : '← Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// middleware.ts (à la racine du projet)
// Protège les routes /portfolio — redirige vers /login si non connecté
// ============================================================
/*
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/portfolio')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/portfolio', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/prices).*)'],
}
*/
