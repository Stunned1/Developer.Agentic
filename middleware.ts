import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDeveloperRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/list-agent");

  if (isDeveloperRoute) {
    // Not logged in at all — go to login
    if (!user) {
      return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url));
    }

    // Logged in but not a developer — go to apply page
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_developer")
      .eq("id", user.id)
      .single();

    if (!profile?.is_developer) {
      return NextResponse.redirect(new URL("/apply", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/list-agent/:path*"],
};
