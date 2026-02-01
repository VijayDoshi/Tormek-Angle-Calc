import { Link, useLocation } from "wouter";
import { Calculator, Settings, Disc } from "lucide-react";
import { clsx } from "clsx";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Calc", icon: Calculator },
    { href: "/wheels", label: "Wheels", icon: Disc },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href} className={clsx(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <div className={clsx(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <Icon className={clsx("w-6 h-6", isActive && "stroke-[2.5px]")} />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
