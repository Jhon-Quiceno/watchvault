"use client";

import { Menu, Plus, Search } from "lucide-react";

import { useUiStore } from "@/stores/ui-store";
import { LinkButton } from "@/components/shared/link-button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Sticky top bar. Hosts the mobile nav trigger, the floating search field
 * that opens the command palette, and global actions. It stays glassy so
 * content scrolls beneath it without a hard visual seam.
 */
export function Topbar() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir navegación"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu />
      </Button>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group text-muted-foreground bg-muted/50 hover:bg-muted focus-visible:ring-ring/50 flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-transparent px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Buscar películas, series, anime…</span>
        <kbd className="bg-background/70 text-muted-foreground hidden rounded-md border px-1.5 py-0.5 font-mono text-[0.7rem] font-medium sm:inline-block">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <LinkButton href="/search" className="hidden gap-1.5 sm:inline-flex" size="sm">
          <Plus />
          <span>Agregar título</span>
        </LinkButton>
        <ThemeToggle />
      </div>
    </header>
  );
}
