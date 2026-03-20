"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import type { Rutina } from "@/types/app";
import { parsearDiasRutina } from "@/lib/utils/parsear-rutina";

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
      const CARD_BG = [22, 22, 22] as const;
      const TEXT_PRIMARY = [255, 255, 255] as const;
      const TEXT_SECONDARY = [180, 180, 180] as const;
      const BORDER_COLOR = [45, 45, 45] as const;

      function drawBackground() {
        doc.setFillColor(...BG_DARK);
        doc.rect(0, 0, pageW, pageH, "F");
      }

      function drawFooter(pageNum: number) {
        doc.setFontSize(8);
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(`FitBoch - Tu Plan de Entrenamiento · Pág. ${pageNum}`, pageW / 2, pageH - 8, { align: "center" });
      }

      function checkNewPage(needed: number, pageCount: { n: number }) {
        if (y + needed > pageH - 15) {
          doc.addPage();
          pageCount.n++;
          drawBackground();
          drawFooter(pageCount.n);
          y = margin + 5;
          return true;
        }
        return false;
      }

      const pageCount = { n: 1 };
      drawBackground();
      drawFooter(1);
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

      // Helper function to draw tabular data
      function drawTable(tableData: string[][]) {
        if (tableData.length === 0) return;
        const headers = tableData[0].map(h => h.replace(/\*\*/g, "").replace(/\*/g, "").trim());
        const body = tableData.slice(1);
        
        const colWidth = contentW / headers.length;
        
        checkNewPage(12, pageCount);
        // Header Tabla
        doc.setFillColor(35, 35, 35);
        doc.rect(margin, y, contentW, 8, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...PRIMARY);
        
        headers.forEach((h, i) => {
          const wrappedH = doc.splitTextToSize(h.toUpperCase(), colWidth - 2);
          doc.text(wrappedH, margin + i * colWidth + 2, y + 5);
        });
        
        y += 8;
        
        // Body Tabla
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...TEXT_PRIMARY);
        
        body.forEach((row) => {
          // Pre-calculate heights
          const wrappedCells = row.map(cell => {
             const cleanCell = cell.replace(/\*\*/g, "").replace(/\*/g, "").trim();
             return doc.splitTextToSize(cleanCell, colWidth - 4);
          });
          
          const maxLines = Math.max(1, ...wrappedCells.map(lines => lines.length));
          const rowHeight = (maxLines * 4.5) + 3; // base padding + text height
          
          checkNewPage(rowHeight + 4, pageCount);
          
          // Render each column text for this row
          wrappedCells.forEach((lines, i) => {
            doc.text(lines, margin + i * colWidth + 2, y + 4.5);
          });
          
          y += rowHeight;
          
          // Draw bottom separator
          doc.setDrawColor(...BORDER_COLOR);
          doc.setLineWidth(0.1);
          doc.line(margin, y, margin + contentW, y);
        });
        y += 6;
      }

      // Intro / Resumen
      const dias = parsearDiasRutina(rutina.texto_rutina);
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
        
        const cleanIntro = intro.replace(/#/g, "").replace(/\*\*/g, "").replace(/\*/g, "").trim();
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
        
        const rowsForTable: string[][] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
             y += 2;
             continue;
          }
          
          if (line.includes("|") && line.startsWith("|")) {
             if (line.includes("---")) continue; // markdown table separator
             const cols = line.split("|").filter(c => c.trim() !== "").map(c => c.trim());
             rowsForTable.push(cols);
          } else {
             // Si estabamos acumulando una tabla, dibujarla primero
             if (rowsForTable.length > 0) {
               drawTable(rowsForTable);
               rowsForTable.length = 0;
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
             cleanLine = cleanLine.replace(/#/g, "").replace(/\*\*/g, "").replace(/\*/g, "");
             
             const wrappedContent = doc.splitTextToSize(cleanLine, contentW);
             checkNewPage(wrappedContent.length * 5 + 2, pageCount);
             doc.text(wrappedContent, margin, y);
             y += wrappedContent.length * 5 + 2;
          }
        }
        
        // Si la sección termina con una tabla
        if (rowsForTable.length > 0) {
           drawTable(rowsForTable);
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
