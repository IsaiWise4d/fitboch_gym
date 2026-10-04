"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-all hover:bg-destructive/10 active:scale-[0.98]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-destructive">Cerrar sesión</span>
    </button>
  );
}
