import { NextResponse } from "next/server";

import { getEstadoRacha } from "@/lib/racha/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no-auth" }, { status: 401 });
  }

  try {
    const estado = await getEstadoRacha(user.id);
    return NextResponse.json({ estado });
  } catch (error) {
    console.error("Error leyendo estado de racha:", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
