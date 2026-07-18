"use client";

import { usePathname } from "next/navigation";

import { CommandPalette } from "@/components/layout/command-palette";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

/**
 * The application shell every route renders inside: persistent sidebar,
 * sticky top bar, and the global command palette. The main column scrolls
 * independently while the chrome stays fixed.
 *
 * `/login` opts out of the shell — it's a standalone screen, not a page
 * inside the app, so showing nav links a signed-out visitor can't use yet
 * would be misleading.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="bg-app flex min-h-screen">
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && <DemoBanner />}
        <Topbar />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}

/** Persistent notice on the public demo deployment — extra element, not a Topbar resize. */
function DemoBanner() {
  return (
    <div className="bg-gradient-brand flex h-8 shrink-0 items-center justify-center px-4 text-center text-xs font-medium text-white">
      🎬 Estás viendo una demo pública de Watchvault — los cambios no se guardan.
    </div>
  );
}
