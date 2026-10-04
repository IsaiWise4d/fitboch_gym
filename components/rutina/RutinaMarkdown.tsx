"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";
import { partesDia, slugTitulo } from "@/lib/utils/markdown-secciones";

interface RutinaMarkdownProps {
  texto: string;
}

// --- Lectura del árbol HAST que react-markdown pasa en `node` -----------------

interface NodoHast {
  type: string;
  tagName?: string;
  value?: string;
  children?: NodoHast[];
}

function textoDe(nodo: NodoHast | undefined): string {
  if (!nodo) return "";
  if (nodo.type === "text") return nodo.value ?? "";
  return (nodo.children ?? []).map(textoDe).join("");
}

function elementos(nodo: NodoHast | undefined, etiqueta?: string): NodoHast[] {
  return (nodo?.children ?? []).filter(
    (hijo) => hijo.type === "element" && (!etiqueta || hijo.tagName === etiqueta)
  );
}

function leerTabla(nodo: NodoHast | undefined) {
  const encabezados = elementos(elementos(elementos(nodo, "thead")[0], "tr")[0]).map((celda) =>
    textoDe(celda).trim()
  );
  const filas = elementos(elementos(nodo, "tbody")[0], "tr").map((fila) =>
    elementos(fila).map((celda) => textoDe(celda).trim())
  );
  return { encabezados, filas };
}

// --- Encabezados -----------------------------------------------------------------

const NUMERADO = /^(\d+)\s*[.)|:\-–]\s*(.+)$/;

const TAMANO_ENCABEZADO: Record<number, string> = {
  1: "text-xl",
  2: "text-lg",
  3: "text-base",
};

function EncabezadoDia({ id, texto, nivel }: { id: string; texto: string; nivel: number }) {
  const partes = partesDia(texto)!;
  const descanso = /descanso/i.test(partes.titulo);
  const Etiqueta = `h${nivel}` as "h2";
  return (
    <Etiqueta
      id={id}
      className="mb-3 mt-8 flex scroll-mt-28 items-center gap-3 rounded-2xl border border-border bg-surface p-3"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl",
          descanso ? "bg-white/10 text-muted-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        <span className="text-[9px] font-semibold uppercase leading-none">Día</span>
        <span className="text-lg font-bold leading-none">{partes.numero}</span>
      </span>
      <span className="min-w-0">
        {partes.diaSemana && (
          <span className="block text-xs font-medium text-muted-foreground">{partes.diaSemana}</span>
        )}
        <span className={cn("block text-base font-semibold leading-snug", descanso ? "text-muted-foreground" : "text-white")}>
          {partes.titulo || `Día ${partes.numero}`}
        </span>
      </span>
    </Etiqueta>
  );
}

function crearEncabezado(nivel: 1 | 2 | 3 | 4): Components["h1"] {
  return function Encabezado({ node, children }) {
    const texto = textoDe(node as unknown as NodoHast).trim();
    const id = slugTitulo(texto);
    if (partesDia(texto)) return <EncabezadoDia id={id} texto={texto} nivel={nivel} />;

    const Etiqueta = `h${nivel}` as "h2";
    if (nivel === 4) {
      return (
        <h4 id={id} className="mb-2 mt-4 scroll-mt-28 text-[15px] font-semibold text-white/90">
          {children}
        </h4>
      );
    }

    const numerado = texto.match(NUMERADO);
    return (
      <Etiqueta
        id={id}
        className={cn(
          "mb-3 mt-8 flex scroll-mt-28 items-center gap-3 font-bold leading-snug text-white first:mt-0",
          TAMANO_ENCABEZADO[nivel]
        )}
      >
        {numerado ? (
          <>
            <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 px-2 text-sm font-bold text-primary">
              {numerado[1]}
            </span>
            <span className="min-w-0">{numerado[2]}</span>
          </>
        ) : (
          <span className="min-w-0">{children}</span>
        )}
      </Etiqueta>
    );
  };
}

// --- Tablas: tarjetas en el teléfono -----------------------------------------------

/**
 * En pantallas angostas, una tabla de 4+ columnas obliga a deslizar de lado.
 * Se muestra cada fila como tarjeta: la primera columna como título y el resto
 * como datos etiquetados (en cuadrícula si son cortos, como series/reps).
 */
function TarjetasTabla({ encabezados, filas }: { encabezados: string[]; filas: string[][] }) {
  const compacto = filas.every((fila) => fila.slice(1).every((valor) => valor.length <= 14));
  const numerar = /ejercicio/i.test(encabezados[0] ?? "");

  return (
    <ul className="space-y-2 sm:hidden">
      {filas.map((fila, i) => (
        <li key={i} className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-start gap-2.5">
            {numerar && (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
            )}
            <p className="min-w-0 text-[15px] font-semibold leading-snug text-white">
              {fila[0] || "—"}
            </p>
          </div>
          <dl className={compacto ? "mt-3 grid grid-cols-3 gap-2" : "mt-2 space-y-2"}>
            {encabezados.slice(1).map((encabezado, j) => (
              <div key={j} className={compacto ? "rounded-lg bg-background/70 px-2 py-1.5" : undefined}>
                <dt className="text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
                  {encabezado}
                </dt>
                <dd className="mt-0.5 text-sm font-medium leading-snug text-foreground/90">
                  {fila[j + 1] || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}

const componentes: Components = {
  h1: crearEncabezado(1),
  h2: crearEncabezado(2),
  h3: crearEncabezado(3),
  h4: crearEncabezado(4),
  p: ({ children }) => (
    <p className="mb-3 text-[15px] leading-relaxed text-foreground/80">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground/80 marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground/80 marker:font-semibold marker:text-primary">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  hr: () => <hr className="my-6 border-border" />,
  table: ({ node, children }) => {
    const { encabezados, filas } = leerTabla(node as unknown as NodoHast);
    const conTarjetas = encabezados.length >= 4 && filas.length > 0;
    return (
      <div className="mb-4">
        {conTarjetas && <TarjetasTabla encabezados={encabezados} filas={filas} />}
        <div
          data-scroll-x
          className={cn(
            "overflow-x-auto overscroll-x-contain rounded-xl border border-border",
            conTarjetas && "hidden sm:block"
          )}
        >
          <table className="w-full text-sm">{children}</table>
        </div>
      </div>
    );
  },
  thead: ({ children }) => <thead className="bg-white/5 text-white">{children}</thead>,
  th: ({ children }) => (
    <th className="whitespace-nowrap border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="min-w-[5rem] border-b border-border/50 px-3 py-2 align-top text-muted-foreground">
      {children}
    </td>
  ),
  tr: ({ children }) => <tr className="transition-colors hover:bg-white/5">{children}</tr>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-4 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm [&_p]:mb-0 [&_p]:text-sm">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 space-y-2">{children}</div>
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-primary">
      {children}
    </code>
  ),
};

export function RutinaMarkdown({ texto }: RutinaMarkdownProps) {
  return (
    <div className="rutina-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
        {texto}
      </ReactMarkdown>
    </div>
  );
}
