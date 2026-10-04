// Vista del reporte mensual para la pantalla interactiva. PURO: recibe el
// ReporteMensual completo y devuelve una versión liviana para el cliente
// (sin el detalle completo, que puede pesar varios MB) más agregados que
// las gráficas necesitan. El detalle completo sigue en el Excel.

import type { FilaDetalleReporte, ReporteMensual } from "./mensual";

export interface PuntoDiaReporte {
  fecha: string;
  /** Usuarios distintos que entrenaron ese día. */
  usuarios: number;
  /** Ejercicios registrados ese día. */
  registros: number;
  domingo: boolean;
  futuro: boolean;
}

export interface AnalisisReporte {
  porDia: PuntoDiaReporte[];
  /** Lunes → domingo: días-usuario entrenados y ejercicios registrados. */
  porDiaSemana: { dia: string; asistencias: number; registros: number }[];
  porHora: { hora: number; registros: number }[];
  porGrupo: { grupo: string; registros: number; volumenKg: number }[];
}

export type VistaReporte = Omit<ReporteMensual, "detalle"> & {
  analisis: AnalisisReporte;
  /** Últimos registros del mes (más recientes primero). */
  detalleReciente: FilaDetalleReporte[];
  totalDetalle: number;
};

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** 0 = lunes … 6 = domingo. */
function indiceLunes(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

export function construirVistaReporte(
  reporte: ReporteMensual,
  hoy: string,
  opciones: { limiteDetalle?: number } = {}
): VistaReporte {
  const limite = opciones.limiteDetalle ?? 100;
  const { detalle, ...resto } = reporte;

  const usuariosPorDia = reporte.dias.map(() => 0);
  for (const u of reporte.usuarios) {
    u.asistenciaDias.forEach((estado, i) => {
      if (estado === "entreno" || estado === "domingo_entreno") usuariosPorDia[i] += 1;
    });
  }

  const registrosPorDia = new Map<string, number>();
  const porHora = new Array<number>(24).fill(0);
  const porGrupo = new Map<string, { registros: number; volumenKg: number }>();
  for (const r of detalle) {
    registrosPorDia.set(r.fecha, (registrosPorDia.get(r.fecha) ?? 0) + 1);
    const hora = Number(r.hora.slice(0, 2));
    if (hora >= 0 && hora < 24) porHora[hora] += 1;
    const grupo = r.grupoMuscular.trim() || "Sin grupo";
    const acumulado = porGrupo.get(grupo) ?? { registros: 0, volumenKg: 0 };
    acumulado.registros += 1;
    acumulado.volumenKg += r.volumenKg;
    porGrupo.set(grupo, acumulado);
  }

  const porDia: PuntoDiaReporte[] = reporte.dias.map((fecha, i) => ({
    fecha,
    usuarios: usuariosPorDia[i],
    registros: registrosPorDia.get(fecha) ?? 0,
    domingo: indiceLunes(fecha) === 6,
    futuro: fecha > hoy,
  }));

  const porDiaSemana = DIAS_SEMANA.map((dia) => ({ dia, asistencias: 0, registros: 0 }));
  for (const p of porDia) {
    const fila = porDiaSemana[indiceLunes(p.fecha)];
    fila.asistencias += p.usuarios;
    fila.registros += p.registros;
  }

  return {
    ...resto,
    analisis: {
      porDia,
      porDiaSemana,
      porHora: porHora.map((registros, hora) => ({ hora, registros })),
      porGrupo: [...porGrupo.entries()]
        .map(([grupo, v]) => ({ grupo, registros: v.registros, volumenKg: Math.round(v.volumenKg) }))
        .sort((a, b) => b.registros - a.registros || a.grupo.localeCompare(b.grupo, "es")),
    },
    detalleReciente: [...detalle]
      .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
      .slice(0, limite),
    totalDetalle: detalle.length,
  };
}
