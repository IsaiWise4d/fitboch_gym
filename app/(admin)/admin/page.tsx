import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, AlertTriangle, XCircle, UserCheck, Cake } from "lucide-react";
import { addDays, parseISO } from "date-fns";
import Link from "next/link";
import { formatFechaColombia, getHoyColombia } from "@/lib/utils/fecha";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoy = getHoyColombia();
  const en7dias = formatFechaColombia(addDays(parseISO(hoy), 7), "yyyy-MM-dd");

  // Consultas en paralelo
  const [
    { count: totalUsuarios },
    { count: membresiaActivas },
    { data: porVencer },
    { count: vencidas },
    { data: ultimosRegistros },
    { data: perfilesCumples },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("rol", "usuario").eq("activo", true),
    supabase.from("membresias").select("*", { count: "exact", head: true }).eq("estado", "activa").gte("fecha_fin", hoy),
    supabase
      .from("membresias")
      .select("*, profiles!inner(nombre, apellido, email)")
      .eq("estado", "activa")
      .lte("fecha_fin", en7dias)
      .gte("fecha_fin", hoy),
    supabase.from("membresias").select("*", { count: "exact", head: true }).eq("estado", "activa").lt("fecha_fin", hoy),
    supabase
      .from("profiles")
      .select("id, nombre, apellido, email, created_at")
      .eq("rol", "usuario")
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, nombre, apellido, email, fecha_nacimiento")
      .eq("rol", "usuario")
      .eq("activo", true)
      .not("fecha_nacimiento", "is", null),
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

      {/* Próximos cumpleaños */}
      {perfilesCumples && perfilesCumples.length > 0 && (() => {
        const [hY, hM, hD] = hoy.split("-").map(Number);
        const hoyUtc = Date.UTC(hY, hM - 1, hD);
        const sorted = [...perfilesCumples]
          .map((p) => {
            const [, nM, nD] = p.fecha_nacimiento!.split("-").map(Number);
            let cumpleY = hY;
            if (nM < hM || (nM === hM && nD < hD)) cumpleY = hY + 1;
            const cumpleUtc = Date.UTC(cumpleY, nM - 1, nD);
            const diasRestantes = Math.round((cumpleUtc - hoyUtc) / 86_400_000);
            const proximoCumple = `${cumpleY}-${String(nM).padStart(2, "0")}-${String(nD).padStart(2, "0")}`;
            return { ...p, proximoCumple, diasRestantes };
          })
          .sort((a, b) => a.diasRestantes - b.diasRestantes)
          .slice(0, 5);

        return (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Cake className="h-5 w-5 text-primary" />
              Próximos cumpleaños
            </h2>
            <div className="rounded-lg border border-border bg-surface divide-y divide-border">
              {sorted.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/usuarios/${p.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {p.nombre} {p.apellido || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatFechaColombia(p.proximoCumple, "d MMM")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.diasRestantes === 0 ? "¡Hoy!" : `en ${p.diasRestantes} día${p.diasRestantes !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

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
                    Vence {formatFechaColombia(m.fecha_fin, "d MMM")}
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
                  {formatFechaColombia(u.created_at, "d MMM yyyy")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
