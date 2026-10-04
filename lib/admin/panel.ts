// Datos del dashboard admin ("centro de control de hoy"). PURO: recibe
// usuarios + días de entreno ya leídos y `hoy` Bogotá; ver server.ts para
// la lectura y panel.test.ts para los casos.

import { esDiaExigible } from "../racha/reglas";
import { stringAFecha } from "../racha/bogota";
import {
  estadoUsuario,
  etiquetaPlan,
  sumarDiasFecha,
  textoVencimiento,
  type EstadoUsuarioClave,
} from "../membresias/estado";
import { agruparPorUsuario, diaBogota, horaMinutoBogota, metricasUsuario } from "./actividad";
import type { MetricasUsuario } from "./actividad";
import { nombreCompleto, type DiaEntreno, type UsuarioAdmin } from "./tipos";

export const DIAS_ASISTENCIA_PANEL = 90;
export const DIAS_SIN_ENTRENAR_ALERTA = 7;
export const DIAS_VENCIDAS_RECIENTES = 30;
const LIMITE_LISTA_ATENCION = 50;

export interface KpisPanel {
  /** Cuentas de usuario activas (no desactivadas). */
  usuariosActivos: number;
  /** Usuarios activos con membresía vigente (activa + por vencer). */
  miembrosVigentes: number;
  entrenaronHoy: number;
  /** Promedio de usuarios por día exigible en los 7 días previos a hoy. */
  promedioDiario7: number | null;
  /** Mismo promedio para los 7 días anteriores (para el delta). */
  promedioDiario7Anterior: number | null;
  /** Usuarios por día de los últimos 14 días (incluye hoy). */
  sparkline: number[];
  porVencer: number;
  vencidas: number;
  vencidasRecientes: number;
  sinMembresia: number;
  desactivados: number;
}

export interface PuntoAsistencia {
  fecha: string;
  usuarios: number;
  domingo: boolean;
}

export interface FilaAtencion {
  usuarioId: string;
  nombre: string;
  telefono: string | null;
  detalle: string;
  extra: string | null;
}

export interface FilaActividadHoy {
  usuarioId: string;
  nombre: string;
  ejercicios: number;
  hora: string;
  racha: number;
}

export interface FilaRacha {
  usuarioId: string;
  nombre: string;
  racha: number;
  hoyActivado: boolean;
  enRiesgo: boolean;
}

export interface FilaCumple {
  usuarioId: string;
  nombre: string;
  fecha: string;
  diasRestantes: number;
  cumple: number;
}

export interface FilaRegistroReciente {
  usuarioId: string;
  nombre: string;
  email: string;
  /** Día Bogotá de creación de la cuenta. */
  fecha: string;
  perfilCompleto: boolean;
}

export interface DatosPanel {
  hoy: string;
  esDomingo: boolean;
  kpis: KpisPanel;
  asistenciaDiaria: PuntoAsistencia[];
  distribucion: Record<EstadoUsuarioClave, number>;
  atencion: {
    porVencer: FilaAtencion[];
    vencidasRecientes: FilaAtencion[];
    rachaEnRiesgo: FilaAtencion[];
    inactivos: FilaAtencion[];
  };
  actividadHoy: FilaActividadHoy[];
  horasPico: { hora: number; llegadas: number }[];
  topRachas: FilaRacha[];
  cumpleanos: FilaCumple[];
  ultimosRegistros: FilaRegistroReciente[];
}

export interface EntradaPanel {
  hoy: string;
  usuarios: readonly UsuarioAdmin[];
  dias: readonly DiaEntreno[];
}

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((t, v) => t + v, 0) / valores.length) * 10) / 10;
}

/** Próximos cumpleaños (incluye hoy), ordenados por cercanía. */
export function proximosCumpleanos(
  usuarios: readonly UsuarioAdmin[],
  hoy: string,
  limite = 5
): FilaCumple[] {
  const [hY, hM, hD] = hoy.split("-").map(Number);
  const hoyUtc = Date.UTC(hY, hM - 1, hD);
  return usuarios
    .filter((u) => u.activo && u.fecha_nacimiento)
    .map((u) => {
      const [nY, nM, nD] = u.fecha_nacimiento!.split("-").map(Number);
      const anio = nM < hM || (nM === hM && nD < hD) ? hY + 1 : hY;
      const fecha = `${anio}-${String(nM).padStart(2, "0")}-${String(nD).padStart(2, "0")}`;
      return {
        usuarioId: u.id,
        nombre: nombreCompleto(u),
        fecha,
        diasRestantes: Math.round((Date.UTC(anio, nM - 1, nD) - hoyUtc) / 86_400_000),
        cumple: anio - nY,
      };
    })
    .sort((a, b) => a.diasRestantes - b.diasRestantes || a.nombre.localeCompare(b.nombre, "es"))
    .slice(0, limite);
}

