"use client";

import { useRouter } from "next/navigation";

import { UploadDropzone } from "@/components/upload-dropzone";

/** Landing-page upload zone that routes to the editor once a file is loaded. */
export function LandingUpload() {
  const router = useRouter();
  return (
    <UploadDropzone
      onComplete={() => router.push("/editor")}
      className="mx-auto max-w-xl"
    />
  );
}
