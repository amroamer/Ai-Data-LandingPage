import {
  Brain,
  Cloud,
  Database,
  DatabaseZap,
  Factory,
  GraduationCap,
  Layers,
  Lightbulb,
  Network,
  Package,
  Presentation,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Warehouse,
  Workflow,
  Zap,
} from "lucide-react";

/**
 * Mapping of icon names (the strings stored in `products.icon_name`) to
 * actual Lucide icon components. To add a new icon: import it above and
 * add an entry here. The admin UI lets users pick from `iconOptions()`.
 *
 * The `Package` fallback is returned by `getProductIcon()` for unknown
 * names so a typo never crashes the renderer.
 */
const ICONS = {
  Brain,
  Cloud,
  Database,
  DatabaseZap,
  Factory,
  GraduationCap,
  Layers,
  Lightbulb,
  Network,
  Package,
  Presentation,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Warehouse,
  Workflow,
  Zap,
};

/** Resolve an icon name to its component. Returns Package for unknown names. */
export function getProductIcon(name) {
  return ICONS[name] || Package;
}

/** All registered icon names, sorted alphabetically. Use to build a picker. */
export function iconOptions() {
  return Object.keys(ICONS).sort();
}
