import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CalentamientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: calentamiento } = await supabase
    .from("calentamientos")
    .select("*")
    .eq("id", id)
    .eq("activo", true)
    .single();
  if (!calentamiento) notFound();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/calentamientos" className="rounded-lg p-2 transition-colors hover:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{calentamiento.nombre}</h1>
      </div>
      {calentamiento.imagen_url && (
        <div className="flex justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-border">
            <img src={calentamiento.imagen_url} alt={calentamiento.nombre} className="aspect-square w-full object-cover" />
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
          {calentamiento.categoria.replace("_", " ")}
        </span>
        {calentamiento.nivel !== "todos" && (
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
            {calentamiento.nivel}
          </span>
        )}
      </div>
      {calentamiento.descripcion && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Descripción</h2>
          <p className="text-sm leading-relaxed">{calentamiento.descripcion}</p>
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Cómo hacerlo correctamente</h2>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed">{calentamiento.instrucciones}</p>
        </div>
      </div>
      {calentamiento.video_url && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Video</h2>
          <div className="aspect-video overflow-hidden rounded-xl border border-border">
            <iframe src={calentamiento.video_url} className="h-full w-full" allowFullScreen title={calentamiento.nombre} />
          </div>
        </div>
      )}
    </div>
  );
}
