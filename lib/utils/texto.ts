/** Minúsculas y sin tildes: "Bíceps" y "biceps" coinciden al buscar. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
