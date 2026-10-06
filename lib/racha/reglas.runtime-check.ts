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

// Caso 3: faltar 1 o 2 días exigibles seguidos NO rompe (protección).
{
  const r = calcularRacha(set("2024-02-26", "2024-02-28"), "2024-02-28");
  assertOK(r.currentCount === 2, "C3: falta martes (1 día) → count=2 (no rompe)");
  const r2 = calcularRacha(set("2024-02-26", "2024-02-29"), "2024-02-29");
  assertOK(r2.currentCount === 2, "C3b: faltan mar+mié (2 días) → count=2 (no rompe)");
}

// Caso 4: 3 fallos exigibles seguidos resetean a 0.
{
  const r = calcularRacha(set("2024-02-26"), "2024-03-01");
  assertOK(r.currentCount === 0 && r.rota === true, "C4: mar+mié+jue fallados, hoy vie pendiente → count=0, rota");
}

// Caso 5: el fin de semana es neutro (no reinicia los fallos).
//   Mié 28 activo, jue 29 y vie 1 fallados, sáb/dom neutros, lun 4 hoy pendiente.
{
  const r = calcularRacha(set("2024-02-28"), "2024-03-04");
  assertOK(r.currentCount === 1 && r.rota === false, "C5: jue+vie fallados, lun pendiente → count=1");
  assertOK(r.enRiesgo === true, "C5: enRiesgo=true (2 días de protección usados)");
  const r2 = calcularRacha(set("2024-02-27"), "2024-03-04");
  assertOK(r2.rota === true, "C5b: mié+jue+vie fallados cruzando fin de semana → rota");
}

// Caso 6: zona horaria — 21:00 Bogotá del lunes 26 = 02:00Z del martes 27.
{
  const s = construirCalendarioActivaciones(["2024-02-27T02:00:00Z"]);
  assertOK(s.has("2024-02-26"), "C6: 2024-02-27T02:00Z → día Bogotá = 2024-02-26 (lunes)");
  const s2 = construirCalendarioActivaciones(["2024-02-27T05:00:00Z"]);
  assertOK(s2.has("2024-02-27"), "C6b: 2024-02-27T05:00Z (medianoche Bogotá del martes) → 2024-02-27");
}

// Caso 7: sábado y domingo no exigibles
{
  assertOK(esDiaExigible(stringAFecha("2024-02-24")) === false, "C7: sábado NO exigible");
  assertOK(esDiaExigible(stringAFecha("2024-02-25")) === false, "C7b: domingo NO exigible");
  assertOK(esDiaExigible(stringAFecha("2024-02-26")) === true, "C7c: lunes exigible");
}

// Caso 8: shouldResetStreak
{
  assertOK(shouldResetStreak(2) === false, "C8: shouldResetStreak(2)=false (protección)");
  assertOK(shouldResetStreak(3) === true, "C8b: shouldResetStreak(3)=true");
}

// Caso 9: mejor racha histórica
{
  const m = calcularMejorRacha(new Set(["2024-02-26", "2024-02-27", "2024-02-28", "2024-03-01", "2024-03-02"]));
  assertOK(m === 4, "C9: lun-mar-mié-vie (sábado neutro) → 4");
}

if (fallados > 0) {
  console.error(`\n${fallados} test(s) fallaron.`);
  process.exit(1);
} else {
  console.log("\nTodos los tests pasaron.");
}
