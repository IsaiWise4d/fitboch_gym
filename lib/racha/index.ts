// Barrel del módulo de racha.
//
// Lógica pura (cliente/edge/server safe):  reglas.ts, bogota.ts, types.ts
// Lógica de servidor (server-only):        server.ts

export * from "./types";
export * from "./bogota";
export * from "./reglas";
export {
  getEstadoRacha,
  getEstadosRachaUsuarios,
  getResumenAdminRacha,
  getResumenRacha,
  getCalendarioMes,
  evaluarActivacionRacha,
} from "./server";