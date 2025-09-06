import { type ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

export function Layout({ children, header, footer }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {header && <header className="bg-card shadow-sm border-b">{header}</header>}
      <main className="flex-1 p-4">{children}</main>
      {footer && <footer className="bg-muted p-4 border-t">{footer}</footer>}
    </div>
  );
}