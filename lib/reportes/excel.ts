// Armado (server-only) del archivo .xlsx del reporte mensual con exceljs.
// Recibe el ReporteMensual ya calculado (lib/reportes/mensual.ts) y solo
// se ocupa de la presentación: hojas, estilos, formatos y colores.

import "server-only";

import ExcelJS from "exceljs";
import type { Cell, CellValue, Worksheet } from "exceljs";

import { FECHA_INICIO_RACHA } from "@/lib/racha/reglas";
import { NOMBRES_DIA_SEMANA } from "@/lib/reportes/mensual";
import type {
  ClasificacionActividad,
  EstadoDiaAsistencia,
  FilaDetalleReporte,
  FilaMembresiaReporte,
  FilaRankingEjercicio,
  FilaUsuarioReporte,
  ReporteMensual,
} from "@/lib/reportes/mensual";

// --- Estilos -----------------------------------------------------------------

const COLOR_MARCA = "FFF9C633";
const COLOR_TEXTO_OSCURO = "FF0A0A0A";
const COLOR_ZEBRA = "FFF7F7F7";
const COLOR_BORDE = "FFD9D9D9";

const FORMATO_ENTERO = "#,##0";
const FORMATO_DECIMAL = "#,##0.0";
const FORMATO_PORCENTAJE = "0%";
const FORMATO_DINERO = '"$"#,##0';
const FORMATO_FECHA = "dd/mm/yyyy";

function relleno(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

const BORDE_FINO: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLOR_BORDE } },
  bottom: { style: "thin", color: { argb: COLOR_BORDE } },
  left: { style: "thin", color: { argb: COLOR_BORDE } },
  right: { style: "thin", color: { argb: COLOR_BORDE } },
};

function estiloEncabezado(celda: Cell) {
  celda.font = { bold: true, color: { argb: COLOR_TEXTO_OSCURO } };
  celda.fill = relleno(COLOR_MARCA);
  celda.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  celda.border = BORDE_FINO;
}

const COLOR_CLASIFICACION: Record<ClasificacionActividad, { fondo: string; texto: string }> = {
  "Muy activo": { fondo: "FFC6EFCE", texto: "FF006100" },
  Activo: { fondo: "FFE2F0D9", texto: "FF375623" },
  Irregular: { fondo: "FFFFEB9C", texto: "FF9C5700" },
  Inactivo: { fondo: "FFFFC7CE", texto: "FF9C0006" },
  "Sin datos": { fondo: "FFEDEDED", texto: "FF595959" },
};

const ESTILO_ASISTENCIA: Record<
  EstadoDiaAsistencia,
  { valor: string; fondo?: string; texto: string }
> = {
  entreno: { valor: "✓", fondo: "FFC6EFCE", texto: "FF006100" },
  domingo_entreno: { valor: "✓", fondo: "FFE2F0D9", texto: "FF375623" },
  fallo: { valor: "✗", fondo: "FFFFC7CE", texto: "FF9C0006" },
  descanso: { valor: "D", fondo: "FFEDEDED", texto: "FF808080" },
  pendiente: { valor: "", texto: "FF808080" },
  fuera: { valor: "–", texto: "FFBFBFBF" },
};

// --- Utilidades ----------------------------------------------------------------

