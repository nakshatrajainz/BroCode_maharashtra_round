const answers = [
  {
    title: "Trusted",
    body: "An allowed company stamped the picture, every later step was written down, and the file still matches.",
  },
  {
    title: "Self-asserted",
    body: "Someone made a claim, but that someone is not allowed to stamp that kind of line.",
  },
  {
    title: "Unverifiable",
    body: "The story is missing, has a hole, disagrees with itself, or the picture no longer matches.",
  },
];

export default function CheckPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <p className="text-sm text-seal">Check · later phase</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">Upload a picture. Get one answer.</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        The check page comes after a real picture line exists. These are the only three answers it will give.
      </p>
      <div className="mt-10 grid gap-4">
        {answers.map((answer) => (
          <article key={answer.title} className="border border-line bg-white p-5">
            <h2 className="font-serif text-2xl">{answer.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{answer.body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
