import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Create Supabase client for Next.js middleware.
 * Handles cookie-based session refresh on every request.
 * SSR mode only — middleware is ignored in static export.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired — IMPORTANT: use getUser() not getSession()
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes — redirect to auth if not logged in
  const protectedPrefixes = [
    '/inicio', '/dashboard', '/financeiro', '/crm', '/analise',
    '/orcamento', '/consultor-ai', '/historico-ocr', '/minha-jornada',
    '/manual', '/configuracoes', '/perfil', '/admin',
  ];

  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Auth routes — redirect to home if already logged in
  const authPaths = ['/auth', '/esqueci-senha', '/redefinir-senha'];
  const isAuthRoute = authPaths.some((p) => request.nextUrl.pathname === p);

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
