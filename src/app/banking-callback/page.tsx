// Fichier à créer : src/app/banking-callback/page.tsx
// Cette page reçoit le retour d'auth Enable Banking sans interférence Supabase

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BankingCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    
    if (code) {
      // Stocker le code dans sessionStorage et rediriger vers l'app principale
      sessionStorage.setItem("eb_pending_code", code);
    }
    // Rediriger vers l'app principale onglet banque
    router.replace("/portfolio?tab=bank");
  }, [router]);

  return (
    <div style={{ 
      display: "flex", alignItems: "center", justifyContent: "center", 
      height: "100vh", background: "#1a1a1a", color: "white", fontFamily: "sans-serif" 
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏦</div>
        <div>Connexion bancaire en cours...</div>
      </div>
    </div>
  );
}
