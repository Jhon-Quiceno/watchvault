import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/server/auth/session-cookie";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
