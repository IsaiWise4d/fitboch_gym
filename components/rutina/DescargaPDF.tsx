"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DescargaPDFProps {
  rutinaId: string;
}

export function DescargaPDF({ rutinaId }: DescargaPDFProps) {
  async function handleDownload() {
    // TODO: Implementar generación de PDF en Fase 4
    // Por ahora, simplemente abre la rutina en una ventana para imprimir
    window.print();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className="w-full sm:w-auto"
    >
      <Download className="h-4 w-4 mr-2" />
      Descargar PDF
    </Button>
  );
}
