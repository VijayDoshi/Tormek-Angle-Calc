import { ReactNode } from "react";
import { Navigation } from "../Navigation";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}

export function Layout({ children, title, action }: LayoutProps) {
  return (
    <div className="min-h-screen pb-24 font-sans text-foreground">
      <header className="sticky top-0 z-40 w-full bg-background/70 backdrop-blur-xl border-b border-border/80">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.7)]" />
            <h1 className="stencil text-2xl text-foreground/95">
              {title || "Perfect Edge"}
            </h1>
          </div>
          {action}
        </div>
      </header>
      
      <main className="max-w-md mx-auto px-4 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </main>
      
      <Navigation />
    </div>
  );
}
