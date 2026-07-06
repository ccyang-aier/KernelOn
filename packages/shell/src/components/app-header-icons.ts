import {
  Check,
  Circle,
  Columns3,
  Download,
  Edit3,
  Files,
  KeyRound,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  PanelTop,
  RefreshCw,
  Save,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Settings,
  Upload,
  type LucideIcon,
} from 'lucide-react';

export function resolveAppHeaderIcon(icon: string): LucideIcon {
  return appHeaderIcons[icon] ?? Circle;
}

const appHeaderIcons: Record<string, LucideIcon> = {
  Check,
  Columns3,
  Download,
  Edit3,
  Files,
  KeyRound,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  PanelTop,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Upload,
};
