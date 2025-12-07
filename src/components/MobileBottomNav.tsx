import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, MessageSquare, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Camera, label: 'Scan', path: '/scan' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: ShoppingBag, label: 'Shop', path: '/shop' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Only show for authenticated users
  if (!user) return null;

  // Don't show on auth pages
  const hideOnPaths = ['/', '/login', '/register'];
  if (hideOnPaths.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none h-20 -top-4" />
      
      {/* Nav container */}
      <div className="relative glass-strong border-t-0 rounded-t-3xl mx-2 mb-2 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-200 touch-manipulation",
                  isActive 
                    ? "bg-primary/15 text-primary" 
                    : "text-muted-foreground active:scale-95"
                )}
              >
                <div className={cn(
                  "relative",
                  isActive && "animate-scale-in"
                )}>
                  <Icon 
                    className={cn(
                      "h-5 w-5 transition-all",
                      isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {isActive && (
                    <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg -z-10" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
