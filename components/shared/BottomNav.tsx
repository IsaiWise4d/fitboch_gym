"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BookOpen, User, Apple, Flame } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/racha", label: "Racha", icon: Flame },
  { href: "/rutina", label: "Rutina", icon: Dumbbell },
  { href: "/plan-nutricional", label: "Dieta", icon: Apple },
  { href: "/ejercicios", label: "Ejercicios", icon: BookOpen },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-md grid-cols-6">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-3 px-1 text-[11px] transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
