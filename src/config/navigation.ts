import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  LayoutDashboard,
  Library,
  ListVideo,
  Search,
  Sparkles,
  User,
} from "lucide-react";

export interface NavItem {
  /** Stable identifier, also used as the command-palette key. */
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

/**
 * Primary application navigation. Each feature area from the product brief
 * maps to a route the App Shell renders inside. The sidebar and the command
 * palette both read from this single source so they never drift apart.
 */
export const navSections: NavSection[] = [
  {
    id: "browse",
    label: "Explorar",
    items: [
      { id: "dashboard", label: "Panel", href: "/", icon: LayoutDashboard },
      { id: "library", label: "Biblioteca", href: "/library", icon: Library },
      { id: "search", label: "Buscar", href: "/search", icon: Search },
    ],
  },
  {
    id: "organize",
    label: "Organizar",
    items: [
      { id: "lists", label: "Listas", href: "/lists", icon: ListVideo },
      { id: "stats", label: "Estadísticas", href: "/stats", icon: BarChart3 },
      {
        id: "recommendations",
        label: "Recomendaciones",
        href: "/recommendations",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "you",
    label: "Vos",
    items: [{ id: "profile", label: "Perfil", href: "/profile", icon: User }],
  },
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);
