import Link from "next/link";
import { Dumbbell, BookOpen, User } from "lucide-react";

const accesos = [
  {
    href: "/rutina",
    label: "Mi Rutina",
    description: "Ver tu plan de entrenamiento",
    icon: Dumbbell,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    href: "/ejercicios",
    label: "Ejercicios",
    description: "Biblioteca de ejercicios",
    icon: BookOpen,
    color: "text-chart-5",
    bg: "bg-chart-5/10",
  },
  {
    href: "/perfil",
    label: "Mi Perfil",
    description: "Datos personales",
    icon: User,
    color: "text-success",
    bg: "bg-success/10",
  },
];

export function AccesosRapidos() {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        Accesos rápidos
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {accesos.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover"
            >
              <div className={`rounded-lg ${item.bg} p-2`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <span className="text-xs font-medium text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
