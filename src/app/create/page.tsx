import { ledgerConfigured } from "@/lib/ledger";
import { createClient } from "@/lib/supabase/server";
import { CreateForm, type MakerCompany } from "./create-form";

export default async function CreatePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let makers: MakerCompany[] = [];
  if (user) {
    const { data: rows } = await supabase
      .from("companies")
      .select("id, name, stamp_address, chain_tx, category")
      .eq("owner_id", user.id)
      .eq("category", "maker")
      .order("created_at", { ascending: true });

    makers = (rows ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      stampAddress: row.stamp_address as string,
      onChain: Boolean(row.chain_tx),
    }));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Create · company workspace</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Add a line to a picture.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        A Maker stamps a prepared picture. The private sentence is sealed. The public line keeps
        fingerprints, a hidden id, and the envelope hash.
      </p>

      <CreateForm email={user?.email ?? null} makers={makers} ledgerReady={ledgerConfigured()} />
    </main>
  );
}
