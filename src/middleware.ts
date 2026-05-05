import { auth } from '@/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const protected_ = ['/project', '/settings']
  if (!req.auth && protected_.some((p) => pathname.startsWith(p))) {
    return Response.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/project/:path*', '/settings/:path*'],
}
