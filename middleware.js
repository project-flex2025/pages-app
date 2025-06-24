import { NextResponse } from 'next/server';
import allowedTenants from './allowed-tenants.json' assert { type: "json" };

export function middleware(request) {
  const host = request.headers.get('host') || '';
  // Extract subdomain (e.g., app1 from app1.priority-hub.com)
  const match = host.match(/^([^.]+)\.priority-hub\.com$/);
  const subdomain = match ? match[1] : null;

  // Allow root domain and www
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // Allow only if subdomain is in allowedTenants
  if (allowedTenants.includes(subdomain)) {
    return NextResponse.next();
  }

  // Block all other subdomains
  return new NextResponse(
    JSON.stringify({ error: "Access Denied" }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}

export const config = {
  matcher: [
    // Exclude _next/static, _next/image, favicon.ico, and api/auth (NextAuth endpoints)
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
