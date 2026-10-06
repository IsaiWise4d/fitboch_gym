// Cálculo PURO del reporte mensual de usuarios del panel admin.
//
// No depende de Supabase ni de exceljs: recibe las filas ya leídas y
// devuelve las tablas del reporte, para poder testearlo aislado
// (ver mensual.test.ts). La lectura vive en server.ts y el armado del
// Excel en excel.ts.
//
// Todas las fechas de "día" se calculan en America/Bogota, con las mismas
// reglas de la racha (lib/racha). Imports relativos para que vitest (sin
// configuración de alias) pueda resolverlos.

import {
  calcularMejorRacha,
  calcularRacha,
  construirCalendarioActivaciones,
  esDiaExigible,
  FECHA_INICIO_RACHA,
  shouldResetStreak,
} from "../racha/reglas";
import {
  diaBogotaString,
  fechaAString,
  stringAFecha,
  sumarDias,
  TZ_BOGOTA,
} from "../racha/bogota";
import {
  ETIQUETA_ESTADO,
  estadoMembresia,
  etiquetaPlan,
  membresiaActual,
} from "../membresias/estado";

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

export interface SerieReporte {
  serie_numero: number;
  peso_kg: number;
  repeticiones: number;
}

/** Un ejercicio registrado dentro del mes del reporte. */
export interface RegistroReporte {
  id: string;
  user_id: string;
  ejercicio_id: string;
  /** Timestamp ISO UTC de historial_ejercicios.fecha_completado. */
  fecha_completado: string;
  tiempo_descanso_minutos: number;
  ejercicio: { nombre: string; grupo_muscular: string } | null;
  series: SerieReporte[];
}

/** Un ejercicio registrado ANTES del mes (para racha y récords previos). */
export interface RegistroPrevioReporte {
  user_id: string;
  ejercicio_id: string;
  fecha_completado: string;
  /** Peso máximo de sus series (0 si no tiene series con peso). */
  peso_max: number;
}

export interface MembresiaReporte {
  id: string;
  created_at: string;
  tipo_plan: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  monto_pagado: number | null;
}

export interface UsuarioReporte {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
  activo: boolean;
  created_at: string;
  membresias: MembresiaReporte[];
}

export interface EntradaReporte {
  /** Mes del reporte, "YYYY-MM". */
  mes: string;
  /** Hoy en Bogotá, "YYYY-MM-DD". */
  hoy: string;
  usuarios: UsuarioReporte[];
  registrosMes: RegistroReporte[];
  registrosPrevios: RegistroPrevioReporte[];
}

// ---------------------------------------------------------------------------
// Salida
// ---------------------------------------------------------------------------

export type ClasificacionActividad =
  | "Muy activo"
  | "Activo"
  | "Irregular"
  | "Inactivo"
  | "Sin datos";

/**
 * Estado de un usuario en un día del mes (hoja "Asistencia"):
 * - entreno: día L-V con ejercicio.
 * - fallo: día L-V ya transcurrido sin ejercicio.
 * - domingo_entreno / descanso: fin de semana con o sin ejercicio (no exigible).
 * - pendiente: hoy sin registrar todavía, o un día futuro.
 * - fuera: antes de que el usuario se registrara.
 */
export type EstadoDiaAsistencia =
  | "entreno"
  | "fallo"
  | "domingo_entreno"
  | "descanso"
  | "pendiente"
  | "fuera";

export interface FilaUsuarioReporte {
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  genero: string | null;
  edad: number | null;
  cuentaActiva: boolean;
  fechaRegistro: string;
  plan: string | null;
  estadoMembresia: string;
  membresiaFin: string | null;
  montoMembresia: number | null;
  /** Días distintos con al menos un ejercicio (incluye fines de semana). */
  diasEntrenados: number;
  /** Días L-V con ejercicio. */
  diasExigiblesCumplidos: number;
  /** Días L-V transcurridos en los que el usuario podía entrenar. */
  diasExigiblesTranscurridos: number;
  diasFallados: number;
  /** cumplidos / transcurridos (0..1), null si no hubo días evaluables. */
  asistencia: number | null;
  clasificacion: ClasificacionActividad;
  /** Racha al cierre del mes (o la actual si el mes está en curso). */
  rachaCierre: number;
  /** Racha más alta alcanzada durante el mes. */
  mejorRachaMes: number;
  /** Mejor racha histórica hasta el cierre del mes. */
  mejorRachaHistorica: number;
  ejercicios: number;
  series: number;
  repeticiones: number;
  volumenKg: number;
  pesoMaximoKg: number | null;
  ejercicioPesoMaximo: string | null;
  ejercicioFrecuente: string | null;
  grupoFrecuente: string | null;
  gruposTrabajados: number;
  descansoPromedioMin: number | null;
  primerEntreno: string | null;
  ultimoEntreno: string | null;
  /** Ejercicios en los que el usuario superó su marca previa. */
  recordsSuperados: number;
  detalleRecords: string;
  /** Estado por día, alineado con `ReporteMensual.dias`. */
  asistenciaDias: EstadoDiaAsistencia[];
}

