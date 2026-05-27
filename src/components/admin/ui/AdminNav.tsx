'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Image, Settings, Home, ChevronRight, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/dashboard/pages', label: 'Pages', icon: FileText },
  { href: '/admin/dashboard/media', label: 'Media Library', icon: Image },
  { href: '/admin/dashboard/analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all group ${
              isActive
                ? 'bg-[#FFC300]/10 text-[#FFC300] border border-[#FFC300]/20'
                : 'text-[#8A8780] hover:text-[#F0EDE6] hover:bg-[#0e0e14] border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="flex-1">{item.label}</span>
            {isActive && <ChevronRight className="w-3 h-3" />}
          </Link>
        );
      })}
    </nav>
  );
}
