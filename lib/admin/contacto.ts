// Enlaces de contacto rápido desde el panel admin (puro).

/**
 * Normaliza un celular colombiano al formato internacional sin "+":
 * "300 123 4567" → "573001234567". Devuelve null si no parece válido.
 */
export function normalizarTelefonoCo(telefono: string | null): string | null {
  if (!telefono) return null;
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 10 && digitos.startsWith("3")) return `57${digitos}`;
  if (digitos.length === 12 && digitos.startsWith("573")) return digitos;
  return null;
}

/** Enlace wa.me con mensaje opcional; null si el teléfono no es válido. */
export function enlaceWhatsApp(telefono: string | null, mensaje?: string): string | null {
  const numero = normalizarTelefonoCo(telefono);
  if (!numero) return null;
  return mensaje
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/${numero}`;
}