export interface FilaDetalleReporte {
  fecha: string;
  hora: string;
  diaSemana: string;
  usuario: string;
  email: string;
  ejercicio: string;
  grupoMuscular: string;
  series: number;
  repeticiones: number;
  pesoMaximoKg: number;
  volumenKg: number;
  descansoMin: number;
  detalleSeries: string;
}

export interface FilaRankingEjercicio {
  ejercicio: string;
  grupoMuscular: string;
  registros: number;
  usuarios: number;
  series: number;
  repeticiones: number;
  volumenKg: number;
  pesoMaximoKg: number;
}

export interface FilaMembresiaReporte {
  usuario: string;
  email: string;
  plan: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  monto: number | null;
  movimiento: string;
}

export interface ResumenReporte {
  usuariosIncluidos: number;
  usuariosConActividad: number;
  usuariosSinActividad: number;
  ejercicios: number;
  series: number;
  repeticiones: number;
  volumenKg: number;
  promedioDiasPorUsuarioActivo: number;
  asistenciaPromedio: number | null;
  usuariosConRachaAlCierre: number;
  rachaMasAlta: number;
  usuarioRachaMasAlta: string | null;
  diaSemanaMasActivo: string | null;
  diaMasConcurrido: string | null;
  usuariosDiaMasConcurrido: number;
  clasificacion: Record<ClasificacionActividad, number>;
  membresiasActivas: number;
  membresiasPorVencer: number;
  membresiasVencidas: number;
  usuariosSinMembresia: number;
  membresiasNuevasMes: number;
  membresiasVencenMes: number;
  ingresosMes: number;
  /** Usuarios por días entrenados (desc), máximo 10. */
  topUsuarios: { usuarioId: string; nombre: string; dias: number; asistencia: number | null }[];
  /** Ejercicios más registrados, máximo 10. */
  topEjercicios: { ejercicio: string; registros: number }[];
}

export interface ReporteMensual {
  mes: string;
  /** "Septiembre 2026". */
  nombreMes: string;
  inicio: string;
  fin: string;
  /** true si el mes del reporte es el mes en curso (datos parciales). */
  enCurso: boolean;
  /** Días del mes "YYYY-MM-DD". */
  dias: string[];
  resumen: ResumenReporte;
  usuarios: FilaUsuarioReporte[];
  detalle: FilaDetalleReporte[];
  ranking: FilaRankingEjercicio[];
  membresias: FilaMembresiaReporte[];
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

const MES_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Lunes primero, igual que el calendario de racha. */
export const NOMBRES_DIA_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** true si `mes` tiene el formato "YYYY-MM" con un mes válido. */
export function esMesValido(mes: string): boolean {
  return MES_REGEX.test(mes);
}

/** Nombre legible de un mes "YYYY-MM": "Septiembre 2026". */
export function nombreDeMes(mes: string): string {
  const [anio, numero] = mes.split("-").map(Number);
  return `${NOMBRES_MES[numero - 1]} ${anio}`;
}

/** Suma `delta` meses a un mes "YYYY-MM". */
export function sumarMeses(mes: string, delta: number): string {
  const [anio, numero] = mes.split("-").map(Number);
  const total = anio * 12 + (numero - 1) + delta;
  const nuevoAnio = Math.floor(total / 12);
  const nuevoMes = (total % 12) + 1;
  return `${nuevoAnio}-${String(nuevoMes).padStart(2, "0")}`;
}

export interface RangoMes {
  inicio: string;
  fin: string;
  dias: string[];
  /** Medianoche Bogotá del día 1 en UTC (inclusive). */
  inicioUtcIso: string;
  /** Medianoche Bogotá del día 1 del mes siguiente en UTC (exclusivo). */
  finUtcIso: string;
}

/** Rango de días (Bogotá) y límites UTC de un mes "YYYY-MM". */
export function rangoMes(mes: string): RangoMes {
  const [anio, numero] = mes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(anio, numero, 0)).getUTCDate();
  const inicio = `${mes}-01`;
  const fin = `${mes}-${String(ultimoDia).padStart(2, "0")}`;
  const dias: string[] = [];
  for (let d = 1; d <= ultimoDia; d++) {
    dias.push(`${mes}-${String(d).padStart(2, "0")}`);
  }
  return {
    inicio,
    fin,
    dias,
    inicioUtcIso: new Date(Date.UTC(anio, numero - 1, 1, 5)).toISOString(),
    finUtcIso: new Date(Date.UTC(anio, numero, 1, 5)).toISOString(),
  };
}

