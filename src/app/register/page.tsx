import Link from "next/link";
import { categories, type CategoryId } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./register-form";

type CompanyRow = {
  id: string;
  name: string;
  category: CategoryId;
  stamp_address: string;
};

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  let companies: CompanyRow[] = [];
  if (user) {
    const { data: rows } = await supabase
      .from("companies")
      .select("id, name, category, stamp_address")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    companies = (rows ?? []) as CompanyRow[];
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm text-seal">Register</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Join the allowed list.</h1>
      <p className="mt-4 text-lg leading-8 text-muted">
        One account can hold one stamp for each job. The private half of a stamp never leaves the server.
      </p>

      {user ? (
        <>
          {companies.length > 0 ? (
            <ul className="mt-10 grid gap-3">
              {companies.map((company) => (
                <li key={company.id} className="border border-line bg-white p-4">
                  <p className="font-medium">
                    {company.name}
                    <span className="font-normal text-muted">
                      {" "}
                      · {categories.find((item) => item.id === company.category)?.title}
                    </span>
                  </p>
                  <p className="mt-2 break-all text-sm text-muted">{company.stamp_address}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <RegisterForm taken={companies.map((company) => company.category)} />
        </>
      ) : (
        <p className="mt-10 text-sm leading-6 text-muted">
          <Link href="/sign-in">Sign in</Link> or <Link href="/sign-up">create an account</Link> before a stamp can be made.
        </p>
      )}
    </main>
  );
}
