// Formatos de fecha y número para el panel admin. Deterministas: no
// dependen del ICU de Node ni del navegador (que abrevian distinto, p. ej.
// "sep" vs "sept"), así el HTML del servidor y el del cliente coinciden.
// Las fechas son "YYYY-MM-DD" (día Bogotá ya resuelto).

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function partes(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return { anio, mes, dia, diaSemana };
}

/** "28 sep" */
export function fechaCorta(fecha: string): string {
  const { mes, dia } = partes(fecha);
  return `${dia} ${MESES_CORTOS[mes - 1]}`;
}

/** "lun 28 sep" */
export function fechaConDia(fecha: string): string {
  const { mes, dia, diaSemana } = partes(fecha);
  return `${DIAS_CORTOS[diaSemana]} ${dia} ${MESES_CORTOS[mes - 1]}`;
}

/** "28 sep 2026" */
export function fechaMedia(fecha: string): string {
  const { anio, mes, dia } = partes(fecha);
  return `${dia} ${MESES_CORTOS[mes - 1]} ${anio}`;
}

/** "sábado 3 de octubre" */
export function fechaLarga(fecha: string): string {
  const { mes, dia, diaSemana } = partes(fecha);
  return `${DIAS_LARGOS[diaSemana]} ${dia} de ${MESES_LARGOS[mes - 1]}`;
}

/** "Octubre 2026" a partir de "YYYY-MM". */
export function mesLargo(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  const nombre = MESES_LARGOS[m - 1];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

/** "oct 26" a partir de "YYYY-MM" (ejes de tendencia). */
export function mesCorto(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  return `${MESES_CORTOS[m - 1]} ${String(anio).slice(2)}`;
}

/** "Hoy", "Ayer", "Hace 3 días", "Hace 2 sem." o la fecha corta. */
export function textoHace(fecha: string, hoy: string): string {
  const a = partes(fecha);
  const h = partes(hoy);
  const dias = Math.round(
    (Date.UTC(h.anio, h.mes - 1, h.dia) - Date.UTC(a.anio, a.mes - 1, a.dia)) / 86_400_000
  );
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 14) return `Hace ${dias} días`;
  if (dias < 60) return `Hace ${Math.floor(dias / 7)} sem.`;
  return fechaMedia(fecha);
}

/** Separador de miles con punto (es-CO), sin depender de Intl. */
export function formatoNumero(valor: number, decimales = 0): string {
  const negativo = valor < 0;
  const [entero, fraccion] = Math.abs(valor).toFixed(decimales).split(".");
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "-" : ""}${conMiles}${fraccion ? `,${fraccion}` : ""}`;
}

/** "$80.000" */
export function formatoPesos(valor: number): string {
  return `$${formatoNumero(Math.round(valor))}`;
}

/** 0.873 → "87 %"; null → "—". */
export function formatoPorcentaje(valor: number | null): string {
  return valor === null ? "—" : `${Math.round(valor * 100)}%`;
}

/** Valor compacto para ejes y tarjetas: 12.400 → "12,4 k". */
export function formatoCompacto(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) return `${formatoNumero(valor / 1_000_000, 1)} M`;
  if (Math.abs(valor) >= 10_000) return `${formatoNumero(valor / 1_000, 1)} k`;
  return formatoNumero(valor);
}
