import {
  Briefcase,
  Heart,
  BookOpen,
  User,
  Gamepad2,
  Home,
  Users,
  Moon,
  MoreHorizontal,
} from 'lucide-react';
import type { Category } from '../types';
import { CATEGORY_COLORS } from '../types';

interface CategoryIconProps {
  category: Category;
  size?: number;
}

const iconMap: Record<Category, React.ComponentType<{ size?: number; color?: string }>> = {
  Work: Briefcase,
  Health: Heart,
  Learning: BookOpen,
  Personal: User,
  Entertainment: Gamepad2,
  Chores: Home,
  Social: Users,
  Sleep: Moon,
  Other: MoreHorizontal,
};

export function CategoryIcon({ category, size = 18 }: CategoryIconProps) {
  const Icon = iconMap[category];
  return <Icon size={size} color={CATEGORY_COLORS[category]} />;
}
