import { createServerFn } from "@tanstack/react-start";
import { sucheBarcode } from "./barcode.server";

export const produktPerBarcode = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => {
    const code = String(data?.code ?? "").replace(/\D/g, "");
    if (code.length < 8 || code.length > 14) throw new Error("Ungültiger Barcode.");
    return { code };
  })
  .handler(async ({ data }) => sucheBarcode(data.code));
