import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, User, LogOut, Camera, MessageSquare, Home, ShoppingBag, Calendar, TrendingUp, Settings, Menu, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { NotificationBell } from '@/components/NotificationBell';

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm gradient-text hidden sm:block">SkinMatch</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {user ? (
            <>
              <NavLink to="/dashboard" isActive={isActive('/dashboard')} icon={Home} label="Home" />
              <NavLink to="/scan" isActive={isActive('/scan')} icon={Camera} label="Scan" />
              <NavLink to="/product-scan" isActive={isActive('/product-scan')} icon={ShieldAlert} label="Product" />
              <NavLink to="/shop" isActive={isActive('/shop')} icon={ShoppingBag} label="Shop" />
              <NavLink to="/routine" isActive={isActive('/routine')} icon={Calendar} label="Routine" />
              <NavLink to="/progress" isActive={isActive('/progress')} icon={TrendingUp} label="Progress" />
              <NavLink to="/chat" isActive={isActive('/chat')} icon={MessageSquare} label="Chat" />
              <div className="w-px h-6 bg-border mx-2" />
              <Link to="/settings">
                <Button variant={isActive('/settings') ? 'secondary' : 'ghost'} size="icon-sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <NotificationBell />
              <Link to="/profile">
                <Button variant={isActive('/profile') ? 'secondary' : 'ghost'} size="icon-sm">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Masuk</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Daftar</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center gap-1">
          {user ? (
            <>
              <NotificationBell />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 glass-strong">
                  <SheetHeader>
                    <SheetTitle className="text-left">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-1 mt-6">
                    <MobileNavLink to="/product-scan" icon={ShieldAlert} label="Product Scan" onClick={() => setMobileMenuOpen(false)} isActive={isActive('/product-scan')} />
                    <MobileNavLink to="/routine" icon={Calendar} label="Routine" onClick={() => setMobileMenuOpen(false)} isActive={isActive('/routine')} />
                    <MobileNavLink to="/progress" icon={TrendingUp} label="Progress" onClick={() => setMobileMenuOpen(false)} isActive={isActive('/progress')} />
                    <MobileNavLink to="/settings" icon={Settings} label="Settings" onClick={() => setMobileMenuOpen(false)} isActive={isActive('/settings')} />
                    <div className="border-t border-border my-4" />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Keluar
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Masuk</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Daftar</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  isActive: boolean;
  icon: React.ElementType;
  label: string;
}

const NavLink = ({ to, isActive, icon: Icon, label }: NavLinkProps) => (
  <Link to={to}>
    <Button variant={isActive ? 'secondary' : 'ghost'} size="sm" className="gap-1.5">
      <Icon className="h-4 w-4" />
      <span className="hidden xl:inline">{label}</span>
    </Button>
  </Link>
);

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

const MobileNavLink = ({ to, icon: Icon, label, onClick, isActive }: MobileNavLinkProps) => (
  <Link to={to} onClick={onClick}>
    <Button 
      variant={isActive ? 'secondary' : 'ghost'} 
      className="w-full justify-start gap-3 h-11"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Button>
  </Link>
);
