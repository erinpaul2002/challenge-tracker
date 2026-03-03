import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const hasStreamerSession = Boolean(request.cookies.get('streamer_session')?.value)
  const hasModeratorSession = Boolean(request.cookies.get('moderator_session')?.value)

  // Protected routes
  const protectedStreamerRoutes = request.nextUrl.pathname.startsWith('/streamer')
  const protectedModeratorRoutes = request.nextUrl.pathname.startsWith('/moderator')
  const protectedApiRoutes =
    request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/api/auth')

  // Check if it's a moderator API request (legacy compatibility)
  const isModeratorApiRequest =
    protectedApiRoutes &&
    (request.headers.get('x-moderator-session') || hasModeratorSession)

  if ((protectedStreamerRoutes || (protectedApiRoutes && !isModeratorApiRequest)) && !hasStreamerSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if ((protectedModeratorRoutes || isModeratorApiRequest) && !hasModeratorSession && !hasStreamerSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user has any session and hits auth pages, redirect to best dashboard
  if ((hasStreamerSession || hasModeratorSession) && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = hasModeratorSession ? '/moderator/dashboard' : '/streamer/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}