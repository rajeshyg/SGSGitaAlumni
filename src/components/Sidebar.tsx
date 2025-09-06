import { type ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-64 bg-card text-card-foreground p-4 border-r">
      <nav>
        <ul className="space-y-2">
          {children}
        </ul>
      </nav>
    </aside>
  );
}

interface SidebarItemProps {
  href: string;
  children: ReactNode;
}

export function SidebarItem({ href, children }: SidebarItemProps) {
  return (
    <li>
      <a href={href} className="block p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors">
        {children}
      </a>
    </li>
  );
}