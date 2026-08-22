// Página de la sección Racha: resumen + calendario mensual.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDatosPaginaRacha } from "@/lib/racha/server";
import { CalendarioRacha } from "@/components/racha/CalendarioRacha";
import { Flame, Trophy, CalendarDays } from "lucide-react";
import type { CalendarioRachaDia, ResumenRacha } from "@/lib/racha/types";

function parseYearMonth(searchParams: Record<string, string | string[] | undefined>) {
  const hoy = new Date();
  // Asegurar mes en zona Bogotá (el mes "actual" para el usuario).
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(hoy);
  const get = (t: string) => partes.find((p) => p.type === t)?.value;
  const currentYear = Number(get("year"));
  const currentMonth = Number(get("month"));

  const yRaw = searchParams?.y;
  const mRaw = searchParams?.m;
  let year = currentYear;
  let month = currentMonth;
  if (typeof yRaw === "string" && typeof mRaw === "string") {
    const y = Number(yRaw);
    const m = Number(mRaw);
    if (Number.isInteger(y) && Number.isInteger(m) && m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }
  return { year, month, currentYear, currentMonth };
}

export default async function RachaPage({
  searchParams,
}: {
  // En Next.js 16 `searchParams` es una Promise que debe resolverse con await
  // antes de acceder a sus propiedades. Ver:
  // https://nextjs.org/docs/messages/sync-dynamic-apis
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const { year, month, currentYear, currentMonth } = parseYearMonth(params);

  const { resumen, dias } = await getDatosPaginaRacha(user.id, year, month);

  const vacio: ResumenRacha = {
    currentCount: 0,
    mejorRacha: 0,
    diasActivosMes: 0,
  };
  const state: ResumenRacha = resumen ?? vacio;
  const diasSeguros: CalendarioRachaDia[] = dias ?? [];

  const nombreMes = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));

  // Navegación entre meses.
  const prevDate = new Date(Date.UTC(year, month - 1, 1));
  prevDate.setUTCMonth(prevDate.getUTCMonth() - 1);
  const nextDate = new Date(Date.UTC(year, month - 1, 1));
  nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  const hoyBogota = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const nextDisabled =
    nextDate.getUTCFullYear() > currentYear ||
    (nextDate.getUTCFullYear() === currentYear &&
      nextDate.getUTCMonth() + 1 > currentMonth);

  const hrefPrev = `/racha?y=${prevDate.getUTCFullYear()}&m=${prevDate.getUTCMonth() + 1}`;
  const hrefNext = `/racha?y=${nextDate.getUTCFullYear()}&m=${nextDate.getUTCMonth() + 1}`;

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          Racha
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu constancia día a día. Los domingos son de descanso y no cuentan.
        </p>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Flame className="h-5 w-5 mx-auto text-orange-400" />
          <p className="mt-2 text-2xl font-bold leading-none">
            {state.currentCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Actual</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <Trophy className="h-5 w-5 mx-auto text-primary" />
          <p className="mt-2 text-2xl font-bold leading-none">
            {state.mejorRacha}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Mejor</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <CalendarDays className="h-5 w-5 mx-auto text-muted-foreground" />
          <p className="mt-2 text-2xl font-bold leading-none">
            {state.diasActivosMes}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Este mes</p>
        </div>
      </div>

      {/* Calendario */}
      <CalendarioRacha
        dias={diasSeguros}
        nombreMes={nombreMes}
        hrefPrev={hrefPrev}
        hrefNext={hrefNext}
        nextDisabled={nextDisabled}
        hoyStr={hoyBogota}
      />

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-400/80" />
          Día activado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-orange-500/60" />
          Hoy (pendiente)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-muted-foreground/30" />
          Día exigible no activado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-muted/60" />
          Descanso (domingo)
        </span>
      </div>
    </div>
  );
}
