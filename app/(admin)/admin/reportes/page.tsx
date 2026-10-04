import { redirect } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getHoyColombia } from "@/lib/utils/fecha";
import { ReporteMensualForm } from "@/components/admin/ReporteMensualForm";

export default async function ReportesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileSpreadsheet className="h-6 w-6 text-primary" aria-hidden="true" />
          Reportes
        </h1>
        <p className="text-sm text-muted-foreground">
          Elige un mes y descarga en Excel el reporte completo de todos los usuarios: racha,
          asistencia, ejercicios completados y membresías.
        </p>
      </header>

      <ReporteMensualForm mesActual={getHoyColombia().slice(0, 7)} />
    </div>
  );
}
