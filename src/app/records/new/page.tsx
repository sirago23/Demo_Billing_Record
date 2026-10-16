import { AppHeader } from "@/components/AppHeader";
import { UploadBox } from "@/components/UploadBox";

export default function NewRecordPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-24 sm:px-8 tab:pb-8">
        <h1 className="text-[clamp(1.75rem,4vw,2.125rem)] font-semibold tracking-tight">Add a record</h1>
        <p className="mt-1.5 mb-7 text-muted tab:text-[1.0625rem]">
          Upload a slip and the form fills itself in. Check it, then save.
        </p>
        <UploadBox />
      </main>
    </>
  );
}
