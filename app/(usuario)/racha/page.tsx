// Página de la sección Racha: resumen + calendario mensual.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDatosPaginaRacha } from "@/lib/racha/server";
import { CalendarioRacha } from "@/components/racha/CalendarioRacha";
import { ResumenRachaCard } from "@/components/racha/ResumenRachaCard";
import { ChevronDown, CircleCheck, Coffee, RotateCcw } from "lucide-react";

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

  const { estado, resumen, dias } = await getDatosPaginaRacha(user.id, year, month);

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
    <div className="space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Racha</h1>
        <p className="text-sm text-muted-foreground">
          Tu constancia día a día. Entrena de lunes a sábado para mantenerla.
        </p>
      </div>

      <ResumenRachaCard estado={estado} mejorRacha={resumen.mejorRacha} />

      <CalendarioRacha
        dias={dias}
        nombreMes={nombreMes}
        diasEntrenados={resumen.diasActivosMes}
        hrefPrev={hrefPrev}
        hrefNext={hrefNext}
        nextDisabled={nextDisabled}
        hoyStr={hoyBogota}
      />

      <ComoFuncionaRacha />
    </div>
  );
}

const REGLAS_RACHA = [
  {
    icono: CircleCheck,
    color: "bg-orange-500/15 text-orange-400",
    texto: "Registra al menos un ejercicio de lunes a sábado para sumar un día.",
  },
  {
    icono: Coffee,
    color: "bg-white/10 text-foreground",
    texto: "El domingo es descanso: no suma ni rompe tu racha.",
  },
  {
    icono: RotateCcw,
    color: "bg-amber-500/15 text-amber-300",
    texto: "Puedes fallar un día. Si fallas dos seguidos (sin un domingo en medio), la racha vuelve a cero.",
  },
];

/** Reglas de la racha, plegadas para no robar espacio al calendario. */
function ComoFuncionaRacha() {
  return (
    <details className="group rounded-2xl border border-border bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        ¿Cómo funciona tu racha?
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="space-y-3 border-t border-border/60 px-4 py-3">
        {REGLAS_RACHA.map(({ icono: Icono, color, texto }) => (
          <li key={texto} className="flex items-start gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icono className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="pt-1.5 text-xs leading-relaxed text-muted-foreground">{texto}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
