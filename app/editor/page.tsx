import type { Metadata } from "next";

import { EditorClient } from "@/components/editor/editor-client";

export const metadata: Metadata = {
  title: "Editor",
  description:
    "Add a news-style text overlay to your image or video and export it.",
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return <EditorClient />;
}
