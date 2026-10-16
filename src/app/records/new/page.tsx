import { AppHeader } from "@/components/AppHeader";
import { UploadBox } from "@/components/UploadBox";

export default function NewRecordPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 pt-6 pb-24 sm:px-8 tab:pb-8">
        <h1 className="mb-6 text-2xl font-semibold">New record</h1>
        <UploadBox />
      </main>
    </>
  );
}
