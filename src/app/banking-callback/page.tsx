"use client";
import { useEffect } from "react";

export default function BankingCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Stocker dans localStorage (persiste mieux que sessionStorage sur mobile)
      localStorage.setItem("eb_pending_code", code);
      localStorage.setItem("eb_pending_ts", Date.now().toString());
    }
    // Redirection simple sans router Next.js pour éviter les interférences Supabase
    window.location.href = "/";
  }, []);

  return (
    <div style={{ 
      display: "flex", alignItems: "center", justifyContent: "center", 
      height: "100vh", background: "#111009", color: "white", fontFamily: "sans-serif" 
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
        <div style={{ fontSize: 14, color: "#4ADE80" }}>Connexion bancaire en cours...</div>
      </div>
    </div>
  );
}
