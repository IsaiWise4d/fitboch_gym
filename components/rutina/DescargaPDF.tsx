"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { Rutina } from "@/types/app";

interface DescargaPDFProps {
  rutina: Rutina;
}

// Colores de la app
const PRIMARY = [255, 69, 0]; // #FF4500
const BG_DARK = [10, 10, 10]; // #0A0A0A
const SURFACE = [26, 26, 26]; // #1A1A1A
const TEXT_WHITE = [255, 255, 255];
const TEXT_MUTED = [160, 160, 160];
const BORDER = [50, 50, 50];

export function DescargaPDF({ rutina }: DescargaPDFProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = 0;

      function drawBackground() {
        doc.setFillColor(...BG_DARK);
        doc.setDrawColor(...BG_DARK);
        doc.rect(0, 0, pageW, pageH, "F");
      }

      function drawWatermark() {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(72);
        doc.setFont("helvetica", "bold");
        doc.saveGraphicsState();
        doc.setGState(doc.GState({ opacity: 0.03 }));
        // Marca de agua diagonal repetida
        for (let wy = 40; wy < pageH; wy += 80) {
          for (let wx = -20; wx < pageW; wx += 120) {
            doc.text("FITBOCH", wx, wy, { angle: 35 });
          }
        }
        doc.restoreGraphicsState();
      }

      function drawFooter(pageNum: number) {
        const footerY = pageH - 8;
        // Línea separadora
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
        // Texto footer
        doc.setFontSize(7);
        doc.setTextColor(...TEXT_MUTED);
        doc.setFont("helvetica", "normal");
        doc.text("FitBoch - Tu rutina personalizada", margin, footerY);
        doc.text(`Pág. ${pageNum}`, pageW - margin, footerY, { align: "right" });
      }

      function newPage(pageNum: number) {
        if (pageNum > 1) doc.addPage();
        drawBackground();
        drawWatermark();
        drawFooter(pageNum);
        return margin + 5;
      }

      function checkNewPage(currentY: number, needed: number, pageCount: { n: number }): number {
        if (currentY + needed > pageH - 18) {
          pageCount.n++;
          return newPage(pageCount.n);
        }
        return currentY;
      }

      // ============ PÁGINA 1 ============
      const pageCount = { n: 1 };
      y = newPage(1);

      // Header con barra naranja
      doc.setFillColor(...PRIMARY);
      doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");

      // Logo text
      doc.setTextColor(...TEXT_WHITE);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("FITBOCH", margin + 8, y + 12);

      // Subtítulo
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Rutina Personalizada", margin + 8, y + 20);

      // Fecha a la derecha
      doc.setFontSize(8);
      const fechaStr = new Date(rutina.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      doc.text(fechaStr, pageW - margin - 8, y + 20, { align: "right" });

      y += 36;

      // Info box
      doc.setFillColor(...SURFACE);
      doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentW, 14, 2, 2, "S");

      const durLabel: Record<string, string> = {
        "3_meses": "3 Meses",
        "6_meses": "6 Meses",
        "12_meses": "12 Meses",
      };

      doc.setFontSize(9);
      doc.setTextColor(...PRIMARY);
      doc.setFont("helvetica", "bold");
      doc.text("Plan:", margin + 6, y + 9);
      doc.setTextColor(...TEXT_WHITE);
      doc.setFont("helvetica", "normal");
      doc.text(durLabel[rutina.duracion_plan] || rutina.duracion_plan, margin + 20, y + 9);

      y += 22;

      // ============ CONTENIDO DE LA RUTINA ============
      const lines = rutina.texto_rutina.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          y += 3;
          continue;
        }

        // Heading ### (h3)
        if (trimmed.startsWith("### ")) {
          y = checkNewPage(y, 12, pageCount);
          doc.setFontSize(11);
          doc.setTextColor(...PRIMARY);
          doc.setFont("helvetica", "bold");
          const h3Text = trimmed.replace(/^###\s*/, "").replace(/\*\*/g, "");
          const h3Lines = doc.splitTextToSize(h3Text, contentW - 4);
          doc.text(h3Lines, margin + 2, y);
          y += h3Lines.length * 5 + 3;
          continue;
        }

        // Heading ## (h2) - secciones principales
        if (trimmed.startsWith("## ")) {
          y = checkNewPage(y, 18, pageCount);
          y += 4;
          // Barra decorativa
          doc.setFillColor(...PRIMARY);
          doc.rect(margin, y, 3, 8, "F");
          // Fondo del título
          doc.setFillColor(255, 69, 0, 0.08);
          doc.setFillColor(30, 15, 10);
          doc.roundedRect(margin + 5, y - 1, contentW - 5, 10, 2, 2, "F");

          doc.setFontSize(13);
          doc.setTextColor(...TEXT_WHITE);
          doc.setFont("helvetica", "bold");
          const h2Text = trimmed.replace(/^##\s*/, "").replace(/\*\*/g, "");
          doc.text(h2Text, margin + 9, y + 6);
          y += 15;
          continue;
        }

        // Heading # (h1)
        if (trimmed.startsWith("# ")) {
          y = checkNewPage(y, 16, pageCount);
          doc.setFontSize(16);
          doc.setTextColor(...TEXT_WHITE);
          doc.setFont("helvetica", "bold");
          const h1Text = trimmed.replace(/^#\s*/, "").replace(/\*\*/g, "");
          doc.text(h1Text, margin, y);
          // Línea debajo
          y += 7;
          doc.setDrawColor(...PRIMARY);
          doc.setLineWidth(0.6);
          doc.line(margin, y, margin + contentW * 0.4, y);
          y += 6;
          continue;
        }

        // Separador ---
        if (/^[-]{3,}$/.test(trimmed)) {
          y = checkNewPage(y, 8, pageCount);
          y += 2;
          doc.setDrawColor(...BORDER);
          doc.setLineWidth(0.2);
          doc.line(margin + 10, y, pageW - margin - 10, y);
          y += 5;
          continue;
        }

        // Bullet list items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          y = checkNewPage(y, 8, pageCount);
          const bulletText = trimmed.replace(/^[-*]\s*/, "");
          const cleanText = bulletText.replace(/\*\*/g, "");

          // Bullet point naranja
          doc.setFillColor(...PRIMARY);
          doc.circle(margin + 4, y - 1.2, 1, "F");

          doc.setFontSize(9);
          doc.setTextColor(...TEXT_WHITE);
          doc.setFont("helvetica", "normal");

          // Detectar texto en negrita y renderizarlo
          const parts = bulletText.split(/\*\*(.*?)\*\*/g);
          const wrappedLines = doc.splitTextToSize(cleanText, contentW - 12);

          if (wrappedLines.length === 1) {
            let xOff = margin + 9;
            for (let i = 0; i < parts.length; i++) {
              if (!parts[i]) continue;
              doc.setFont("helvetica", i % 2 === 1 ? "bold" : "normal");
              doc.text(parts[i], xOff, y);
              xOff += doc.getTextWidth(parts[i]);
            }
          } else {
            doc.text(wrappedLines, margin + 9, y);
          }
          y += wrappedLines.length * 4.5 + 1.5;
          continue;
        }

        // Texto normal (párrafo)
        y = checkNewPage(y, 8, pageCount);
        const cleanParagraph = trimmed.replace(/\*\*/g, "");
        doc.setFontSize(9);
        doc.setTextColor(...TEXT_WHITE);
        doc.setFont("helvetica", "normal");
        const pLines = doc.splitTextToSize(cleanParagraph, contentW);

        for (const pLine of pLines) {
          y = checkNewPage(y, 5, pageCount);
          doc.text(pLine, margin, y);
          y += 4.5;
        }
        y += 1;
      }

      // Guardar
      doc.save(`FitBoch_Rutina_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {loading ? "Generando PDF..." : "Descargar PDF"}
    </Button>
  );
}
