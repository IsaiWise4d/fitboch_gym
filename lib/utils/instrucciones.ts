// Convierte el texto libre de "instrucciones" (ejercicios y calentamientos)
// en pasos cortos y numerados, más fáciles de seguir en el gimnasio.
//
// - Si el texto trae varias líneas, cada línea es un paso (se quitan
//   viñetas y numeraciones como "1.", "2)", "Paso 3:", "-", "•").
// - Si es un solo párrafo, se separa por oraciones.
// Sin lookbehind en las regex: Safari < 16.4 no lo soporta.

const PREFIJO_LISTA = /^\s*(?:(?:paso\s*)?\d+\s*[.):\-–]\s*|[-•*–]\s+)/i;
const INICIO_ORACION = /^[A-ZÁÉÍÓÚÑÜ¿¡"“(]/;

function separarOraciones(parrafo: string): string[] {
  const trozos = parrafo.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [parrafo];
  const oraciones: string[] = [];
  for (const trozo of trozos) {
    const texto = trozo.trim();
    if (!texto) continue;
    const anterior = oraciones[oraciones.length - 1];
    if (anterior !== undefined && !INICIO_ORACION.test(texto)) {
      // No empieza una oración nueva ("1.5 kg", "aprox. diez"): se une.
      const pegado = /\d[.,]$/.test(anterior) && /^\d/.test(texto);
      oraciones[oraciones.length - 1] = pegado ? `${anterior}${texto}` : `${anterior} ${texto}`;
    } else {
      oraciones.push(texto);
    }
  }
  return oraciones;
}

export function separarPasos(texto: string | null | undefined): string[] {
  if (!texto?.trim()) return [];

  const lineas = texto
    .split(/\r?\n/)
    .map((linea) => linea.replace(PREFIJO_LISTA, "").trim())
    .filter(Boolean);

  if (lineas.length > 1) return lineas;
  return separarOraciones(lineas[0] ?? texto.trim());
}
