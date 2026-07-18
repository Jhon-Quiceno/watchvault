"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Light/dark toggle. Renders a stable placeholder until mounted so the
 * server and client markup match (next-themes resolves theme on the client).
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // Gate on `mounted`, not just `resolvedTheme`: next-themes resolves the
  // real theme before hydration finishes, so reading it unconditionally
  // renders a different aria-label server- vs client-side on first paint.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && !isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
