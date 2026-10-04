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
      .select("id, name, category, stamp_address")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    companies = (rows ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      category: row.category as CategoryId,
      stampAddress: row.stamp_address as string,
    }));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="eyebrow">Companies · workspace</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">
        {companies.length > 0 ? "Your companies." : "Put your company on the allowed list."}
      </h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        {user
          ? "Each company does one job, gets its own stamp, and pre-approves AI models. Then Stamp writes company + model + time onto the notebook."
          : "New here? Create an account, your first company, and approved models in one step. Returning? Sign in, then add companies here."}
      </p>

      <RegisterFlow email={user?.email ?? null} companies={companies} />
    </main>
  );
}
