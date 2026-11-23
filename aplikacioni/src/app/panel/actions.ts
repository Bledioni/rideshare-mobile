"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { krijoUdhetimin, ndryshoOren } from "@/lib/lejet";

export async function ruajOren(formData: FormData) {
  let mesazh: string;
  try {
    mesazh = await ndryshoOren(String(formData.get("id") ?? ""), String(formData.get("ora") ?? ""));
  } catch {
    mesazh = "databaza";
  }
  if (mesazh === "ruajtur") {
    revalidatePath("/");
    revalidatePath("/udhetimi/2");
  }
  // redirect qëndron jashtë try/catch: Next.js e përdor si kontroll rrjedhe.
  redirect("/panel?m=" + mesazh);
}
export async function shtoUdhetim(formData: FormData) {
  let mesazh: string;
  let id: string | undefined;
  try {
    ({ rezultati: mesazh, id } = await krijoUdhetimin(formData));
  } catch (error) {
    console.error("Udhëtimi nuk u krijua.", error);
    mesazh = "databaza";
  }
  if (mesazh === "krijuar") revalidatePath("/");
  redirect("/panel?m=" + mesazh + (id ? "&id=" + encodeURIComponent(id) : ""));
}