/** "YYYY-MM-DD" → Date UTC (exceljs la escribe como fecha de Excel). */
function fechaExcel(fecha: string | null): Date | null {
  if (!fecha) return null;
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatearFechaLarga(fecha: string | null): string {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

interface Columna<T> {
  titulo: string;
  ancho: number;
  valor: (fila: T) => CellValue;
  formato?: string;
  centrar?: boolean;
  estilo?: (celda: Cell, fila: T) => void;
}

/**
 * Escribe una tabla con encabezado de marca, filas cebra, filtros y
 * encabezado (y opcionalmente primeras columnas) fijos.
 */
function escribirTabla<T>(
  hoja: Worksheet,
  columnas: Columna<T>[],
  filas: T[],
  opciones: { columnasFijas?: number; vacio?: string } = {}
) {
  columnas.forEach((columna, i) => {
    hoja.getColumn(i + 1).width = columna.ancho;
  });

  const encabezado = hoja.getRow(1);
  encabezado.height = 32;
  columnas.forEach((columna, i) => {
    const celda = encabezado.getCell(i + 1);
    celda.value = columna.titulo;
    estiloEncabezado(celda);
  });

  if (filas.length === 0) {
    const celda = hoja.getCell(2, 1);
    celda.value = opciones.vacio ?? "Sin registros en este mes.";
    celda.font = { italic: true, color: { argb: "FF808080" } };
    hoja.mergeCells(2, 1, 2, columnas.length);
  }

  filas.forEach((fila, indice) => {
    const row = hoja.getRow(indice + 2);
    columnas.forEach((columna, i) => {
      const celda = row.getCell(i + 1);
      celda.value = columna.valor(fila);
      if (columna.formato) celda.numFmt = columna.formato;
      celda.alignment = {
        vertical: "middle",
        horizontal: columna.centrar ? "center" : undefined,
      };
      celda.border = BORDE_FINO;
      if (indice % 2 === 1) celda.fill = relleno(COLOR_ZEBRA);
      columna.estilo?.(celda, fila);
    });
  });

  hoja.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columnas.length },
  };
  hoja.views = [
    { state: "frozen", ySplit: 1, xSplit: opciones.columnasFijas ?? 0 },
  ];
}

// --- Hojas -----------------------------------------------------------------------

