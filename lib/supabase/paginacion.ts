// Lectura paginada de PostgREST, que devuelve como máximo 1000 filas por
// petición. Sin "server-only" porque no toca secretos, pero pensado para
// el servidor.

export const TAMANO_PAGINA = 1000;

export interface RespuestaPagina<T> {
  data: T[] | null;
  error: { message: string } | null;
  count?: number | null;
}

/** Lee todas las filas página a página (secuencial) hasta una página corta. */
export async function leerTodo<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<RespuestaPagina<T>>
): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data, error } = await pagina(desde, desde + TAMANO_PAGINA - 1);
    if (error) throw new Error(error.message);
    filas.push(...(data ?? []));
    if (!data || data.length < TAMANO_PAGINA) return filas;
  }
}

/**
 * Igual que `leerTodo`, pero la primera página trae el total (`count:
 * "exact"`) y las demás se piden en paralelo (`concurrencia` a la vez).
 * La consulta DEBE tener un orden estable (p. ej. fecha + id).
 */
export async function leerTodoEnParalelo<T>(
  pagina: (desde: number, hasta: number, conConteo: boolean) => PromiseLike<RespuestaPagina<T>>,
  concurrencia = 6
): Promise<T[]> {
  const primera = await pagina(0, TAMANO_PAGINA - 1, true);
  if (primera.error) throw new Error(primera.error.message);
  const filas: T[] = [...(primera.data ?? [])];
  const total = primera.count ?? filas.length;
  if (filas.length >= total || filas.length < TAMANO_PAGINA) return filas;

  const inicios: number[] = [];
  for (let desde = TAMANO_PAGINA; desde < total; desde += TAMANO_PAGINA) inicios.push(desde);

  for (let i = 0; i < inicios.length; i += concurrencia) {
    const lote = await Promise.all(
      inicios
        .slice(i, i + concurrencia)
        .map((desde) => pagina(desde, desde + TAMANO_PAGINA - 1, false))
    );
    for (const respuesta of lote) {
      if (respuesta.error) throw new Error(respuesta.error.message);
      filas.push(...(respuesta.data ?? []));
    }
  }
  return filas;
}

/** Supabase puede tipar una relación many-to-one como objeto o arreglo. */
export function primero<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}
