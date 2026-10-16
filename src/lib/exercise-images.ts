/**
 * Generierte, realistische Übungsfotos je Übung und Geschlecht (GPT Image 2).
 * Fehlt ein Motiv, greift automatisch das Bild des anderen Geschlechts bzw. die Muster-Illustration.
 */

export type BildPaar = { m: string; w: string };

/** Lokal gebündelte Fotos (zweite Generierungs-Runde). */
const lokal = import.meta.glob<string>("@/assets/exercises/*.jpg", {
  eager: true,
  import: "default",
  query: "?url",
});

const lokalePaare: Record<string, Partial<BildPaar>> = {};
for (const [pfad, url] of Object.entries(lokal)) {
  const datei = pfad.split("/").pop()!.replace(/\.jpg$/, "");
  const geschlecht = datei.endsWith("-w") ? "w" : "m";
  const id = datei.slice(0, -2);
  (lokalePaare[id] ??= {})[geschlecht] = url;
}

const basisBilder: Record<string, BildPaar> = {
  "ausfallschritt": { m: "/__l5e/assets-v1/9da331f2-00fe-41a3-8975-b9ae791de44b/ex-ausfallschritt-m.jpg", w: "/__l5e/assets-v1/9f3c57a5-103e-41a8-81b6-0b0446f988f9/ex-ausfallschritt-w.jpg" },
  "bank-kh": { m: "/__l5e/assets-v1/25094e41-95e9-4a3f-9ee7-30f452cc9410/ex-bank-kh-m.jpg", w: "/__l5e/assets-v1/3a51475e-7546-4e25-9ea9-bb255b85ca5f/ex-bank-kh-w.jpg" },
  "bank-lh": { m: "/__l5e/assets-v1/eaa1ef61-c3bf-4f49-ab94-d9fc82e47622/ex-bank-lh-m.jpg", w: "/__l5e/assets-v1/d70fbe03-cb3a-4f48-9b10-bfb6a862560f/ex-bank-lh-w.jpg" },
  "beinbeuger": { m: "/__l5e/assets-v1/81a909a4-4077-471f-9181-053289c2edcd/ex-beinbeuger-m.jpg", w: "/__l5e/assets-v1/81a909a4-4077-471f-9181-053289c2edcd/ex-beinbeuger-m.jpg" },
  "beinpresse": { m: "/__l5e/assets-v1/88073dde-ea84-4036-b46e-3c9ee1522c46/ex-beinpresse-m.jpg", w: "/__l5e/assets-v1/63f79a9d-562b-48a3-ac3c-975346e73119/ex-beinpresse-w.jpg" },
  "beinstrecker": { m: "/__l5e/assets-v1/8e788dbd-2605-4abd-a2fc-a309cfc610b2/ex-beinstrecker-m.jpg", w: "/__l5e/assets-v1/7b2692f9-fd91-4c87-9c1c-7f0ecf8f9b95/ex-beinstrecker-w.jpg" },
  "brustpresse": { m: "/__l5e/assets-v1/c951a806-1d97-4b2a-b2a1-f12cdef28904/ex-brustpresse-m.jpg", w: "/__l5e/assets-v1/03c39f92-cd39-4531-a58a-c3f478dec0fe/ex-brustpresse-w.jpg" },
  "facepull": { m: "/__l5e/assets-v1/f52a9e9c-56f9-418e-a0b3-3d8c1a4f85ba/ex-facepull-m.jpg", w: "/__l5e/assets-v1/f8238b93-b417-4acf-8d9d-e76efc65a4de/ex-facepull-w.jpg" },
  "fliegende": { m: "/__l5e/assets-v1/f04e22e1-43e1-4069-967d-319c5cfa04a5/ex-fliegende-m.jpg", w: "/__l5e/assets-v1/b3c54cb5-34d8-4d0a-94c7-5cf6be0e6522/ex-fliegende-w.jpg" },
  "glutebridge": { m: "/__l5e/assets-v1/7f972e7a-603e-457f-accc-f6e61256b22a/ex-glutebridge-m.jpg", w: "/__l5e/assets-v1/1e4870a0-feed-45a9-8489-2147257b9e80/ex-glutebridge-w.jpg" },
  "goblet": { m: "/__l5e/assets-v1/7ed12221-9922-495b-9ef7-32c664942fb4/ex-goblet-m.jpg", w: "/__l5e/assets-v1/bc12a815-0dd5-4c50-8197-43e5884b4c5c/ex-goblet-w.jpg" },
  "hipthrust": { m: "/__l5e/assets-v1/caeee6d1-2d7c-4648-b837-fa26311ea4e6/ex-hipthrust-m.jpg", w: "/__l5e/assets-v1/f2adc2dc-f4bb-41c0-929b-c3e3f7682a58/ex-hipthrust-w.jpg" },
  "klimmzug": { m: "/__l5e/assets-v1/96203d98-b4e6-43d1-9fc5-4f5800f94193/ex-klimmzug-m.jpg", w: "/__l5e/assets-v1/d2aeb89e-9b8a-4880-95bc-c8c58f96bbcd/ex-klimmzug-w.jpg" },
  "kniebeuge-lh": { m: "/__l5e/assets-v1/5b3c4dbf-212c-4c6e-8ed1-44b7d43c645b/ex-kniebeuge-lh-m.jpg", w: "/__l5e/assets-v1/4bc2f972-3629-4f1f-9cd9-23304651e94f/ex-kniebeuge-lh-w.jpg" },
  "kreuzheben": { m: "/__l5e/assets-v1/cf09c936-e1d6-46c1-8635-35ae66981e83/ex-kreuzheben-m.jpg", w: "/__l5e/assets-v1/0174c6ba-6143-468a-991c-385936569719/ex-kreuzheben-w.jpg" },
  "latzug": { m: "/__l5e/assets-v1/9e104639-8e22-4355-bc52-39f1f0e7419a/ex-latzug-m.jpg", w: "/__l5e/assets-v1/bdc7256c-eb70-42ed-b507-d7d652512339/ex-latzug-w.jpg" },
  "liegestuetz": { m: "/__l5e/assets-v1/bc16d999-3e78-4b46-ac82-ce39613052fe/ex-liegestuetz-m.jpg", w: "/__l5e/assets-v1/b86665ed-d5c4-434f-9416-66160730c2dc/ex-liegestuetz-w.jpg" },
  "rdl-kh": { m: "/__l5e/assets-v1/b85bb8de-bf62-4d54-b594-4ce96a3e07e6/ex-rdl-kh-m.jpg", w: "/__l5e/assets-v1/d1d7e57b-0101-4a91-a5a9-ebc741c3a7bc/ex-rdl-kh-w.jpg" },
  "rudern-kabel": { m: "/__l5e/assets-v1/10f9e9db-91b9-4d22-b40e-0700e26e5b6c/ex-rudern-kabel-m.jpg", w: "/__l5e/assets-v1/b6793d8f-fc41-4b29-a484-584bb35f9fac/ex-rudern-kabel-w.jpg" },
  "rudern-kh": { m: "/__l5e/assets-v1/7b7e3931-ed05-4c9d-bcf8-3c89ef399ee7/ex-rudern-kh-m.jpg", w: "/__l5e/assets-v1/2a0c317e-645f-44ec-878f-bfdbc0d9b9f8/ex-rudern-kh-w.jpg" },
  "rudern-lh": { m: "/__l5e/assets-v1/11d54acd-7c44-4643-9499-be95e4a7abb4/ex-rudern-lh-m.jpg", w: "/__l5e/assets-v1/fc397d92-71a9-4341-964b-8fd29cafe702/ex-rudern-lh-w.jpg" },
};

