import Link from "next/link";

const doors = [
  {
    href: "/register",
    step: "01",
    title: "Register a company",
    body: "A maker, an editor, or a publisher joins the allowed list and receives one stamp.",
  },
  {
    href: "/create",
    step: "02",
    title: "Add a picture line",
    body: "The company presses that stamp when it creates, changes, or posts a picture.",
  },
  {
    href: "/check",
    step: "03",
    title: "Check a picture",
    body: "Anyone uploads a file and gets one answer: Trusted, Self-asserted, or Unverifiable.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
      <p className="text-sm text-seal">Phase 1 of 6 · Company registration</p>
      <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-tight tracking-tight">
        The story of a picture, written down when it is made.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
        A company stamps its work. Later changes add the next line. A stranger can check whether the file still matches.
      </p>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {doors.map((door) => (
          <Link key={door.href} href={door.href} className="border border-line bg-white p-6">
            <p className="text-sm text-muted">{door.step}</p>
            <h2 className="mt-4 font-serif text-2xl">{door.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{door.body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
