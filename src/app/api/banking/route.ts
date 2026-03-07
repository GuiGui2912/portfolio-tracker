import { NextRequest, NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";

const APP_ID = process.env.ENABLE_BANKING_APP_ID!;
// Vercel encode parfois les \n en littéral - on les restaure
const PRIVATE_KEY_PEM = (process.env.ENABLE_BANKING_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const BASE_URL = "https://api.enablebanking.com";

async function getJWT() {
  const privateKey = await importPKCS8(PRIVATE_KEY_PEM, "RS256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: APP_ID })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer("enablebanking.com")
    .setAudience("api.enablebanking.com")
    .sign(privateKey);
}

async function ebFetch(path: string, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Enable Banking error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    console.log("APP_ID:", APP_ID);
    console.log("PEM starts with:", PRIVATE_KEY_PEM.substring(0, 40));
    const token = await getJWT();

    // Lister les sessions actives
    if (action === "sessions") {
      const data = await ebFetch("/sessions", token);
      return NextResponse.json(data);
    }

    // Créer une session pour connecter une banque
    if (action === "connect") {
      const aspsp_id = searchParams.get("aspsp_id");
      const country = searchParams.get("country") || "FR";
      const redirect_url = searchParams.get("redirect_url") || process.env.NEXT_PUBLIC_APP_URL || "https://portfolio-tracker-livid-alpha.vercel.app";

      const body = {
        access: { valid_until: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString() },
        aspsp: { name: aspsp_id, country },
        redirect_url,
        psu_type: "personal",
        credentials_autosubmit: true,
      };

      const res = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Récupérer les comptes d'une session
    if (action === "accounts") {
      const session_id = searchParams.get("session_id");
      const data = await ebFetch(`/sessions/${session_id}`, token);
      return NextResponse.json(data);
    }

    // Récupérer le solde d'un compte
    if (action === "balances") {
      const account_id = searchParams.get("account_id");
      const data = await ebFetch(`/accounts/${account_id}/balances`, token);
      return NextResponse.json(data);
    }

    // Récupérer les transactions d'un compte
    if (action === "transactions") {
      const account_id = searchParams.get("account_id");
      const date_from = searchParams.get("date_from") || new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split("T")[0];
      const data = await ebFetch(`/accounts/${account_id}/transactions?date_from=${date_from}`, token);
      return NextResponse.json(data);
    }

    // Lister les banques disponibles par pays
    if (action === "aspsps") {
      const country = searchParams.get("country") || "FR";
      const data = await ebFetch(`/aspsps?country=${country}`, token);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (e: any) {
    console.error("Banking API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
