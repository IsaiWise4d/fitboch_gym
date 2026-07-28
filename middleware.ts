import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public paths
  const publicPaths = ["/login", "/recuperar-password", "/auth/callback"];
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Not authenticated -> redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol, activo")
      .eq("id", user.id)
      .single();

    // Usuario desactivado: no permitir acceso a la app
    if (profile?.activo === false) {
      if (!(isPublicPath && pathname === "/login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "disabled");
        return NextResponse.redirect(url);
      }

      return supabaseResponse;
    }

    // Authenticated on public path (except callback) -> redirect to dashboard
    if (isPublicPath && !pathname.startsWith("/auth/callback")) {
      const url = request.nextUrl.clone();
      url.pathname = profile?.rol === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }

    // Protect admin routes
    if (pathname.startsWith("/admin") && profile?.rol !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Bloquear rutas de usuario para admins — siempre van a /admin
    const userRoutes = ["/dashboard", "/racha", "/rutina", "/plan-nutricional", "/ejercicios", "/perfil"];
    if (
      profile?.rol === "admin" &&
      userRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
