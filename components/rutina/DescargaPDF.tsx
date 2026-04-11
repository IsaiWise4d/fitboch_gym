"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import type { Rutina } from "@/types/app";
import { cleanMarkdownPdfText, parseMarkdownTable } from "@/lib/pdf/markdown-table";

interface DescargaPDFProps {
  rutina: Rutina;
}

export function DescargaPDF({ rutina }: DescargaPDFProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentW = pageW - margin * 2;
      let y = 0;

      // Colores Premium FitBoch (Brand Yellow)
      const PRIMARY = [249, 198, 51] as const; 
      const BG_DARK = [14, 14, 14] as const;
      const TEXT_PRIMARY = [255, 255, 255] as const;
      const TEXT_SECONDARY = [180, 180, 180] as const;
      const BORDER_COLOR = [45, 45, 45] as const;

      function drawBackground() {
        doc.setFillColor(...BG_DARK);
        doc.rect(0, 0, pageW, pageH, "F");
      }

      // Load watermark helper (vector preferred, image fallback)
      const watermarkMod = await import("@/lib/pdf/watermark");
      const { drawWatermark } = watermarkMod;

      function drawFooter(pageNum: number) {
        doc.setFontSize(8);
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(`FitBoch - Tu Plan de Entrenamiento · Pág. ${pageNum}`, pageW / 2, pageH - 8, { align: "center" });
      }

      function checkNewPage(needed: number, pageCount: { n: number }) {
        if (y + needed > pageH - 15) {
          const currentFont = doc.getFont();
          const currentFontSize = doc.getFontSize();
          doc.addPage();
          pageCount.n++;
          drawBackground();
          drawFooter(pageCount.n);
          // redraw watermark on every new page using dieta color
          // Use a subtle white watermark instead of the brand yellow to avoid "super yellow" look
          drawWatermark(doc, pageW, pageH, { color: [255, 255, 255], opacity: 0.02, angle: 35 });
          doc.setFont(currentFont.fontName, currentFont.fontStyle || "normal");
          doc.setFontSize(currentFontSize);
          y = margin + 5;
          return true;
        }
        return false;
      }

      const pageCount = { n: 1 };
      drawBackground();
      drawFooter(1);
      // draw watermark on first page using a subtle white color
      drawWatermark(doc, pageW, pageH, { color: [255, 255, 255], opacity: 0.02, angle: 35 });
      y = margin + 5;

      // Header
      doc.setFillColor(...PRIMARY);
      doc.roundedRect(margin, y, contentW, 25, 2, 2, "F");
      
      doc.setTextColor(0, 0, 0); // Texto negro sobre dorado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("FITBOCH", margin + 8, y + 13);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("TU EVOLUCIÓN EMPIEZA AQUÍ", margin + 8, y + 20);

      const fechaStr = new Date(rutina.created_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      doc.setFontSize(8);
      doc.text(fechaStr.toUpperCase(), pageW - margin - 8, y + 10, { align: "right" });

      y += 35;

      function drawTable(tableLines: string[]) {
        const tableData = parseMarkdownTable(tableLines, { maxColumns: 6 });
        if (!tableData) return;

        const { headers, rows } = tableData;
        const weights = headers.map((header) => {
          const text = header.toUpperCase();
          if (
            text.includes("EJERCICIO") ||
            text.includes("COMIDA") ||
            text.includes("INGREDIENTES")
          ) {
            return 3.4;
          }
          if (text.includes("FUNCIONALIDAD") || text.includes("NOTAS")) {
            return 2.4;
          }
          if (
            text.includes("SERIES") ||
            text.includes("REPS") ||
            text.includes("RIR") ||
            text.includes("RPE") ||
            text.includes("TEMPO") ||
            text.includes("DESCANSO") ||
            text.includes("OPCIÓN")
          ) {
            return 1.2;
          }
          return 1.6;
        });

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const colWidths = weights.map((w) => (w / totalWeight) * contentW);
        const getColX = (index: number) => {
          let x = margin;
          for (let i = 0; i < index; i++) x += colWidths[i];
          return x;
        };

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        const headerLines = headers.map((header, i) =>
          doc.splitTextToSize(header.toUpperCase(), Math.max(colWidths[i] - 3, 8))
        );
        const maxHeaderLines = Math.max(1, ...headerLines.map((line) => line.length));
        const headerHeight = Math.max(8, maxHeaderLines * 3.8 + 2.5);

        const rowMetrics = rows.map((row) => {
          const wrappedCells = row.map((cell, i) =>
            doc.splitTextToSize(cleanMarkdownPdfText(cell), Math.max(colWidths[i] - 3, 8))
          );
          const maxLines = Math.max(1, ...wrappedCells.map((lines) => lines.length));
          const rowHeight = Math.max(6.5, maxLines * 4 + 2);
          return { wrappedCells, rowHeight };
        });

        const totalTableHeight =
          headerHeight + rowMetrics.reduce((sum, row) => sum + row.rowHeight, 0) + 8;
        const maxSinglePageTableHeight = pageH - 15 - (margin + 5);

        if (totalTableHeight <= maxSinglePageTableHeight) {
          checkNewPage(totalTableHeight, pageCount);
        } else {
          checkNewPage(headerHeight + 3, pageCount);
        }

        doc.setFillColor(35, 35, 35);
        doc.rect(margin, y, contentW, headerHeight, "F");
        doc.setTextColor(...PRIMARY);

        headerLines.forEach((lines, i) => {
          const xPos = getColX(i);
          doc.text(lines, xPos + 1.5, y + 4);
        });

        y += headerHeight;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...TEXT_PRIMARY);

        rowMetrics.forEach((row) => {
          const { wrappedCells, rowHeight } = row;

          checkNewPage(rowHeight + 2, pageCount);

          wrappedCells.forEach((lines, i) => {
            const xPos = getColX(i);
            doc.text(lines, xPos + 1.5, y + 4);
          });

          y += rowHeight;
          doc.setDrawColor(...BORDER_COLOR);
          doc.setLineWidth(0.1);
          doc.line(margin, y, margin + contentW, y);
        });

        y += 6;
      }

      // Intro / Resumen
      const intro = rutina.texto_rutina.split("##")[0].trim();
      
      if (intro) {
        doc.setTextColor(...TEXT_PRIMARY);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN DEL PLAN", margin, y);
        y += 5;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...TEXT_SECONDARY);
        
        const cleanIntro = cleanMarkdownPdfText(intro.replace(/#/g, " "));
        const introLines = doc.splitTextToSize(cleanIntro, contentW);
        doc.text(introLines, margin, y);
        y += introLines.length * 5 + 10;
      }

      // Procesar Secciones (Fases, etc.)
      const allSections = rutina.texto_rutina.split("##").slice(1);
      
      allSections.forEach(section => {
        const lines = section.trim().split("\n");
        const title = lines[0].replace(/#/g, "").replace(/\*/g, "").trim();
        
        checkNewPage(25, pageCount);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...PRIMARY);
        doc.text(title.toUpperCase(), margin, y);
        y += 7;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...TEXT_SECONDARY);
        
         const tableLines: string[] = [];
         
         for (let i = 1; i < lines.length; i++) {
           const line = lines[i].trim();
           if (!line) {
             if (tableLines.length > 0) {
               drawTable(tableLines);
               tableLines.length = 0;
             }
              y += 2;
              continue;
           }
           
           if (line.includes("|") && line.startsWith("|")) {
             tableLines.push(line);
           } else {
             if (tableLines.length > 0) {
               drawTable(tableLines);
               tableLines.length = 0;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
              }
              
              doc.setTextColor(...TEXT_SECONDARY);
              
              let cleanLine = line;
              if (cleanLine.startsWith("- ")) {
                cleanLine = "• " + cleanLine.substring(2);
              } else if (cleanLine.startsWith("* ")) {
                cleanLine = "• " + cleanLine.substring(2);
              }
              cleanLine = cleanMarkdownPdfText(cleanLine.replace(/#/g, " "));
              
              if (!cleanLine) continue;
              const wrappedContent = doc.splitTextToSize(cleanLine, contentW);
              checkNewPage(wrappedContent.length * 5 + 2, pageCount);
              doc.text(wrappedContent, margin, y);
             y += wrappedContent.length * 5 + 2;
          }
         }
         
         if (tableLines.length > 0) {
            drawTable(tableLines);
         }
        
        y += 5;
      });

      doc.save(`Rutina_FitBoch_${rutina.id.substring(0, 8)}.pdf`);
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
        <FileText className="h-4 w-4 mr-2" />
      )}
      {loading ? "Generando PDF..." : "Exportar PDF Premium"}
    </Button>
  );
}
