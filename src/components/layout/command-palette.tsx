"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { navSections } from "@/config/navigation";
import { useUiStore } from "@/stores/ui-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

/**
 * Global Ctrl/Cmd+K command palette. Navigation entries mirror the sidebar
 * (single source in `@/config/navigation`) and a small actions group covers
 * shell-level commands like theme switching.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  function runCommand(action: () => void) {
    setOpen(false);
    action();
  }

  const isDark = resolvedTheme === "dark";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar o ir a…" />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        {navSections.map((section) => (
          <CommandGroup key={section.id} heading={section.label}>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${section.label}`}
                  onSelect={() => runCommand(() => router.push(item.href))}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Acciones">
          <CommandItem
            value="Cambiar tema claro oscuro"
            onSelect={() => runCommand(() => setTheme(isDark ? "light" : "dark"))}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span>Cambiar a tema {isDark ? "claro" : "oscuro"}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
