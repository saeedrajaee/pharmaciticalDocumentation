import { NextResponse } from "next/server";

export function middleware(request) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === "/auth/signin" || pathname === "/auth/sign-up";
  const isDashboardPage = pathname.startsWith("/home");

  if (isDashboardPage && !session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/auth/signin", "/auth/sign-up"],
};