/**
 * Alertas de membresía para el badge del menú: por vencer (≤7 días) +
 * vencidas en los últimos 30 días, solo de cuentas activas.
 */
export function contarAlertasMembresia(usuarios: readonly UsuarioAdmin[], hoy: string): number {
  let total = 0;
  for (const u of usuarios) {
    const { clave, diasRestantes } = estadoUsuario(u, hoy);
    if (clave === "por_vencer") total += 1;
    else if (clave === "vencida" && diasRestantes !== null && diasRestantes >= -DIAS_VENCIDAS_RECIENTES)
      total += 1;
  }
  return total;
}

export function construirPanel({ hoy, usuarios, dias }: EntradaPanel): DatosPanel {
  const diasPorUsuario = agruparPorUsuario(dias);
  const distribucion: Record<EstadoUsuarioClave, number> = {
    activa: 0,
    por_vencer: 0,
    vencida: 0,
    sin_membresia: 0,
    desactivado: 0,
  };

  // Cada lista guarda la fila + una clave de orden ascendente.
  const porVencer: [FilaAtencion, number][] = [];
  const vencidasRecientes: [FilaAtencion, number][] = [];
  const rachaEnRiesgo: [FilaAtencion, number][] = [];
  const inactivos: [FilaAtencion, number][] = [];
  const topRachas: FilaRacha[] = [];
  const metricas = new Map<string, MetricasUsuario>();
  const activos = usuarios.filter((u) => u.activo);
  let vencidasRecientesTotal = 0;

  for (const u of usuarios) {
    const { clave, membresia, diasRestantes } = estadoUsuario(u, hoy);
    distribucion[clave] += 1;
    if (!u.activo) continue;

    const nombre = nombreCompleto(u);
    const m = metricasUsuario(diasPorUsuario.get(u.id) ?? [], hoy, { registro: u.created_at });
    metricas.set(u.id, m);
    const plan = membresia ? etiquetaPlan(membresia.tipo_plan) : null;
    const base = { usuarioId: u.id, nombre, telefono: u.telefono };

    if (clave === "por_vencer" && diasRestantes !== null) {
      porVencer.push([{ ...base, detalle: textoVencimiento(diasRestantes), extra: plan }, diasRestantes]);
    }
    if (clave === "vencida" && diasRestantes !== null && diasRestantes >= -DIAS_VENCIDAS_RECIENTES) {
      vencidasRecientesTotal += 1;
      vencidasRecientes.push([
        { ...base, detalle: textoVencimiento(diasRestantes), extra: plan },
        -diasRestantes,
      ]);
    }

    const vigente = clave === "activa" || clave === "por_vencer";
    if (vigente && m.racha.enRiesgo) {
      rachaEnRiesgo.push([
        {
          ...base,
          detalle: `Racha de ${m.racha.currentCount} día${m.racha.currentCount === 1 ? "" : "s"} en riesgo`,
          extra: "Falló un día esta semana y hoy aún no entrena",
        },
        -m.racha.currentCount,
      ]);
    }

    const registroHace = Math.round(
      (stringAFecha(hoy).getTime() - stringAFecha(diaBogota(u.created_at)).getTime()) / 86_400_000
    );
    if (vigente) {
      if (m.diasSinEntrenar === null && registroHace > DIAS_SIN_ENTRENAR_ALERTA) {
        inactivos.push([
          { ...base, detalle: "Sin entrenos en los últimos 90 días", extra: plan },
          -Number.MAX_SAFE_INTEGER,
        ]);
      } else if (m.diasSinEntrenar !== null && m.diasSinEntrenar > DIAS_SIN_ENTRENAR_ALERTA) {
        inactivos.push([
          { ...base, detalle: `${m.diasSinEntrenar} días sin entrenar`, extra: plan },
          -m.diasSinEntrenar,
        ]);
      }
    }

    if (m.racha.currentCount > 0) {
      topRachas.push({
        usuarioId: u.id,
        nombre,
        racha: m.racha.currentCount,
        hoyActivado: m.racha.hoyActivado,
        enRiesgo: m.racha.enRiesgo,
      });
    }
  }

  // Asistencia diaria (usuarios distintos por día) y horas pico.
  const usuariosActivosIds = new Set(activos.map((u) => u.id));
  const usuariosPorDia = new Map<string, number>();
  const llegadasPorHora = new Array<number>(24).fill(0);
  const desdeHorasPico = sumarDiasFecha(hoy, -29);
  const actividadHoy: [FilaActividadHoy, string][] = [];
  const nombres = new Map(usuarios.map((u) => [u.id, nombreCompleto(u)]));

  for (const d of dias) {
    if (d.dia > hoy) continue;
    usuariosPorDia.set(d.dia, (usuariosPorDia.get(d.dia) ?? 0) + 1);
    if (d.dia >= desdeHorasPico) llegadasPorHora[d.horaLlegada] += 1;
    if (d.dia === hoy && usuariosActivosIds.has(d.userId)) {
      actividadHoy.push([
        {
          usuarioId: d.userId,
          nombre: nombres.get(d.userId) ?? "Usuario",
          ejercicios: d.ejercicios,
          hora: horaMinutoBogota(d.primeraIso),
          racha: metricas.get(d.userId)?.racha.currentCount ?? 0,
        },
        d.primeraIso,
      ]);
    }
  }

  const asistenciaDiaria: PuntoAsistencia[] = [];
  for (let i = DIAS_ASISTENCIA_PANEL - 1; i >= 0; i--) {
    const fecha = sumarDiasFecha(hoy, -i);
    asistenciaDiaria.push({
      fecha,
      usuarios: usuariosPorDia.get(fecha) ?? 0,
      domingo: !esDiaExigible(stringAFecha(fecha)),
    });
  }

  const exigiblesEntre = (desde: number, hasta: number) =>
    asistenciaDiaria
      .slice(asistenciaDiaria.length - 1 - hasta, asistenciaDiaria.length - desde)
      .filter((p) => !p.domingo)
      .map((p) => p.usuarios);

  const porOrden = (lista: [FilaAtencion, number][]) =>
    lista
      .sort((a, b) => a[1] - b[1] || a[0].nombre.localeCompare(b[0].nombre, "es"))
      .slice(0, LIMITE_LISTA_ATENCION)
      .map(([fila]) => fila);

  return {
    hoy,
    esDomingo: !esDiaExigible(stringAFecha(hoy)),
    kpis: {
      usuariosActivos: activos.length,
      miembrosVigentes: distribucion.activa + distribucion.por_vencer,
      entrenaronHoy: actividadHoy.length,
      promedioDiario7: promedio(exigiblesEntre(1, 7)),
      promedioDiario7Anterior: promedio(exigiblesEntre(8, 14)),
      sparkline: asistenciaDiaria.slice(-14).map((p) => p.usuarios),
      porVencer: distribucion.por_vencer,
      vencidas: distribucion.vencida,
      vencidasRecientes: vencidasRecientesTotal,
      sinMembresia: distribucion.sin_membresia,
      desactivados: distribucion.desactivado,
    },
    asistenciaDiaria,
    distribucion,
    atencion: {
      porVencer: porOrden(porVencer),
      vencidasRecientes: porOrden(vencidasRecientes),
      rachaEnRiesgo: porOrden(rachaEnRiesgo),
      inactivos: porOrden(inactivos),
    },
    actividadHoy: actividadHoy.sort((a, b) => b[1].localeCompare(a[1])).map(([fila]) => fila),
    horasPico: llegadasPorHora.map((llegadas, hora) => ({ hora, llegadas })),
    topRachas: topRachas
      .sort((a, b) => b.racha - a.racha || a.nombre.localeCompare(b.nombre, "es"))
      .slice(0, 5),
    cumpleanos: proximosCumpleanos(usuarios, hoy),
    ultimosRegistros: [...activos]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((u) => ({
        usuarioId: u.id,
        nombre: nombreCompleto(u),
        email: u.email,
        fecha: diaBogota(u.created_at),
        perfilCompleto: u.perfil_completo,
      })),
  };
}
