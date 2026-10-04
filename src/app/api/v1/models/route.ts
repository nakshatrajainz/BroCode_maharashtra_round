import { bearerToken, resolveCompanyFromApiKey } from "@/lib/api-keys";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const apiKey = bearerToken(request);
  if (!apiKey) {
    return Response.json(
      { error: "Missing API key. Send Authorization: Bearer ml_…" },
      { status: 401 },
    );
  }

  const company = await resolveCompanyFromApiKey(apiKey);
  if (!company) {
    return Response.json({ error: "Invalid or revoked API key." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("company_models")
    .select("id, name, created_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: "Could not read approved models." }, { status: 500 });
  }

  return Response.json({
    ok: true,
    company: company.name,
    category: company.category,
    models: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
    })),
  });
}