const FORMATO_HORA = new Intl.DateTimeFormat("es-CO", {
  timeZone: TZ_BOGOTA,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function horaBogota(iso: string): string {
  return FORMATO_HORA.format(new Date(iso));
}

function diaSemana(fecha: string): number {
  return stringAFecha(fecha).getUTCDay();
}

function edadEn(fechaNacimiento: string | null, hoy: string): number | null {
  if (!fechaNacimiento) return null;
  const [hY, hM, hD] = hoy.split("-").map(Number);
  const [nY, nM, nD] = fechaNacimiento.split("-").map(Number);
  if (!nY) return null;
  let edad = hY - nY;
  if (hM < nM || (hM === nM && hD < nD)) edad -= 1;
  return edad;
}

// ---------------------------------------------------------------------------
// Racha
// ---------------------------------------------------------------------------

/**
 * Racha más alta alcanzada en algún día activado dentro de [desde, hasta].
 *
 * Recorre los días desde la primera activación con las mismas reglas que
 * `calcularMejorRacha` (fin de semana neutro, 2 fallos tolerados, 3
 * seguidos resetean), de modo que una racha que viene del mes anterior
 * sigue sumando dentro del mes.
 */
export function calcularRachaMaximaEnRango(
  activados: Set<string>,
  desde: string,
  hasta: string
): number {
  if (activados.size === 0) return 0;
  const primera = Array.from(activados).sort()[0];
  const inicioRango = stringAFecha(desde).getTime();
  const limite = stringAFecha(hasta).getTime();

  let cursor = stringAFecha(primera);
  let count = 0;
  let consecutiveMissed = 0;
  let mejor = 0;
  let guardias = 0;

  while (cursor.getTime() <= limite && guardias < 2000) {
    guardias++;
    const fecha = fechaAString(cursor);
    if (!esDiaExigible(cursor)) {
      // Fin de semana neutro.
    } else if (activados.has(fecha)) {
      count += 1;
      consecutiveMissed = 0;
      if (cursor.getTime() >= inicioRango && count > mejor) mejor = count;
    } else {
      consecutiveMissed += 1;
      if (shouldResetStreak(consecutiveMissed)) {
        count = 0;
        consecutiveMissed = 0;
      }
    }
    cursor = sumarDias(cursor, 1);
  }
  return mejor;
}

// ---------------------------------------------------------------------------
// Membresías
// ---------------------------------------------------------------------------

/** Etiqueta del estado con las reglas compartidas (lib/membresias/estado.ts). */
function textoEstadoMembresia(membresia: MembresiaReporte | null, hoy: string): string {
  return ETIQUETA_ESTADO[estadoMembresia(membresia?.fecha_fin ?? null, hoy).clave];
}

// ---------------------------------------------------------------------------
// Utilidades de agregación
// ---------------------------------------------------------------------------

function redondear(valor: number, decimales = 1): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function formatearPeso(peso: number): string {
  return Number.isInteger(peso) ? String(peso) : peso.toFixed(1);
}

function masFrecuente(conteo: Map<string, number>): string | null {
  let mejor: string | null = null;
  let max = 0;
  for (const [clave, valor] of conteo) {
    if (valor > max || (valor === max && mejor !== null && clave < mejor)) {
      mejor = clave;
      max = valor;
    }
  }
  return mejor;
}

function incrementar(conteo: Map<string, number>, clave: string, cantidad = 1) {
  conteo.set(clave, (conteo.get(clave) ?? 0) + cantidad);
}

function totalesSeries(series: SerieReporte[]) {
  let repeticiones = 0;
  let volumen = 0;
  let pesoMax = 0;
  for (const s of series) {
    repeticiones += s.repeticiones;
    volumen += s.peso_kg * s.repeticiones;
    if (s.peso_kg > pesoMax) pesoMax = s.peso_kg;
  }
  return { repeticiones, volumen, pesoMax };
}

function clasificar(asistencia: number | null): ClasificacionActividad {
  if (asistencia === null) return "Sin datos";
  if (asistencia >= 0.8) return "Muy activo";
  if (asistencia >= 0.5) return "Activo";
  if (asistencia > 0) return "Irregular";
  return "Inactivo";
}

function nombreCompleto(usuario: UsuarioReporte): string {
  return `${usuario.nombre} ${usuario.apellido ?? ""}`.trim();
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------

/**
 * Construye todas las tablas del reporte mensual a partir de las filas
 * leídas de Supabase. Función pura y determinista (depende solo de la
 * entrada, incluido `hoy`).
 */
export function construirReporteMensual(entrada: EntradaReporte): ReporteMensual {
  const { mes, hoy, usuarios } = entrada;
  const rango = rangoMes(mes);
  const enCurso = hoy >= rango.inicio && hoy <= rango.fin;
  // Último día evaluable del mes: hoy si el mes está en curso.
  const ultimoDiaEvaluable = enCurso ? hoy : rango.fin;
  // "Hoy" con el que se evalúa la racha al cierre: el día siguiente al
  // cierre para meses pasados (así el último día del mes cuenta como
  // fallo si no se entrenó), o el hoy real si el mes está en curso.
  const hoyRacha = enCurso
    ? hoy
    : fechaAString(sumarDias(stringAFecha(rango.fin), 1));
  const corteRachaIso = new Date(`${FECHA_INICIO_RACHA}T05:00:00.000Z`).getTime();

  const registrosMes = [...entrada.registrosMes].sort((a, b) =>
    a.fecha_completado.localeCompare(b.fecha_completado)
  );

  const mesPorUsuario = new Map<string, RegistroReporte[]>();
  for (const r of registrosMes) {
    const lista = mesPorUsuario.get(r.user_id);
    if (lista) lista.push(r);
    else mesPorUsuario.set(r.user_id, [r]);
  }

  const previosPorUsuario = new Map<string, RegistroPrevioReporte[]>();
  for (const r of entrada.registrosPrevios) {
    const lista = previosPorUsuario.get(r.user_id);
    if (lista) lista.push(r);
    else previosPorUsuario.set(r.user_id, [r]);
  }

  const usuariosPorId = new Map(usuarios.map((u) => [u.id, u]));

  // --- Filas por usuario ---------------------------------------------------
  const filas: FilaUsuarioReporte[] = usuarios.map((usuario) => {
    const propios = mesPorUsuario.get(usuario.id) ?? [];
    const previos = previosPorUsuario.get(usuario.id) ?? [];

    const diasConEjercicio = new Set(
      propios.map((r) => diaBogotaString(r.fecha_completado))
    );

    // Racha: solo cuenta desde la fecha de corte (igual que lib/racha).
    const fechasRacha = [
      ...previos.map((r) => r.fecha_completado),
      ...propios.map((r) => r.fecha_completado),
    ].filter((iso) => new Date(iso).getTime() >= corteRachaIso);
    const activados = construirCalendarioActivaciones(fechasRacha);

    // Asistencia día a día.
    const registro = diaBogotaString(usuario.created_at);
    const asistenciaDias: EstadoDiaAsistencia[] = rango.dias.map((dia) => {
      if (dia > ultimoDiaEvaluable) return "pendiente";
      if (dia < registro) return "fuera";
      const entreno = diasConEjercicio.has(dia);
      if (!esDiaExigible(stringAFecha(dia))) {
        return entreno ? "domingo_entreno" : "descanso";
      }
      if (entreno) return "entreno";
      return dia === hoy ? "pendiente" : "fallo";
    });

    const diasExigiblesCumplidos = asistenciaDias.filter((e) => e === "entreno").length;
    const diasFallados = asistenciaDias.filter((e) => e === "fallo").length;
    const diasExigiblesTranscurridos = diasExigiblesCumplidos + diasFallados;
    const asistencia =
      diasExigiblesTranscurridos > 0
        ? diasExigiblesCumplidos / diasExigiblesTranscurridos
        : null;

    // Volumen y frecuencias.
    let series = 0;
    let repeticiones = 0;
    let volumen = 0;
    let pesoMaximo = 0;
    let ejercicioPesoMaximo: string | null = null;
    let descansoTotal = 0;
    const conteoEjercicios = new Map<string, number>();
    const conteoGrupos = new Map<string, number>();

    for (const r of propios) {
      const nombre = r.ejercicio?.nombre ?? "Ejercicio eliminado";
      const totales = totalesSeries(r.series);
      series += r.series.length;
      repeticiones += totales.repeticiones;
      volumen += totales.volumen;
      descansoTotal += r.tiempo_descanso_minutos;
      if (totales.pesoMax > pesoMaximo) {
        pesoMaximo = totales.pesoMax;
        ejercicioPesoMaximo = nombre;
      }
      incrementar(conteoEjercicios, nombre);
      if (r.ejercicio?.grupo_muscular) {
        incrementar(conteoGrupos, r.ejercicio.grupo_muscular.toLowerCase());
      }
    }

    // Récords: el mejor peso del mes por ejercicio frente a la marca previa
    // (antes del mes, o la primera sesión del mes si es un ejercicio nuevo).
    const marcaPrevia = new Map<string, number>();
    for (const r of previos) {
      if (r.peso_max > (marcaPrevia.get(r.ejercicio_id) ?? 0)) {
        marcaPrevia.set(r.ejercicio_id, r.peso_max);
      }
    }
    const progreso = new Map<string, { nombre: string; base: number; maximo: number }>();
    for (const r of propios) {
      const pesoSesion = totalesSeries(r.series).pesoMax;
      const actual = progreso.get(r.ejercicio_id);
      if (!actual) {
        const previa = marcaPrevia.get(r.ejercicio_id);
        progreso.set(r.ejercicio_id, {
          nombre: r.ejercicio?.nombre ?? "Ejercicio eliminado",
          base: previa ?? pesoSesion,
          maximo: Math.max(previa ?? 0, pesoSesion),
        });
      } else if (pesoSesion > actual.maximo) {
        actual.maximo = pesoSesion;
      }
    }
    const records = [...progreso.values()]
      .filter((p) => p.base > 0 && p.maximo > p.base)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    const membresia = membresiaActual(usuario.membresias);

    return {
      usuarioId: usuario.id,
      nombreCompleto: nombreCompleto(usuario),
      email: usuario.email,
      telefono: usuario.telefono,
      genero:
        usuario.genero === "masculino"
          ? "Hombre"
          : usuario.genero === "femenino"
            ? "Mujer"
            : null,
      edad: edadEn(usuario.fecha_nacimiento, hoy),
      cuentaActiva: usuario.activo,
      fechaRegistro: registro,
      plan: membresia ? etiquetaPlan(membresia.tipo_plan) : null,
      estadoMembresia: textoEstadoMembresia(membresia, hoy),
      membresiaFin: membresia?.fecha_fin ?? null,
      montoMembresia: membresia?.monto_pagado ?? null,
      diasEntrenados: diasConEjercicio.size,
      diasExigiblesCumplidos,
      diasExigiblesTranscurridos,
      diasFallados,
      asistencia,
      clasificacion: clasificar(asistencia),
      rachaCierre: calcularRacha(activados, hoyRacha).currentCount,
      mejorRachaMes: calcularRachaMaximaEnRango(activados, rango.inicio, ultimoDiaEvaluable),
      mejorRachaHistorica: calcularMejorRacha(activados),
      ejercicios: propios.length,
      series,
      repeticiones,
      volumenKg: redondear(volumen),
      pesoMaximoKg: pesoMaximo > 0 ? pesoMaximo : null,
      ejercicioPesoMaximo: pesoMaximo > 0 ? ejercicioPesoMaximo : null,
      ejercicioFrecuente: masFrecuente(conteoEjercicios),
      grupoFrecuente: masFrecuente(conteoGrupos),
      gruposTrabajados: conteoGrupos.size,
      descansoPromedioMin:
        propios.length > 0 ? redondear(descansoTotal / propios.length) : null,
      primerEntreno: propios.length > 0 ? diaBogotaString(propios[0].fecha_completado) : null,
      ultimoEntreno:
        propios.length > 0
          ? diaBogotaString(propios[propios.length - 1].fecha_completado)
          : null,
      recordsSuperados: records.length,
      detalleRecords: records
        .map((p) => `${p.nombre}: ${formatearPeso(p.base)} → ${formatearPeso(p.maximo)} kg`)
        .join("; "),
      asistenciaDias,
    };
  });

  filas.sort(
    (a, b) =>
      b.diasEntrenados - a.diasEntrenados ||
      b.ejercicios - a.ejercicios ||
      a.nombreCompleto.localeCompare(b.nombreCompleto, "es")
  );

  // --- Detalle de ejercicios ----------------------------------------------
  const detalle: FilaDetalleReporte[] = registrosMes
    .filter((r) => usuariosPorId.has(r.user_id))
    .map((r) => {
      const usuario = usuariosPorId.get(r.user_id)!;
      const fecha = diaBogotaString(r.fecha_completado);
      const totales = totalesSeries(r.series);
      const series = [...r.series].sort((a, b) => a.serie_numero - b.serie_numero);
      return {
        fecha,
        hora: horaBogota(r.fecha_completado),
        diaSemana: NOMBRES_DIA_SEMANA[diaSemana(fecha)],
        usuario: nombreCompleto(usuario),
        email: usuario.email,
        ejercicio: r.ejercicio?.nombre ?? "Ejercicio eliminado",
        grupoMuscular: r.ejercicio?.grupo_muscular ?? "",
        series: r.series.length,
        repeticiones: totales.repeticiones,
        pesoMaximoKg: totales.pesoMax,
        volumenKg: redondear(totales.volumen),
        descansoMin: r.tiempo_descanso_minutos,
        detalleSeries: series
          .map((s) => `${formatearPeso(s.peso_kg)} kg × ${s.repeticiones}`)
          .join(" · "),
      };
    });

  // --- Ranking de ejercicios ----------------------------------------------
  const porEjercicio = new Map<
    string,
    FilaRankingEjercicio & { usuariosSet: Set<string> }
  >();
  for (const r of registrosMes) {
    if (!usuariosPorId.has(r.user_id)) continue;
    const totales = totalesSeries(r.series);
    let fila = porEjercicio.get(r.ejercicio_id);
    if (!fila) {
      fila = {
        ejercicio: r.ejercicio?.nombre ?? "Ejercicio eliminado",
        grupoMuscular: r.ejercicio?.grupo_muscular ?? "",
        registros: 0,
        usuarios: 0,
        series: 0,
        repeticiones: 0,
        volumenKg: 0,
        pesoMaximoKg: 0,
        usuariosSet: new Set(),
      };
      porEjercicio.set(r.ejercicio_id, fila);
    }
    fila.registros += 1;
    fila.usuariosSet.add(r.user_id);
    fila.series += r.series.length;
    fila.repeticiones += totales.repeticiones;
    fila.volumenKg += totales.volumen;
    if (totales.pesoMax > fila.pesoMaximoKg) fila.pesoMaximoKg = totales.pesoMax;
  }
  const ranking: FilaRankingEjercicio[] = [...porEjercicio.values()]
    .map(({ usuariosSet, ...fila }) => ({
      ...fila,
      usuarios: usuariosSet.size,
      volumenKg: redondear(fila.volumenKg),
    }))
    .sort(
      (a, b) =>
        b.registros - a.registros ||
        b.usuarios - a.usuarios ||
        a.ejercicio.localeCompare(b.ejercicio, "es")
    );

  // --- Membresías del mes -------------------------------------------------
  const membresias: FilaMembresiaReporte[] = [];
  let ingresosMes = 0;
  let membresiasNuevasMes = 0;
  let membresiasVencenMes = 0;
  for (const usuario of usuarios) {
    for (const m of usuario.membresias) {
      const creadaEnMes = diaBogotaString(m.created_at).startsWith(mes);
      const venceEnMes = m.fecha_fin.startsWith(mes);
      if (!creadaEnMes && !venceEnMes) continue;
      if (creadaEnMes) {
        membresiasNuevasMes += 1;
        ingresosMes += m.monto_pagado ?? 0;
      }
      if (venceEnMes) membresiasVencenMes += 1;
      membresias.push({
        usuario: nombreCompleto(usuario),
        email: usuario.email,
        plan: etiquetaPlan(m.tipo_plan),
        fechaInicio: m.fecha_inicio,
        fechaFin: m.fecha_fin,
        estado: m.estado.charAt(0).toUpperCase() + m.estado.slice(1),
        monto: m.monto_pagado,
        movimiento:
          creadaEnMes && venceEnMes
            ? "Nueva y vence en el mes"
            : creadaEnMes
              ? "Nueva / renovación"
              : "Vence en el mes",
      });
    }
  }
  membresias.sort(
    (a, b) => a.fechaFin.localeCompare(b.fechaFin) || a.usuario.localeCompare(b.usuario, "es")
  );

  // --- Resumen ------------------------------------------------------------
  const activos = filas.filter((f) => f.diasEntrenados > 0);
  const conAsistencia = filas.filter((f) => f.asistencia !== null);
  const rachaTop = filas.reduce<FilaUsuarioReporte | null>(
    (mejor, f) => (f.mejorRachaMes > (mejor?.mejorRachaMes ?? 0) ? f : mejor),
    null
  );

  const usuariosPorDia = new Map<string, Set<string>>();
  for (const r of registrosMes) {
    if (!usuariosPorId.has(r.user_id)) continue;
    const dia = diaBogotaString(r.fecha_completado);
    const set = usuariosPorDia.get(dia);
    if (set) set.add(r.user_id);
    else usuariosPorDia.set(dia, new Set([r.user_id]));
  }
  const conteoDiaSemana = new Map<string, number>();
  let diaMasConcurrido: string | null = null;
  let usuariosDiaMasConcurrido = 0;
  for (const [dia, set] of [...usuariosPorDia.entries()].sort()) {
    incrementar(conteoDiaSemana, NOMBRES_DIA_SEMANA[diaSemana(dia)], set.size);
    if (set.size > usuariosDiaMasConcurrido) {
      usuariosDiaMasConcurrido = set.size;
      diaMasConcurrido = dia;
    }
  }

  const clasificacion: Record<ClasificacionActividad, number> = {
    "Muy activo": 0,
    Activo: 0,
    Irregular: 0,
    Inactivo: 0,
    "Sin datos": 0,
  };
  for (const f of filas) clasificacion[f.clasificacion] += 1;

  const conteoMembresia = (estado: string) =>
    filas.filter((f) => f.estadoMembresia === estado).length;

  const resumen: ResumenReporte = {
    usuariosIncluidos: filas.length,
    usuariosConActividad: activos.length,
    usuariosSinActividad: filas.length - activos.length,
    ejercicios: detalle.length,
    series: filas.reduce((t, f) => t + f.series, 0),
    repeticiones: filas.reduce((t, f) => t + f.repeticiones, 0),
    volumenKg: redondear(filas.reduce((t, f) => t + f.volumenKg, 0)),
    promedioDiasPorUsuarioActivo:
      activos.length > 0
        ? redondear(activos.reduce((t, f) => t + f.diasEntrenados, 0) / activos.length)
        : 0,
    asistenciaPromedio:
      conAsistencia.length > 0
        ? conAsistencia.reduce((t, f) => t + (f.asistencia ?? 0), 0) / conAsistencia.length
        : null,
    usuariosConRachaAlCierre: filas.filter((f) => f.rachaCierre > 0).length,
    rachaMasAlta: rachaTop?.mejorRachaMes ?? 0,
    usuarioRachaMasAlta: rachaTop?.nombreCompleto ?? null,
    diaSemanaMasActivo: masFrecuente(conteoDiaSemana),
    diaMasConcurrido,
    usuariosDiaMasConcurrido,
    clasificacion,
    membresiasActivas: conteoMembresia("Activa"),
    membresiasPorVencer: conteoMembresia("Por vencer"),
    membresiasVencidas: conteoMembresia("Vencida"),
    usuariosSinMembresia: conteoMembresia("Sin membresía"),
    membresiasNuevasMes,
    membresiasVencenMes,
    ingresosMes,
    topUsuarios: activos.slice(0, 10).map((f) => ({
      usuarioId: f.usuarioId,
      nombre: f.nombreCompleto,
      dias: f.diasEntrenados,
      asistencia: f.asistencia,
    })),
    topEjercicios: ranking.slice(0, 10).map((r) => ({
      ejercicio: r.ejercicio,
      registros: r.registros,
    })),
  };

  return {
    mes,
    nombreMes: nombreDeMes(mes),
    inicio: rango.inicio,
    fin: rango.fin,
    enCurso,
    dias: rango.dias,
    resumen,
    usuarios: filas,
    detalle,
    ranking,
    membresias,
  };
}
