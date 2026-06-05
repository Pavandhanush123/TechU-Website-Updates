// WhatsApp-style image cropper. Shows the uploaded image inside a fixed square
// frame with a circular guide; the admin pans (drag) and zooms (slider) to
// choose what stays in frame, then we render the framed region to a square
// canvas and hand back a Blob ready to upload. No external dependency.
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FRAME = 288; // on-screen crop frame size (px)
const OUTPUT = 480; // exported image size (px, square)
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The image to crop (object URL or data URL). */
  src: string;
  /** Called with the cropped square image once the admin confirms. */
  onCropped: (blob: Blob) => void | Promise<void>;
};

export function ImageCropDialog({ open, onOpenChange, src, onCropped }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  // Smallest scale that still covers the square frame at zoom = 1.
  const baseScale = nat ? Math.max(FRAME / nat.w, FRAME / nat.h) : 1;
  const scaledW = nat ? nat.w * baseScale * zoom : 0;
  const scaledH = nat ? nat.h * baseScale * zoom : 0;

  // Keep the image covering the frame (no empty gaps inside the circle).
  const clamp = useCallback(
    (o: { x: number; y: number }) => {
      const maxX = Math.max(0, (scaledW - FRAME) / 2);
      const maxY = Math.max(0, (scaledH - FRAME) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [scaledW, scaledH],
  );

  // Reset transform whenever a new image is opened.
  useEffect(() => {
    if (open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setNat(null);
    }
  }, [open, src]);

  useEffect(() => {
    setOffset((o) => clamp(o));
  }, [zoom, clamp]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const next = {
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    };
    setOffset(clamp(next));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT, OUTPUT);

      // Reproduce the on-screen framed view at export resolution.
      const factor = OUTPUT / FRAME;
      const drawW = scaledW * factor;
      const drawH = scaledH * factor;
      const drawX = (FRAME / 2 + offset.x - scaledW / 2) * factor;
      const drawY = (FRAME / 2 + offset.y - scaledH / 2) * factor;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
      );
      if (blob) await onCropped(blob);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust photo</DialogTitle>
          <DialogDescription>
            Drag to reposition and use the slider to zoom. The circle shows what
            will be saved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center">
          <div
            className="relative cursor-grab touch-none overflow-hidden rounded-lg bg-zinc-900 active:cursor-grabbing"
            style={{ width: FRAME, height: FRAME }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                setNat({ w: el.naturalWidth, h: el.naturalHeight });
              }}
              style={{
                position: "absolute",
                left: FRAME / 2 + offset.x - scaledW / 2,
                top: FRAME / 2 + offset.y - scaledH / 2,
                width: scaledW || undefined,
                height: scaledH || undefined,
                maxWidth: "none",
                userSelect: "none",
              }}
            />
            {/* Circular guide: dim everything outside the circle. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                borderRadius: "9999px",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/80"
            />
          </div>

          <div className="mt-4 flex w-full items-center gap-3">
            <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-brand-purple"
              aria-label="Zoom"
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !nat}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save photo"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
