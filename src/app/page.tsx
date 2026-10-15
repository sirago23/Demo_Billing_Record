import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Billing record</h1>
      <p className="mt-2 text-slate-600">Placeholder page. Dashboard comes in Task 6.</p>
      <Link href="/records/new" className="mt-4 inline-block underline">
        Add a record
      </Link>
    </main>
  );
}
