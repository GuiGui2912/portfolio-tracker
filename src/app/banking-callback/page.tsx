"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BankingCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      sessionStorage.setItem("eb_pending_code", code);
    }
    router.replace("/portfolio");
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