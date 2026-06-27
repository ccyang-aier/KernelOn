import {
  BookOpenCheck,
  ChartSpline,
  ClipboardCheck,
  FolderKanban,
  Handshake,
  Milestone,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpenCheck,
  ChartSpline,
  ClipboardCheck,
  FolderKanban,
  Handshake,
  Milestone,
  UserRoundCheck,
};

export function resolveAppIcon(icon: string): LucideIcon {
  return iconMap[icon] ?? FolderKanban;
}
