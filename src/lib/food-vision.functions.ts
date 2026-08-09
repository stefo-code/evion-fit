import { createServerFn } from "@tanstack/react-start";
import { analysiereMahlzeitenFoto } from "./food-vision.server";

export const analysiereFoto = createServerFn({ method: "POST" })
  .inputValidator((data: { dataUrl: string }) => {
    if (!data?.dataUrl?.startsWith("data:image/")) throw new Error("Ungültiges Bild.");
    if (data.dataUrl.length > 8_000_000) throw new Error("Bild ist zu groß.");
    return data;
  })
  .handler(async ({ data }) => analysiereMahlzeitenFoto(data.dataUrl));
