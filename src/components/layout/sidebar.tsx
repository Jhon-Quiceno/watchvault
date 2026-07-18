"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, Play, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { navSections, type NavItem } from "@/config/navigation";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1" aria-label="Inicio de Watchvault">
      <span className="bg-gradient-brand grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-lg shadow-brand/25">
        <Play className="size-4.5 fill-current" />
      </span>
      {!collapsed && (
        <span className="text-lg font-semibold tracking-tight">
          Watch<span className="text-gradient-brand">vault</span>
        </span>
      )}
    </Link>
  );
}

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="bg-gradient-brand absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon className={cn("size-4.5 shrink-0", active && "text-primary")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
      {navSections.map((section) => (
        <div key={section.id} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="text-muted-foreground/70 px-3 pb-1 text-xs font-semibold uppercase tracking-wider">
              {section.label}
            </p>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Desktop rail — collapses to icon-only width, persisted across reloads. */
export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="glass sticky top-0 hidden h-screen shrink-0 flex-col border-r lg:flex"
    >
      <div className="flex h-16 items-center px-3">
        <Brand collapsed={collapsed} />
      </div>
      <SidebarNav collapsed={collapsed} />
      <div className="border-border/60 border-t p-3">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          className={cn("w-full", collapsed && "w-auto")}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && <span>Colapsar</span>}
        </Button>
      </div>
    </motion.aside>
  );
}

/** Mobile slide-in drawer, controlled by the UI store. */
export function MobileSidebar() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="glass absolute inset-y-0 left-0 flex w-[280px] flex-col border-r"
          >
            <div className="flex h-16 items-center justify-between px-3">
              <Brand collapsed={false} />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerrar navegación"
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>
            <SidebarNav collapsed={false} onNavigate={() => setOpen(false)} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
