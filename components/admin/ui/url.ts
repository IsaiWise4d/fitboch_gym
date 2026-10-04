/**
 * Escribe parámetros en la URL sin ir al servidor: Next sincroniza
 * `useSearchParams` con history.replaceState. `null` o "" borran la clave.
 */
export function actualizarUrl(cambios: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [clave, valor] of Object.entries(cambios)) {
    if (valor === null || valor === "") params.delete(clave);
    else params.set(clave, valor);
  }
  const consulta = params.toString();
  window.history.replaceState(null, "", consulta ? `?${consulta}` : window.location.pathname);
}
