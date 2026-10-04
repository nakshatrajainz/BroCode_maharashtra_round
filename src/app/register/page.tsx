import type { CategoryId } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { RegisterFlow, type Company } from "./register-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let companies: Company[] = [];
  if (user) {
    const { data: rows } = await supabase
      .from("companies")
      .select("id, name, category, stamp_address, chain_tx")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    const list = rows ?? [];
    const ids = list.map((row) => row.id as string);
    const prefixByCompany = new Map<string, string>();

    if (ids.length > 0) {
      const { data: keys } = await supabase
        .from("company_api_keys")
        .select("company_id, key_prefix, revoked_at")
        .in("company_id", ids)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });

      for (const key of keys ?? []) {
        const companyId = key.company_id as string;
        if (!prefixByCompany.has(companyId)) {
          prefixByCompany.set(companyId, key.key_prefix as string);
        }
      }
    }

    companies = list.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      category: row.category as CategoryId,
      stampAddress: row.stamp_address as string,
      onChain: Boolean(row.chain_tx),
      apiKeyPrefix: prefixByCompany.get(row.id as string) ?? null,
    }));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Companies · workspace</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">
        {companies.length > 0 ? "Your companies." : "Register your company."}
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        {user
          ? "One company = one job (Maker / Editor / Publisher) = one stamp = one API key. Register here. Stamp pictures on Stamp, or let your app call the API with that key."
          : "New here? Create an account and your first company in one step. Returning? Sign in, then come back here."}
      </p>

      <RegisterFlow email={user?.email ?? null} companies={companies} />
    </main>
  );
}
