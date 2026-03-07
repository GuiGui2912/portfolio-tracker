import { NextRequest, NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";

const APP_ID = process.env.ENABLE_BANKING_APP_ID!;
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

async function ebFetch(path: string, token: string, method = "GET", body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Enable Banking error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    const token = await getJWT();

    // Lister les banques disponibles
    if (action === "aspsps") {
      const country = searchParams.get("country") || "FR";
      const data = await ebFetch(`/aspsps?country=${country}`, token);
      return NextResponse.json(data);
    }

    // Démarrer l'autorisation
    if (action === "start_auth") {
      const aspsp_name = searchParams.get("aspsp_name");
      const country = searchParams.get("country") || "FR";
      const redirect_url = searchParams.get("redirect_url") || "https://portfolio-tracker-livid-alpha.vercel.app/portfolio";
      const body = {
        access: { valid_until: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0] },
        aspsp: { name: aspsp_name, country },
        redirect_url,
        psu_type: "personal",
        credentials_autosubmit: true,
      };
      const data = await ebFetch("/auth", token, "POST", body);
      return NextResponse.json(data);
    }

    // Créer la session après retour de la banque
    if (action === "create_session") {
      const code = searchParams.get("code");
      const data = await ebFetch("/sessions", token, "POST", { code });
      return NextResponse.json(data);
    }

    // Récupérer les détails d'une session
    if (action === "session") {
      const session_id = searchParams.get("session_id");
      const data = await ebFetch(`/sessions/${session_id}`, token);
      return NextResponse.json(data);
    }

    // Solde d'un compte
    if (action === "balances") {
      const account_id = searchParams.get("account_id");
      const data = await ebFetch(`/accounts/${account_id}/balances`, token);
      return NextResponse.json(data);
    }

    // Transactions d'un compte
    if (action === "transactions") {
      const account_id = searchParams.get("account_id");
      const date_from = searchParams.get("date_from") || new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split("T")[0];
      const data = await ebFetch(`/accounts/${account_id}/transactions?date_from=${date_from}`, token);
      return NextResponse.json(data);
    }

    // Vérifier l'application
    if (action === "app") {
      const data = await ebFetch("/application", token);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (e: any) {
    console.error("Banking API error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
