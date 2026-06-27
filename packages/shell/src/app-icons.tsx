import {
  AppWindow,
  BookOpenCheck,
  ChartSpline,
  ClipboardCheck,
  FolderKanban,
  Handshake,
  Milestone,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  AppWindow,
  BookOpenCheck,
  ChartSpline,
  ClipboardCheck,
  FolderKanban,
  Handshake,
  Milestone,
  UserRoundCheck,
};

export function resolveAppIcon(name: string): LucideIcon {
  return icons[name] ?? AppWindow;
}
