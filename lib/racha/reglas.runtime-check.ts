// Test runtime de la lógica pura de racha.
// Ejecutar:  node --experimental-strip-types lib/racha/reglas.runtime-check.ts
//
// Verifica los 8 casos del checklist del spec.

import { calcularRacha, construirCalendarioActivaciones, shouldResetStreak, esDiaExigible, calcularMejorRacha } from "./reglas.ts";
import { stringAFecha } from "./bogota.ts";

let fallados = 0;
function assertOK(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    fallados++;
  } else {
    console.log("ok  :", msg);
  }
}

const set = (...xs: string[]) => new Set<string>(xs);

// Caso 1: racha creciente 3 días, hoy activado.
// Feb 2024: 26=lun, 27=mar, 28=mié
{
  const r = calcularRacha(set("2024-02-26", "2024-02-27", "2024-02-28"), "2024-02-28");
  assertOK(r.currentCount === 3, "C1: lun-mar-mié activado, hoy mié → count=3");
  assertOK(r.hoyActivado === true, "C1: hoyActivado=true");
  assertOK(r.enRiesgo === false, "C1: enRiesgo=false");
}

// Caso 2: dos ejercicios el mismo día NO duplican (el Set los colapsa).
{
  const r = calcularRacha(set("2024-02-02"), "2024-02-02");
  assertOK(r.currentCount === 1, "C2: 2 ejercicios mismo día → count=1");
}

// Caso 3: faltar 1 día exigible NO rompe (congelada).
// 25=domingo, 26=lun activo, 27=mar fallado, 28=mié hoy activo
{
  const r = calcularRacha(set("2024-02-26", "2024-02-28"), "2024-02-28");
  assertOK(r.currentCount === 2, "C3: falta martes (1 día) → count=2 (no rompe)");
}

// Caso 4: faltar 2 consecutivos (sin domingo de por medio) resetea a 0.
// 26=lun activo, 27=mar fallado, 28=mié fallado, 29=jue hoy activo
{
  const r = calcularRacha(set("2024-02-26", "2024-02-29"), "2024-02-29");
  assertOK(r.currentCount === 1, "C4: mar+mié fallados, jueves activo → count=1 (vieja rota, nueva sub-racha)");
  assertOK(r.rota === false, "C4: rota=false (hay nueva sub-racha)");
}

// Caso 4b: 2 fallos consecutivos y hoy también fallado/pending.
{
  // 26=lun activo, 27=mar fall, 28=mié fall, 29=jue hoy PENDIENTE
  const r = calcularRacha(set("2024-02-26"), "2024-02-29");
  assertOK(r.currentCount === 0, "C4b: mar+mié fallados, hoy jueves pendiente → count=0");
  assertOK(r.rota === true, "C4b: rota=true");
}

// Caso 5 (REGLA DEL DOMINGO): sábado fallado + lunes fallado, con domingo en
// medio, NO rompe. Setup:
//   Feb 2024: 23=vie (activo), 24=sáb (fallado), 25=dom (reset), 26=lun (fallado), 27=mar (hoy pendiente).
//   Si la regla del domingo NO existiera, los 2 fallos (sáb+lun) romperían.
//   Con la regla, el domingo resetea el contador → NO rompe. La racha vieja
//   (solo vie 23) sigue viva, y ahora el lunes 26 fallo + martes 27 pendiente
//   → enRiesgo=true.
{
  const r = calcularRacha(
    set("2024-02-23"),
    "2024-02-27"
  );
  assertOK(r.currentCount === 1, "C5: vie 23 activo, sáb fallado, dom reset, lun fallado, mar pendiente → count=1 (NO rompe)");
  assertOK(r.rota === false, "C5: rota=false (sábado+lunes fallados, domingo interpuesto)");
  assertOK(r.enRiesgo === true, "C5: enRiesgo=true (lunes fallado + martes pendiente en bloque de hoy)");
}

