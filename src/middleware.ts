import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // CSRF protection: check origin on all POST/PUT/PATCH/DELETE to /api/
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Allow requests without origin (non-browser, e.g., server-to-server)
    if (origin) {
      const originUrl = new URL(origin);
      const expectedHost = host?.split(":")[0];
      const originHost = originUrl.hostname;

      // In development, be more permissive
      const isDev = process.env.NODE_ENV === "development";
      if (!isDev && expectedHost && originHost !== expectedHost) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    // Match all API routes and pages, exclude static files and _next
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
