import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/debug-off")({
  server: {
    handlers: {
      GET: async () => {
        const res = await fetch(
          "https://world.openfoodfacts.org/api/v2/product/5449000000996.json?fields=code,product_name,brands,nutriments,quantity",
          { headers: { "User-Agent": "EVION-Fitness-App/1.0 (lovable.app)" } },
        );
        const text = await res.text();
        return new Response(JSON.stringify({ status: res.status, body: text.slice(0, 800) }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