function hojaResumen(libro: ExcelJS.Workbook, reporte: ReporteMensual, generado: string) {
  const hoja = libro.addWorksheet("Resumen", {
    properties: { tabColor: { argb: COLOR_MARCA } },
  });
  hoja.getColumn(1).width = 46;
  hoja.getColumn(2).width = 24;
  hoja.getColumn(3).width = 18;
  hoja.getColumn(4).width = 18;

  const { resumen } = reporte;
  let fila = 1;

  const titulo = hoja.getCell(fila, 1);
  titulo.value = "Reporte mensual de usuarios · FitBoch";
  titulo.font = { bold: true, size: 16 };
  hoja.mergeCells(fila, 1, fila, 4);
  fila++;

  const subtitulo = hoja.getCell(fila, 1);
  subtitulo.value = reporte.enCurso
    ? `${reporte.nombreMes} (mes en curso: datos hasta hoy)`
    : reporte.nombreMes;
  subtitulo.font = { bold: true, size: 13, color: { argb: "FF9C7A00" } };
  hoja.mergeCells(fila, 1, fila, 4);
  fila++;

  const meta = hoja.getCell(fila, 1);
  meta.value = `Periodo: ${formatearFechaLarga(reporte.inicio)} al ${formatearFechaLarga(reporte.fin)} · Generado: ${generado} (hora Colombia)`;
  meta.font = { color: { argb: "FF808080" } };
  hoja.mergeCells(fila, 1, fila, 4);
  fila += 2;

  const seccion = (texto: string) => {
    const celda = hoja.getCell(fila, 1);
    celda.value = texto;
    celda.font = { bold: true, size: 12 };
    celda.border = { bottom: { style: "medium", color: { argb: COLOR_MARCA } } };
    hoja.getCell(fila, 2).border = {
      bottom: { style: "medium", color: { argb: COLOR_MARCA } },
    };
    fila++;
  };

  const dato = (etiqueta: string, valor: CellValue, formato?: string) => {
    hoja.getCell(fila, 1).value = etiqueta;
    const celda = hoja.getCell(fila, 2);
    celda.value = valor;
    celda.font = { bold: true };
    celda.alignment = { horizontal: "right" };
    if (formato) celda.numFmt = formato;
    fila++;
  };

  seccion("Actividad");
  dato("Usuarios incluidos", resumen.usuariosIncluidos, FORMATO_ENTERO);
  dato("Usuarios que entrenaron al menos un día", resumen.usuariosConActividad, FORMATO_ENTERO);
  dato("Usuarios sin actividad", resumen.usuariosSinActividad, FORMATO_ENTERO);
  dato("Ejercicios registrados", resumen.ejercicios, FORMATO_ENTERO);
  dato("Series registradas", resumen.series, FORMATO_ENTERO);
  dato("Repeticiones totales", resumen.repeticiones, FORMATO_ENTERO);
  dato("Volumen total levantado (kg)", resumen.volumenKg, FORMATO_DECIMAL);
  dato(
    "Promedio de días entrenados (usuarios activos)",
    resumen.promedioDiasPorUsuarioActivo,
    FORMATO_DECIMAL
  );
  dato("Asistencia promedio (L-V)", resumen.asistenciaPromedio ?? "—", FORMATO_PORCENTAJE);
  dato("Día de la semana con más asistencia", resumen.diaSemanaMasActivo ?? "—");
  dato(
    "Día con más usuarios entrenando",
    resumen.diaMasConcurrido
      ? `${formatearFechaLarga(resumen.diaMasConcurrido)} (${resumen.usuariosDiaMasConcurrido} usuarios)`
      : "—"
  );
  fila++;

  seccion("Racha");
  dato(
    reporte.enCurso ? "Usuarios con racha activa hoy" : "Usuarios con racha activa al cierre",
    resumen.usuariosConRachaAlCierre,
    FORMATO_ENTERO
  );
  dato("Racha más alta del mes (días)", resumen.rachaMasAlta, FORMATO_ENTERO);
  dato("Usuario con la racha más alta", resumen.usuarioRachaMasAlta ?? "—");
  fila++;

  seccion("Clasificación de actividad");
  const definiciones: Record<ClasificacionActividad, string> = {
    "Muy activo": "Muy activo (asistencia ≥ 80%)",
    Activo: "Activo (50% – 79%)",
    Irregular: "Irregular (1% – 49%)",
    Inactivo: "Inactivo (no entrenó ningún día L-V)",
    "Sin datos": "Sin datos (sin días evaluables en el mes)",
  };
  (Object.keys(definiciones) as ClasificacionActividad[]).forEach((clave) => {
    dato(definiciones[clave], resumen.clasificacion[clave], FORMATO_ENTERO);
    const celda = hoja.getCell(fila - 1, 1);
    celda.fill = relleno(COLOR_CLASIFICACION[clave].fondo);
    celda.font = { color: { argb: COLOR_CLASIFICACION[clave].texto } };
  });
  fila++;

  seccion("Membresías (estado a la fecha de generación)");
  dato("Activas", resumen.membresiasActivas, FORMATO_ENTERO);
  dato("Por vencer (7 días o menos)", resumen.membresiasPorVencer, FORMATO_ENTERO);
  dato("Vencidas", resumen.membresiasVencidas, FORMATO_ENTERO);
  dato("Usuarios sin membresía", resumen.usuariosSinMembresia, FORMATO_ENTERO);
  dato("Membresías nuevas o renovadas en el mes", resumen.membresiasNuevasMes, FORMATO_ENTERO);
  dato("Membresías que vencen en el mes", resumen.membresiasVencenMes, FORMATO_ENTERO);
  dato("Ingresos registrados en el mes", resumen.ingresosMes, FORMATO_DINERO);
  fila++;

  const tablaMini = (
    tituloTabla: string,
    columnas: string[],
    filas: CellValue[][],
    formatos: (string | undefined)[]
  ) => {
    seccion(tituloTabla);
    columnas.forEach((texto, i) => {
      const celda = hoja.getCell(fila, i + 1);
      celda.value = texto;
      estiloEncabezado(celda);
    });
    fila++;
    if (filas.length === 0) {
      hoja.getCell(fila, 1).value = "Sin actividad en este mes.";
      hoja.getCell(fila, 1).font = { italic: true, color: { argb: "FF808080" } };
      fila++;
    }
    filas.forEach((valores) => {
      valores.forEach((valor, i) => {
        const celda = hoja.getCell(fila, i + 1);
        celda.value = valor;
        celda.border = BORDE_FINO;
        if (formatos[i]) celda.numFmt = formatos[i]!;
      });
      fila++;
    });
    fila++;
  };

  tablaMini(
    "Top 10 usuarios por días entrenados",
    ["Usuario", "Días entrenados", "Asistencia"],
    resumen.topUsuarios.map((u) => [u.nombre, u.dias, u.asistencia ?? "—"]),
    [undefined, FORMATO_ENTERO, FORMATO_PORCENTAJE]
  );

  tablaMini(
    "Top 10 ejercicios más registrados",
    ["Ejercicio", "Veces registrado"],
    resumen.topEjercicios.map((e) => [e.ejercicio, e.registros]),
    [undefined, FORMATO_ENTERO]
  );

  seccion("Notas");
  const notas = [
    "Días exigibles: lunes a viernes. Sábado y domingo son descanso y no cuentan como fallo.",
    "Asistencia = días L-V entrenados ÷ días L-V transcurridos desde el registro del usuario.",
    `La racha solo cuenta ejercicios desde el ${formatearFechaLarga(FECHA_INICIO_RACHA)} (mismas reglas que la app: 2 fallos tolerados, el tercero seguido la reinicia).`,
    "Récords superados: ejercicios en los que el peso máximo del mes superó la marca anterior del usuario.",
    "Fechas y horas en zona horaria de Colombia (America/Bogota).",
  ];
  for (const nota of notas) {
    const celda = hoja.getCell(fila, 1);
    celda.value = `• ${nota}`;
    celda.alignment = { wrapText: true, vertical: "top" };
    celda.font = { color: { argb: "FF595959" } };
    hoja.mergeCells(fila, 1, fila, 4);
    hoja.getRow(fila).height = 30;
    fila++;
  }
}

