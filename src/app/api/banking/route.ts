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
  const url = `${BASE_URL}${path}`;
  console.log(`[EB] ${method} ${url}`);
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  console.log(`[EB] ${res.status}:`, JSON.stringify(data).slice(0, 400));
  if (!res.ok) throw new Error(`EB ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (!APP_ID || !PRIVATE_KEY_PEM) {
    return NextResponse.json({ error: "Variables ENABLE_BANKING_APP_ID / ENABLE_BANKING_PRIVATE_KEY manquantes" }, { status: 500 });
  }

  try {
    const token = await getJWT();

    if (action === "aspsps") {
      const country = searchParams.get("country") || "FR";
      const data = await ebFetch(`/aspsps?country=${country}&psu_type=personal`, token);
      const list = Array.isArray(data) ? data : (data.aspsps || data.data || []);
      return NextResponse.json({ aspsps: list });
    }

    if (action === "start_auth") {
      const aspsp_name = searchParams.get("aspsp_name");
      const country = searchParams.get("country") || "FR";
      // ⚠️ Cette URL DOIT correspondre exactement à celle enregistrée dans le dashboard Enable Banking
      // Vérifier sur https://app.enablebanking.com → ton app → Redirect URIs
      const redirect_url = "https://portfolio-tracker-livid-alpha.vercel.app/banking-callback";
      if (!aspsp_name) return NextResponse.json({ error: "aspsp_name requis" }, { status: 400 });
      
      // valid_until : ISO complet avec timezone (l'API rejette le format date seul sans timezone)
      const validUntil = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
      // state : doit être alphanumérique, pas d'espaces ni caractères spéciaux
      const state = "bank" + Date.now().toString(36);
      
      const body = {
        access: { valid_until: validUntil },
        aspsp: { name: aspsp_name, country },
        redirect_url,
        psu_type: "personal",
        credentials_autosubmit: true,
        state,
      };
      const data = await ebFetch("/auth", token, "POST", body);
      const redirectUrl = data.url || data.auth_url || data.redirect_url
        || data.links?.redirect || data.links?.auth || data.link;
      if (!redirectUrl) {
        return NextResponse.json({ error: "Pas d'URL de redirection", raw: data }, { status: 500 });
      }
      return NextResponse.json({ url: redirectUrl });
    }

    if (action === "create_session") {
      const code = searchParams.get("code");
      if (!code) return NextResponse.json({ error: "code requis" }, { status: 400 });
      const data = await ebFetch("/sessions", token, "POST", { code });
      const session_id = data.session_id || data.id || data.uid;
      return NextResponse.json({ ...data, session_id });
    }

    // Vérifier statut d'une autorisation et créer la session (pour mobile sans redirection)
    if (action === "check_auth") {
      const authorization_id = searchParams.get("authorization_id");
      if (!authorization_id) return NextResponse.json({ error: "authorization_id requis" }, { status: 400 });
      // Récupérer le statut de l'autorisation
      const auth = await ebFetch(`/authorizations/${authorization_id}`, token);
      console.log("[EB] auth status:", JSON.stringify(auth).slice(0, 300));
      if (auth.status === "AUTHORIZED" || auth.code) {
        const code = auth.code || auth.authorization_code;
        if (code) {
          const data = await ebFetch("/sessions", token, "POST", { code });
          const session_id = data.session_id || data.id || data.uid;
          return NextResponse.json({ ...data, session_id });
        }
      }
      return NextResponse.json({ status: auth.status || "PENDING", message: "Autorisation pas encore complète" });
    }

    if (action === "session") {
      const session_id = searchParams.get("session_id");
      if (!session_id) return NextResponse.json({ error: "session_id requis" }, { status: 400 });
      const data = await ebFetch(`/sessions/${session_id}`, token);
      return NextResponse.json(data);
    }

    if (action === "account_details") {
      const account_id = searchParams.get("account_id");
      if (!account_id) return NextResponse.json({ error: "account_id requis" }, { status: 400 });
      const data = await ebFetch(`/accounts/${account_id}/details`, token);
      return NextResponse.json(data);
    }

    if (action === "balances") {
      const account_id = searchParams.get("account_id");
      if (!account_id) return NextResponse.json({ error: "account_id requis" }, { status: 400 });
      console.log("[EB] fetching balances for account:", account_id);
      const data = await ebFetch(`/accounts/${account_id}/balances`, token);
      return NextResponse.json(data);
    }

    if (action === "transactions") {
      const account_id = searchParams.get("account_id");
      if (!account_id) return NextResponse.json({ error: "account_id requis" }, { status: 400 });
      const date_from = searchParams.get("date_from")
        || new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split("T")[0];
      const data = await ebFetch(`/accounts/${account_id}/transactions?date_from=${date_from}`, token);
      return NextResponse.json(data);
    }

    if (action === "test") {
      return NextResponse.json({ ok: true, app_id: APP_ID, key_length: PRIVATE_KEY_PEM.length });
    }

    if (action === "app") {
      const data = await ebFetch("/application", token);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });

  } catch (e: any) {
    console.error("[Banking API error]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
