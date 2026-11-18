"use server";

import { revalidatePath } from "next/cache";
import { profiliIm } from "@/lib/lejet";
import { ruajPreferiminNeDatabaze } from "@/lib/preferimet";

export async function ruajPreferimin(
  udhetimId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (
    typeof udhetimId !== "string" ||
    !udhetimId.trim() ||
    udhetimId.trim() !== udhetimId ||
    udhetimId.length > 128
  ) {
    return { ok: false, message: "Udhëtimi nuk është i vlefshëm." };
  }

  try {
    const profile = await profiliIm();
    if (!profile) {
      return { ok: false, message: "Hyr me GitHub për të ruajtur udhëtimin." };
    }

    // Rasti 2: refuzim prove para shkrimit në databazë.
    // Funksionon vetëm lokalisht (npm run dev) me PREFERIMET_REFUZO_PROVE=1 në .env.
    if (
      process.env.NODE_ENV === "development" &&
      process.env.PREFERIMET_REFUZO_PROVE === "1"
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      return { ok: false, message: "Nuk u ruajt. Provo përsëri." };
    }

    const saved = await ruajPreferiminNeDatabaze(profile.id, udhetimId);
    if (!saved) {
      return { ok: false, message: "Udhëtimi nuk u gjet." };
    }

    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("Nuk u ruajt udhëtimi i preferuar.", error);
    return { ok: false, message: "Nuk u ruajt. Provo përsëri." };
  }
}