function hojaUsuarios(libro: ExcelJS.Workbook, reporte: ReporteMensual) {
  const hoja = libro.addWorksheet("Usuarios");
  const columnas: Columna<FilaUsuarioReporte>[] = [
    { titulo: "Usuario", ancho: 26, valor: (f) => f.nombreCompleto },
    { titulo: "Email", ancho: 30, valor: (f) => f.email },
    { titulo: "Teléfono", ancho: 16, valor: (f) => f.telefono ?? "" },
    { titulo: "Género", ancho: 10, valor: (f) => f.genero ?? "", centrar: true },
    { titulo: "Edad", ancho: 8, valor: (f) => f.edad, formato: FORMATO_ENTERO, centrar: true },
    {
      titulo: "Cuenta",
      ancho: 13,
      valor: (f) => (f.cuentaActiva ? "Activa" : "Desactivada"),
      centrar: true,
    },
    { titulo: "Registro", ancho: 12, valor: (f) => fechaExcel(f.fechaRegistro), formato: FORMATO_FECHA },
    { titulo: "Plan", ancho: 12, valor: (f) => f.plan ?? "", centrar: true },
    { titulo: "Estado membresía", ancho: 16, valor: (f) => f.estadoMembresia, centrar: true },
    { titulo: "Vence", ancho: 12, valor: (f) => fechaExcel(f.membresiaFin), formato: FORMATO_FECHA },
    { titulo: "Monto membresía", ancho: 15, valor: (f) => f.montoMembresia, formato: FORMATO_DINERO },
    { titulo: "Días entrenados", ancho: 11, valor: (f) => f.diasEntrenados, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Días L-V cumplidos", ancho: 11, valor: (f) => f.diasExigiblesCumplidos, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Días L-V evaluados", ancho: 11, valor: (f) => f.diasExigiblesTranscurridos, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Días fallados", ancho: 10, valor: (f) => f.diasFallados, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Asistencia", ancho: 11, valor: (f) => f.asistencia, formato: FORMATO_PORCENTAJE, centrar: true },
    {
      titulo: "Clasificación",
      ancho: 13,
      valor: (f) => f.clasificacion,
      centrar: true,
      estilo: (celda, f) => {
        celda.fill = relleno(COLOR_CLASIFICACION[f.clasificacion].fondo);
        celda.font = { bold: true, color: { argb: COLOR_CLASIFICACION[f.clasificacion].texto } };
      },
    },
    {
      titulo: reporte.enCurso ? "Racha actual" : "Racha al cierre",
      ancho: 10,
      valor: (f) => f.rachaCierre,
      formato: FORMATO_ENTERO,
      centrar: true,
    },
    { titulo: "Mejor racha del mes", ancho: 11, valor: (f) => f.mejorRachaMes, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Mejor racha histórica", ancho: 11, valor: (f) => f.mejorRachaHistorica, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Ejercicios", ancho: 11, valor: (f) => f.ejercicios, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Series", ancho: 9, valor: (f) => f.series, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Repeticiones", ancho: 12, valor: (f) => f.repeticiones, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Volumen (kg)", ancho: 13, valor: (f) => f.volumenKg, formato: FORMATO_DECIMAL },
    { titulo: "Peso máx. (kg)", ancho: 11, valor: (f) => f.pesoMaximoKg, formato: FORMATO_DECIMAL },
    { titulo: "Ejercicio del peso máx.", ancho: 24, valor: (f) => f.ejercicioPesoMaximo ?? "" },
    { titulo: "Ejercicio más frecuente", ancho: 24, valor: (f) => f.ejercicioFrecuente ?? "" },
    {
      titulo: "Grupo más trabajado",
      ancho: 16,
      valor: (f) =>
        f.grupoFrecuente ? f.grupoFrecuente.charAt(0).toUpperCase() + f.grupoFrecuente.slice(1) : "",
    },
    { titulo: "Grupos trabajados", ancho: 10, valor: (f) => f.gruposTrabajados, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Descanso prom. (min)", ancho: 11, valor: (f) => f.descansoPromedioMin, formato: FORMATO_DECIMAL, centrar: true },
    { titulo: "Primer entreno", ancho: 12, valor: (f) => fechaExcel(f.primerEntreno), formato: FORMATO_FECHA },
    { titulo: "Último entreno", ancho: 12, valor: (f) => fechaExcel(f.ultimoEntreno), formato: FORMATO_FECHA },
    { titulo: "Récords superados", ancho: 10, valor: (f) => f.recordsSuperados, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Detalle de récords", ancho: 50, valor: (f) => f.detalleRecords },
  ];
  escribirTabla(hoja, columnas, reporte.usuarios, {
    columnasFijas: 1,
    vacio: "No hay usuarios para este reporte.",
  });
}

function hojaAsistencia(libro: ExcelJS.Workbook, reporte: ReporteMensual) {
  const hoja = libro.addWorksheet("Asistencia");
  const totalDias = reporte.dias.length;
  const colTotales = totalDias + 2;

  hoja.getColumn(1).width = 26;
  for (let i = 0; i < totalDias; i++) hoja.getColumn(i + 2).width = 4.2;
  hoja.getColumn(colTotales).width = 11;
  hoja.getColumn(colTotales + 1).width = 9;
  hoja.getColumn(colTotales + 2).width = 11;

  // Dos filas de encabezado: número de día y día de la semana.
  const filaDia = hoja.getRow(1);
  const filaSemana = hoja.getRow(2);
  filaDia.getCell(1).value = "Usuario";
  filaSemana.getCell(1).value = "";
  reporte.dias.forEach((dia, i) => {
    filaDia.getCell(i + 2).value = Number(dia.slice(8));
    const nombre = NOMBRES_DIA_SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()];
    filaSemana.getCell(i + 2).value = nombre === "Miércoles" ? "X" : nombre.charAt(0);
  });
  filaDia.getCell(colTotales).value = "Días L-V cumplidos";
  filaDia.getCell(colTotales + 1).value = "Fallos";
  filaDia.getCell(colTotales + 2).value = "Asistencia";
  for (let c = 1; c <= colTotales + 2; c++) {
    estiloEncabezado(filaDia.getCell(c));
    estiloEncabezado(filaSemana.getCell(c));
  }
  hoja.mergeCells(1, 1, 2, 1);
  hoja.mergeCells(1, colTotales, 2, colTotales);
  hoja.mergeCells(1, colTotales + 1, 2, colTotales + 1);
  hoja.mergeCells(1, colTotales + 2, 2, colTotales + 2);
  filaDia.height = 30;

  reporte.usuarios.forEach((usuario, indice) => {
    const row = hoja.getRow(indice + 3);
    row.getCell(1).value = usuario.nombreCompleto;
    row.getCell(1).border = BORDE_FINO;
    usuario.asistenciaDias.forEach((estado, i) => {
      const estilo = ESTILO_ASISTENCIA[estado];
      const celda = row.getCell(i + 2);
      celda.value = estilo.valor;
      celda.alignment = { horizontal: "center", vertical: "middle" };
      celda.font = { bold: estado === "entreno", color: { argb: estilo.texto } };
      celda.border = BORDE_FINO;
      if (estilo.fondo) celda.fill = relleno(estilo.fondo);
    });
    const cumplidos = row.getCell(colTotales);
    cumplidos.value = usuario.diasExigiblesCumplidos;
    const fallos = row.getCell(colTotales + 1);
    fallos.value = usuario.diasFallados;
    const asistencia = row.getCell(colTotales + 2);
    asistencia.value = usuario.asistencia;
    asistencia.numFmt = FORMATO_PORCENTAJE;
    for (const celda of [cumplidos, fallos, asistencia]) {
      celda.alignment = { horizontal: "center" };
      celda.border = BORDE_FINO;
      celda.font = { bold: true };
    }
  });

  hoja.views = [{ state: "frozen", xSplit: 1, ySplit: 2 }];

  // Leyenda debajo de la tabla.
  let fila = reporte.usuarios.length + 5;
  hoja.getCell(fila, 1).value = "Leyenda";
  hoja.getCell(fila, 1).font = { bold: true };
  fila++;
  const leyenda: [EstadoDiaAsistencia, string][] = [
    ["entreno", "Entrenó (lunes a viernes)"],
    ["domingo_entreno", "Entrenó en fin de semana (no exigible)"],
    ["fallo", "No entrenó un día exigible"],
    ["descanso", "Fin de semana (descanso)"],
    ["fuera", "Antes de que el usuario se registrara"],
  ];
  for (const [estado, texto] of leyenda) {
    const estilo = ESTILO_ASISTENCIA[estado];
    const muestra = hoja.getCell(fila, 2);
    muestra.value = estilo.valor;
    muestra.alignment = { horizontal: "center" };
    muestra.font = { color: { argb: estilo.texto }, bold: true };
    muestra.border = BORDE_FINO;
    if (estilo.fondo) muestra.fill = relleno(estilo.fondo);
    hoja.getCell(fila, 3).value = texto;
    fila++;
  }
}

function hojaDetalle(libro: ExcelJS.Workbook, reporte: ReporteMensual) {
  const hoja = libro.addWorksheet("Ejercicios registrados");
  const columnas: Columna<FilaDetalleReporte>[] = [
    { titulo: "Fecha", ancho: 12, valor: (f) => fechaExcel(f.fecha), formato: FORMATO_FECHA },
    { titulo: "Hora", ancho: 8, valor: (f) => f.hora, centrar: true },
    { titulo: "Día", ancho: 11, valor: (f) => f.diaSemana },
    { titulo: "Usuario", ancho: 26, valor: (f) => f.usuario },
    { titulo: "Email", ancho: 30, valor: (f) => f.email },
    { titulo: "Ejercicio", ancho: 28, valor: (f) => f.ejercicio },
    { titulo: "Grupo muscular", ancho: 15, valor: (f) => f.grupoMuscular },
    { titulo: "Series", ancho: 8, valor: (f) => f.series, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Repeticiones", ancho: 12, valor: (f) => f.repeticiones, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Peso máx. (kg)", ancho: 11, valor: (f) => f.pesoMaximoKg, formato: FORMATO_DECIMAL },
    { titulo: "Volumen (kg)", ancho: 12, valor: (f) => f.volumenKg, formato: FORMATO_DECIMAL },
    { titulo: "Descanso (min)", ancho: 10, valor: (f) => f.descansoMin, formato: FORMATO_DECIMAL, centrar: true },
    { titulo: "Series (peso × reps)", ancho: 46, valor: (f) => f.detalleSeries },
  ];
  escribirTabla(hoja, columnas, reporte.detalle);
}

function hojaRanking(libro: ExcelJS.Workbook, reporte: ReporteMensual) {
  const hoja = libro.addWorksheet("Ranking de ejercicios");
  const columnas: Columna<FilaRankingEjercicio & { posicion: number }>[] = [
    { titulo: "#", ancho: 5, valor: (f) => f.posicion, centrar: true },
    { titulo: "Ejercicio", ancho: 30, valor: (f) => f.ejercicio },
    { titulo: "Grupo muscular", ancho: 15, valor: (f) => f.grupoMuscular },
    { titulo: "Veces registrado", ancho: 12, valor: (f) => f.registros, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Usuarios distintos", ancho: 12, valor: (f) => f.usuarios, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Series", ancho: 9, valor: (f) => f.series, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Repeticiones", ancho: 12, valor: (f) => f.repeticiones, formato: FORMATO_ENTERO, centrar: true },
    { titulo: "Volumen (kg)", ancho: 13, valor: (f) => f.volumenKg, formato: FORMATO_DECIMAL },
    { titulo: "Peso máx. (kg)", ancho: 11, valor: (f) => f.pesoMaximoKg, formato: FORMATO_DECIMAL },
  ];
  escribirTabla(
    hoja,
    columnas,
    reporte.ranking.map((fila, i) => ({ ...fila, posicion: i + 1 }))
  );
}

function hojaMembresias(libro: ExcelJS.Workbook, reporte: ReporteMensual) {
  const hoja = libro.addWorksheet("Membresías del mes");
  const columnas: Columna<FilaMembresiaReporte>[] = [
    { titulo: "Usuario", ancho: 26, valor: (f) => f.usuario },
    { titulo: "Email", ancho: 30, valor: (f) => f.email },
    { titulo: "Plan", ancho: 12, valor: (f) => f.plan, centrar: true },
    { titulo: "Inicio", ancho: 12, valor: (f) => fechaExcel(f.fechaInicio), formato: FORMATO_FECHA },
    { titulo: "Fin", ancho: 12, valor: (f) => fechaExcel(f.fechaFin), formato: FORMATO_FECHA },
    { titulo: "Estado", ancho: 12, valor: (f) => f.estado, centrar: true },
    { titulo: "Monto", ancho: 14, valor: (f) => f.monto, formato: FORMATO_DINERO },
    { titulo: "Movimiento", ancho: 24, valor: (f) => f.movimiento },
  ];
  escribirTabla(hoja, columnas, reporte.membresias, {
    vacio: "No hubo membresías nuevas ni vencimientos en este mes.",
  });

  if (reporte.membresias.length > 0) {
    const fila = reporte.membresias.length + 3;
    const etiqueta = hoja.getCell(fila, 6);
    etiqueta.value = "Ingresos del mes";
    etiqueta.font = { bold: true };
    const total = hoja.getCell(fila, 7);
    total.value = reporte.resumen.ingresosMes;
    total.numFmt = FORMATO_DINERO;
    total.font = { bold: true };
    total.fill = relleno(COLOR_MARCA);
  }
}

/**
 * Genera el libro .xlsx completo del reporte y lo devuelve como buffer.
 */
export async function generarExcelReporteMensual(reporte: ReporteMensual): Promise<ArrayBuffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "FitBoch";
  libro.created = new Date();
  libro.title = `Reporte mensual ${reporte.nombreMes}`;

  const generado = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  hojaResumen(libro, reporte, generado);
  hojaUsuarios(libro, reporte);
  hojaAsistencia(libro, reporte);
  hojaDetalle(libro, reporte);
  hojaRanking(libro, reporte);
  hojaMembresias(libro, reporte);

  return libro.xlsx.writeBuffer();
}