// Caso 5b: MISMO contexto pero martes HOY ACTIVADO. La racha vieja sigue viva
// y el martes activa la sub-racha nueva (count=2: vie + mar).
{
  const r = calcularRacha(
    set("2024-02-23", "2024-02-27"),
    "2024-02-27"
  );
  assertOK(r.currentCount === 2, "C5b: vie 23 + mar 27 activado (sáb+lun fallados con dom interpuesto) → count=2");
  assertOK(r.rota === false, "C5b: rota=false");
  assertOK(r.hoyActivado === true, "C5b: hoyActivado=true");
}

// Caso 5c: Sábado fallado + martes hoy pendiente, con domingo Y lunes en medio.
// Aquí el bloque semanal de HOY (martes) empieza el lunes; el sábado está en
// el bloque anterior (cruzó un domingo). No se considera enRiesgo por
// el sábado caído, pero SÍ entra en cuenta el lunes 26 si también está vacío.
//    23=vie activo, 24=sáb fallado, 25=dom (reset fallos), 26=lun activo, 27=mar HOY pendiente.
// → bloque de hoy solo incluye lunes(activado) → 0 fallos en bloque de hoy → no enRiesgo.
{
  const r = calcularRacha(
    set("2024-02-23", "2024-02-26"),
    "2024-02-27"
  );
  assertOK(r.currentCount === 2, "C5c: vie(23) + lunes(26) + martes(27 hoy pendiente) → count=2");
  assertOK(r.enRiesgo === false, "C5c: sábado anterior fallado NO implica riesgo (lunes activado cierra el bloque)");
}

// Caso 6: zona horaria — 21:00 Bogotá del lunes 26 = 02:00Z del martes 27.
{
  const s = construirCalendarioActivaciones(["2024-02-27T02:00:00Z"]);
  assertOK(s.has("2024-02-26"), "C6: 2024-02-27T02:00Z → día Bogotá = 2024-02-26 (lunes)");
  const s2 = construirCalendarioActivaciones(["2024-02-27T05:00:00Z"]);
  assertOK(s2.has("2024-02-27"), "C6b: 2024-02-27T05:00Z (medianoche Bogotá del martes) → 2024-02-27");
}

// Caso 7: domingo no exigible
{
  assertOK(esDiaExigible(stringAFecha("2024-02-25")) === false, "C7: 2024-02-25 (domingo) NO exigible");
  assertOK(esDiaExigible(stringAFecha("2024-02-26")) === true, "C7b: 2024-02-26 (lunes) exigible");
}

// Caso 8: shouldResetStreak ajustable
{
  assertOK(shouldResetStreak(0) === false, "C8: shouldResetStreak(0)=false");
  assertOK(shouldResetStreak(1) === false, "C8b: shouldResetStreak(1)=false (tolerancia 1)");
  assertOK(shouldResetStreak(2) === true, "C8c: shouldResetStreak(2)=true");
}

// Caso 9: mejor racha histórica
{
  // 3 días seguidos, ruptura, luego 2 días.
  const m = calcularMejorRacha(new Set(["2024-02-26", "2024-02-27", "2024-02-28", "2024-03-01", "2024-03-02"]));
  // Lun..vie (26..1-mar vie), sábado 2-mar activo → 5 seguidos? Sí, sin faltas.
  assertOK(m === 5, "C9: mejor racha con 5 días seguidos = 5");

  const m2 = calcularMejorRacha(new Set(["2024-02-26", "2024-02-28"]));
  // Lunes 26 + miércoles 28 (falta martes 27 = 1 fallo tolerado) → 2 seguidos
  assertOK(m2 === 2, "C9b: mejor racha con 1 fallo tolerado = 2");
}

if (fallados > 0) {
  console.error(`\n${fallados} test(s) fallaron.`);
  process.exit(1);
} else {
  console.log("\nTodos los tests pasaron.");
}