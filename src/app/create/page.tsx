import { ledgerConfigured } from "@/lib/ledger";
import type { CategoryId } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { CreateForm, type CompanyModel, type RecentLine, type StampCompany } from "./create-form";

export default async function CreatePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let companies: StampCompany[] = [];
  let models: CompanyModel[] = [];
  let recentLines: RecentLine[] = [];

  if (user) {
    const { data: rows, error: companyError } = await supabase
      .from("companies")
      .select("id, name, stamp_address, chain_tx, category, allowed")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    const list =
      rows ??
      (companyError
        ? (
            await supabase
              .from("companies")
              .select("id, name, stamp_address, chain_tx, category")
              .eq("owner_id", user.id)
              .order("created_at", { ascending: true })
          ).data
        : null) ??
      [];

    companies = list.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      category: row.category as CategoryId,
      stampAddress: row.stamp_address as string,
      onChain: Boolean(row.chain_tx),
      allowed: "allowed" in row ? row.allowed !== false : true,
    }));

    if (companies.length > 0) {
      const companyIds = companies.map((company) => company.id);
      const byId = new Map(companies.map((company) => [company.id, company.name]));
      const [{ data: lines }, { data: modelRows }] = await Promise.all([
        supabase
          .from("picture_lines")
          .select("line_id, action, created_at, company_id")
          .in("company_id", companyIds)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("company_models")
          .select("id, company_id, name")
          .in("company_id", companyIds)
          .order("created_at", { ascending: true }),
      ]);

      recentLines = (lines ?? []).map((line) => ({
        lineId: line.line_id as string,
        action: line.action as CategoryId,
        companyName: byId.get(line.company_id as string) ?? "Company",
        createdAt: line.created_at as string,
      }));

      models = (modelRows ?? []).map((row) => ({
        id: row.id as string,
        companyId: row.company_id as string,
        name: row.name as string,
      }));
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Stamp · company workspace</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Create → Edit → Publish.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        Click-demo of what a company&apos;s app would do with its API key. Pick the step, company,
        and model, then download the stamped file.
      </p>

      <CreateForm
        email={user?.email ?? null}
        companies={companies}
        models={models}
        recentLines={recentLines}
        ledgerReady={ledgerConfigured()}
      />
    </main>
  );
}
