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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors touch-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
