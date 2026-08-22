/**
 * Barcode-Scanner für die Schnellerfassung.
 * Nutzt die native BarcodeDetector-API des Browsers; ist sie nicht verfügbar,
 * kann die Nummer manuell eingegeben werden.
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, ScanLine, X } from "lucide-react";

type Props = {
  offen: boolean;
  onSchliessen: () => void;
  onCode: (code: string) => void;
};

type Detector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

const FORMATE = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];

export function BarcodeScanner({ offen, onSchliessen, onCode }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"start" | "aktiv" | "nicht-unterstuetzt" | "fehler">("start");
  const [manuell, setManuell] = useState("");

  useEffect(() => {
    if (!offen) return;
    let stream: MediaStream | null = null;
    let stop = false;
    let timer: number | undefined;
    let zxingControls: { stop: () => void } | null = null;

    const treffer = (roh?: string) => {
      const code = roh?.replace(/\D/g, "");
      if (code && code.length >= 8) {
        onCode(code);
        return true;
      }
      return false;
    };

    // Fallback für Safari/iOS: ZXing dekodiert direkt aus dem Videostream.
    const startZxing = async () => {
      try {
        const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        if (stop || !video.current) return;
        setStatus("aktiv");
        zxingControls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          video.current,
          (result) => {
            if (stop || !result) return;
            if (treffer(result.getText())) {
              zxingControls?.stop();
            }
          },
        );
      } catch {
        setStatus("fehler");
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("nicht-unterstuetzt");
        return;
      }
      const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector })
        .BarcodeDetector;
      if (!Ctor) {
        await startZxing();
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (stop) return;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        setStatus("aktiv");
        const detector = new Ctor({ formats: FORMATE });
        const tick = async () => {
          if (stop || !video.current) return;
          try {
            const funde = await detector.detect(video.current);
            if (treffer(funde[0]?.rawValue)) return;
          } catch {
            /* einzelne Frames dürfen fehlschlagen */
          }
          timer = window.setTimeout(() => void tick(), 350);
        };
        void tick();
      } catch {
        setStatus("fehler");
      }
    };

    void start();
    return () => {
      stop = true;
      if (timer) window.clearTimeout(timer);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [offen, onCode]);


  useEffect(() => {
    if (!offen) {
      setStatus("start");
      setManuell("");
    }
  }, [offen]);

  if (!offen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">Barcode scannen</h2>
          <button onClick={onSchliessen} aria-label="Scanner schließen">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
          <video ref={video} muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-primary/80" />
          {status === "start" && (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Kamera wird gestartet …
              </span>
            </div>
          )}
          {(status === "nicht-unterstuetzt" || status === "fehler") && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
              {status === "fehler"
                ? "Kein Kamerazugriff – bitte Berechtigung erlauben oder Nummer eingeben."
                : "Dieser Browser kann keine Barcodes lesen – gib die Nummer unter dem Strichcode ein."}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Halte den Strichcode der Verpackung in den Rahmen. Nährwerte stammen aus der offenen Produktdatenbank
          Open Food Facts und können abweichen.
        </p>

        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const code = manuell.replace(/\D/g, "");
            if (code.length >= 8) onCode(code);
          }}
        >
          <input
            value={manuell}
            onChange={(e) => setManuell(e.target.value)}
            inputMode="numeric"
            placeholder="Barcode-Nummer eingeben"
            aria-label="Barcode-Nummer eingeben"
            className="num w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <ScanLine className="h-4 w-4" /> Suchen
          </button>
        </form>
      </div>
    </div>
  );
}
