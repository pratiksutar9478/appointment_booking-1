"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin",              label: "Dashboard",    icon: "📊" },
  { href: "/admin/appointments", label: "Appointments", icon: "📅" },
  { href: "/admin/doctors",      label: "Doctors",      icon: "👨‍⚕️" },
  { href: "/admin/reminders",    label: "Reminders",    icon: "🔔" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-blue-900 text-white flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-blue-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="font-bold text-white text-base leading-tight">
            AppointCare<br />
            <span className="text-blue-300 text-xs font-normal">Admin Panel</span>
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-700 text-white"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-blue-800">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-blue-300 hover:text-white transition-colors"
        >
          ← Back to website
        </Link>
      </div>
    </aside>
  );
}
