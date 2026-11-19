import { redirect } from "next/navigation";

// Java 10: kërkesa nuk është më simulim. Dërgohet dhe ndiqet te detajet e udhëtimit,
// ku gjendja rilexohet nga serveri çdo 5 sekonda.
export default async function Kerkesa({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/udhetimi/${encodeURIComponent(id)}`);
}
