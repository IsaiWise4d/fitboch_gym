export type RGB = [number, number, number];

/**
 * Create a PNG data URL with a large, rotated, semi-transparent text used as watermark.
 * This runs in the browser (uses canvas) and is intended to be called from client code.
 */
export function createWatermarkDataURL(opts?: {
  text?: string;
  color?: RGB;
  opacity?: number; // 0..1
  angle?: number; // degrees
  fontSize?: number; // px
  canvasWidth?: number;
  canvasHeight?: number;
}): string | null {
  const {
    text = "FITBOCH",
    color = [255, 255, 255],
    opacity = 0.04,
    angle = -35,
    fontSize = 180,
    canvasWidth = 1600,
    canvasHeight = 400,
  } = opts ?? {};

  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const [r, g, b] = color;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillText(text, 0, 0);

    return canvas.toDataURL("image/png");
  } catch (e) {
    // Fail gracefully and log
    // eslint-disable-next-line no-console
    console.error("Could not create watermark image:", e);
    return null;
  }
}

/**
 * Draw watermark image onto a jsPDF document, scaling it to cover the page diagonally.
 */
export function drawWatermarkOnDoc(
  doc: any,
  pageW: number,
  pageH: number,
  imgData: string | null,
  opts?: { canvasWidth?: number; canvasHeight?: number; scaleFactor?: number }
) {
  if (!imgData) return;

  const canvasWidth = opts?.canvasWidth ?? 1600;
  const canvasHeight = opts?.canvasHeight ?? 400;
  const scaleFactor = opts?.scaleFactor ?? 1.6;

  const canvasRatio = canvasWidth / canvasHeight;
  const targetW = Math.max(pageW, pageH) * scaleFactor;
  const targetH = targetW / canvasRatio;
  const x = (pageW - targetW) / 2;
  const y = (pageH - targetH) / 2;

  try {
    doc.addImage(imgData, "PNG", x, y, targetW, targetH, undefined, "FAST");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error drawing watermark on PDF:", e);
  }
}

export function drawVectorWatermarkOnDoc(
  doc: any,
  pageW: number,
  pageH: number,
  opts?: {
    text?: string;
    color?: RGB;
    opacity?: number;
    angle?: number;
    fontSize?: number;
    stepX?: number;
    stepY?: number;
    startX?: number;
    startY?: number;
  }
) {
  const {
    text = "FITBOCH",
    color = [255, 255, 255],
    opacity = 0.02,
    angle = 35,
    fontSize = 60,
    stepX = 160,
    stepY = 120,
    startX = -10,
    startY = 30,
  } = opts ?? {};

  try {
    // Use vector text + GState if available for best quality
    if (typeof doc.GState === "function" && typeof doc.setGState === "function") {
      doc.saveGraphicsState();
      doc.setTextColor(...color);
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "bold");
      const gs = doc.GState({ opacity });
      if (gs) doc.setGState(gs);

      for (let wy = startY; wy < pageH; wy += stepY) {
        for (let wx = startX; wx < pageW; wx += stepX) {
          doc.text(text, wx, wy, { angle });
        }
      }

      doc.restoreGraphicsState();
      return;
    }

    // Fallback to image-based watermark if GState not available
    const img = createWatermarkDataURL({
      text,
      color,
      opacity,
      angle: -angle, // canvas rotation direction differs; keep visual similar
      fontSize: fontSize * 2, // larger canvas font for crispness
    });
    drawWatermarkOnDoc(doc, pageW, pageH, img, { canvasWidth: 1600, canvasHeight: 400 });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error drawing vector watermark:", e);
  }
}

/**
 * Unified drawWatermark: prefer vector (text + gstate) then fallback to image
 */
export function drawWatermark(
  doc: any,
  pageW: number,
  pageH: number,
  opts?: {
    text?: string;
    color?: RGB;
    opacity?: number;
    angle?: number;
    fontSize?: number;
  }
) {
  // try vector first
  try {
    drawVectorWatermarkOnDoc(doc, pageW, pageH, {
      text: opts?.text,
      color: opts?.color,
      opacity: opts?.opacity,
      angle: opts?.angle,
      fontSize: opts?.fontSize,
    });
  } catch (e) {
    // fallback: image
    const img = createWatermarkDataURL({ text: opts?.text, color: opts?.color, opacity: opts?.opacity });
    drawWatermarkOnDoc(doc, pageW, pageH, img);
  }
}
