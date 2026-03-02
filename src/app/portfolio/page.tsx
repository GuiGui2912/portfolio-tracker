'use client'

// @ts-nocheck
import dynamic from 'next/dynamic'

const App = dynamic(() => import('@/components/PortfolioApp'), { 
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      background: '#0A0906',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#C8A96E',
      fontFamily: 'monospace',
    }}>
      Chargement...
    </div>
  )
})

export default function PortfolioPage() {
  return <App />
}