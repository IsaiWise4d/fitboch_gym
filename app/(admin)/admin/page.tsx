import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, AlertTriangle, XCircle, UserCheck } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoy = new Date().toISOString().split("T")[0];
  const en7dias = addDays(new Date(), 7).toISOString().split("T")[0];

  // Consultas en paralelo
  const [
    { count: totalUsuarios },
    { count: membresiaActivas },
    { data: porVencer },
    { count: vencidas },
    { data: ultimosRegistros },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("rol", "usuario").eq("activo", true),
    supabase.from("membresias").select("*", { count: "exact", head: true }).eq("estado", "activa"),
    supabase
      .from("membresias")
      .select("*, profiles!inner(nombre, apellido, email)")
      .eq("estado", "activa")
      .lte("fecha_fin", en7dias)
      .gte("fecha_fin", hoy),
    supabase.from("membresias").select("*", { count: "exact", head: true }).eq("estado", "vencida"),
    supabase
      .from("profiles")
      .select("id, nombre, apellido, email, created_at")
      .eq("rol", "usuario")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const metricas = [
    {
      label: "Total usuarios",
      valor: totalUsuarios ?? 0,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Membresías activas",
      valor: membresiaActivas ?? 0,
      icon: UserCheck,
      color: "text-success",
    },
    {
      label: "Por vencer (7 días)",
      valor: porVencer?.length ?? 0,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      label: "Membresías vencidas",
      valor: vencidas ?? 0,
      icon: XCircle,
      color: "text-error",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-lg border border-border bg-surface p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-2xl font-bold">{m.valor}</p>
            </div>
          );
        })}
      </div>

      {/* Por vencer */}
      {porVencer && porVencer.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Membresías por vencer
          </h2>
          <div className="rounded-lg border border-border bg-surface divide-y divide-border">
            {porVencer.map((m: any) => (
              <Link
                key={m.id}
                href={`/admin/usuarios/${m.usuario_id}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {m.profiles.nombre} {m.profiles.apellido || ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.profiles.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-warning font-medium">
                    Vence {format(parseISO(m.fecha_fin), "d MMM", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {m.tipo_plan}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Últimos registros */}
      {ultimosRegistros && ultimosRegistros.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Últimos registros</h2>
          <div className="rounded-lg border border-border bg-surface divide-y divide-border">
            {ultimosRegistros.map((u) => (
              <Link
                key={u.id}
                href={`/admin/usuarios/${u.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {u.nombre} {u.apellido || ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(u.created_at), "d MMM yyyy", { locale: es })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
