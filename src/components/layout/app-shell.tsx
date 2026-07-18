import { CommandPalette } from "@/components/layout/command-palette";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

/**
 * The application shell every route renders inside: persistent sidebar,
 * sticky top bar, and the global command palette. The main column scrolls
 * independently while the chrome stays fixed.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-app flex min-h-screen">
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
