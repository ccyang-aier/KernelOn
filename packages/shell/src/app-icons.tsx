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
import type { ComponentProps } from 'react';

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

export function AppIcon({ name, ...props }: ComponentProps<LucideIcon> & { name: string }) {
  switch (name) {
    case 'BookOpenCheck':
      return <BookOpenCheck {...props} />;
    case 'ChartSpline':
      return <ChartSpline {...props} />;
    case 'ClipboardCheck':
      return <ClipboardCheck {...props} />;
    case 'FolderKanban':
      return <FolderKanban {...props} />;
    case 'Handshake':
      return <Handshake {...props} />;
    case 'Milestone':
      return <Milestone {...props} />;
    case 'UserRoundCheck':
      return <UserRoundCheck {...props} />;
    default:
      return <AppWindow {...props} />;
  }
}
