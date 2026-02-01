import { ReactNode } from "react";
import { Navigation } from "../Navigation";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
}

export function Layout({ children, title, action }: LayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30 pb-24 font-sans text-foreground">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold font-display tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title || "TormekCalc"}
          </h1>
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
