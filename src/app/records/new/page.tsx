import Link from "next/link";
import { UploadBox } from "@/components/UploadBox";

export default function NewRecordPage() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <Link href="/" className="text-sm text-slate-600 underline">
        Back to dashboard
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">New record</h1>
      <UploadBox />
    </main>
  );
}
