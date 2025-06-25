import { NextResponse } from "next/server";
import { getAllowedTenants } from "./lib/getTenantConfig";

export async function middleware(request) {
  const host = request.headers.get("host") || "";
  const match = host.match(/^([^.]+)\.priority-hub\.com$/);
  const subdomain = match ? match[1] : null;

  // Allow root domain and www
  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // Fetch allowed tenants dynamically
  const allowedTenants = await getAllowedTenants();
  if (allowedTenants.includes(subdomain)) {
    return NextResponse.next();
  }

  return new NextResponse(
    JSON.stringify({ error: "Access Denied" }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
