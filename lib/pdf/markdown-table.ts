export interface MarkdownTableData {
  headers: string[];
  rows: string[][];
}

const SEPARATOR_CELL_REGEX = /^:?-{3,}:?$/;

export function cleanMarkdownPdfText(value: string): string {
  return value
    .replace(/\\\|/g, "|")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMarkdownTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.endsWith("|")) {
    trimmed = trimmed.slice(0, -1);
  }

  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of trimmed) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function isSeparatorRow(cells: string[]): boolean {
  if (cells.length === 0) {
    return false;
  }

  return cells.every((cell) => SEPARATOR_CELL_REGEX.test(cell.trim()));
}

function normalizeCells(cells: string[], targetColumns: number): string[] {
  if (cells.length === targetColumns) {
    return cells;
  }

  if (cells.length < targetColumns) {
    return [...cells, ...Array.from({ length: targetColumns - cells.length }, () => "")];
  }

  const keep = cells.slice(0, targetColumns - 1);
  const mergedTail = cells.slice(targetColumns - 1).join(" | ");
  return [...keep, mergedTail];
}

export function parseMarkdownTable(
  tableLines: string[],
  options?: { maxColumns?: number }
): MarkdownTableData | null {
  const parsedRows = tableLines
    .map((line) => parseMarkdownTableRow(line))
    .filter((cells) => cells.some((cell) => cell.trim().length > 0));

  const rowsWithoutSeparators = parsedRows.filter((cells) => !isSeparatorRow(cells));
  if (rowsWithoutSeparators.length < 2) {
    return null;
  }

  const headerRaw = rowsWithoutSeparators[0];
  if (headerRaw.length < 2) {
    return null;
  }

  const maxColumns = options?.maxColumns ?? 6;
  const targetColumns = Math.min(headerRaw.length, maxColumns);
  const headers = normalizeCells(headerRaw, targetColumns).map(cleanMarkdownPdfText);

  const rows = rowsWithoutSeparators
    .slice(1)
    .map((cells) => normalizeCells(cells, targetColumns).map(cleanMarkdownPdfText))
    .filter((cells) => cells.some((cell) => cell.length > 0));

  if (rows.length === 0) {
    return null;
  }

  return { headers, rows };
}
