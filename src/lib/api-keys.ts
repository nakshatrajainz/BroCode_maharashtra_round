import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type ApiCompany = {
  id: string;
  name: string;
  category: string;
  stamp_address: string;
  chain_tx: string | null;
  allowed: boolean | null;
  revoked_at: string | null;
};

export function generateApiKey() {
  const raw = `ml_${randomBytes(24).toString("base64url")}`;
  return {
    apiKey: raw,
    keyPrefix: raw.slice(0, 12),
    keyHash: hashApiKey(raw),
  };
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export async function resolveCompanyFromApiKey(apiKey: string): Promise<ApiCompany | null> {
  const trimmed = apiKey.trim();
  if (!trimmed.startsWith("ml_") || trimmed.length < 20) return null;

  const admin = createAdminClient();
  const prefix = trimmed.slice(0, 12);
  const { data: rows } = await admin
    .from("company_api_keys")
    .select("key_hash, revoked_at, companies(id, name, category, stamp_address, chain_tx, allowed, revoked_at)")
    .eq("key_prefix", prefix)
    .is("revoked_at", null)
    .limit(5);

  if (!rows?.length) return null;

  const want = Buffer.from(hashApiKey(trimmed), "hex");
  for (const row of rows) {
    const got = Buffer.from(String(row.key_hash), "hex");
    if (got.length !== want.length || !timingSafeEqual(got, want)) continue;
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    if (!company?.id) return null;
    return company as ApiCompany;
  }
  return null;
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? null;
}