/** Übungen, die sich ein Motiv teilen (gleiche Bewegung, kein eigenes Foto). */
const aliase: Record<string, string> = {
  "fahrrad-ergometer": "rudergeraet",
};

export const uebungsBilder: Record<string, BildPaar> = (() => {
  const alle: Record<string, BildPaar> = { ...basisBilder };
  for (const [id, paar] of Object.entries(lokalePaare)) {
    // Wichtig: niemals ein Motiv des anderen Geschlechts übernehmen, solange
    // für dieses Geschlecht bereits ein passendes Bild existiert.
    const m = paar.m ?? alle[id]?.m ?? paar.w;
    const w = paar.w ?? alle[id]?.w ?? paar.m;
    if (m && w) alle[id] = { m, w };
  }
  for (const [id, quelle] of Object.entries(aliase)) {
    if (!alle[id] && alle[quelle]) alle[id] = alle[quelle]!;
  }
  return alle;
})();


/**
 * Hat diese Übung ein eigenes (fotografiertes) Bild für das angegebene Geschlecht,
 * statt auf das generische „neutral“-Foto oder die Muskelgruppen-Illustration
 * zurückzufallen? Wird u. a. genutzt, um KI-generierte neue Übungen ohne Foto
 * als „Bild fehlt“ zu kennzeichnen.
 */
export function hatEigenesBild(id: string, geschlecht?: string | null): boolean {
  if (!id || id === "neutral") return false;
  const paar = uebungsBilder[id];
  if (!paar) return false;
  const bild = geschlecht === "weiblich" ? paar.w : paar.m;
  return Boolean(bild);
}
