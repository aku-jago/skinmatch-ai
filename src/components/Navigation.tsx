import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, User, LogOut, Camera, MessageSquare, Home, ShoppingBag, Calendar, TrendingUp, Settings, Menu, X, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg md:text-xl">
          <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SkinMatch AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button 
                  variant={isActive('/dashboard') ? 'default' : 'ghost'} 
                  size="sm"
                  className="gap-1"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden xl:inline">Dashboard</span>
                </Button>
              </Link>
              <Link to="/scan">
                <Button 
                  variant={isActive('/scan') ? 'default' : 'ghost'} 
                  size="sm"
                  className="gap-1"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden xl:inline">Scan</span>
                </Button>
              </Link>
              <Link to="/product-scan">
                <Button 
                  variant={isActive('/product-scan') ? 'default' : 'ghost'} 
                  size="sm"
                  className="gap-1"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span className="hidden xl:inline">Product</span>
                </Button>
              </Link>
              <Link to="/shop">
                <Button 
                  variant={isActive('/shop') ? 'default' : 'ghost'} 
                  size="sm"
                  className="gap-1"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden xl:inline">Shop</span>
                </Button>
              </Link>
              <Link to="/routine">
                <Button 
                  variant={isActive('/routine') ? 'default' : 'ghost'} 
                  size="sm"
                  className="gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden xl:inline">Routine</span>
                </Button>
              </Link>
              <Link to="/progress">
                <Button 
                  variant={isActive('/progress') ? 'default' : 'ghost'} 
                  size="sm"
                  className="gap-1"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden xl:inline">Progress</span>
                </Button>
              </Link>
              <Link to="/chat">
                <Button 
                  variant={isActive('/chat') ? 'default' : 'ghost'} 
                  size="sm"
                  className="gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden xl:inline">Chat</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button 
                  variant={isActive('/settings') ? 'default' : 'ghost'} 
                  size="icon"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/profile">
                <Button 
                  variant={isActive('/profile') ? 'default' : 'ghost'} 
                  size="icon"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center gap-2">
          {user ? (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/dashboard') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <Home className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/scan" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/scan') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <Camera className="h-4 w-4" />
                      Skin Scan
                    </Button>
                  </Link>
                  <Link to="/product-scan" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/product-scan') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Product Scan
                    </Button>
                  </Link>
                  <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/shop') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Shop
                    </Button>
                  </Link>
                  <Link to="/routine" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/routine') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <Calendar className="h-4 w-4" />
                      Routine
                    </Button>
                  </Link>
                  <Link to="/progress" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/progress') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Progress
                    </Button>
                  </Link>
                  <Link to="/chat" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/chat') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <MessageSquare className="h-4 w-4" />
                      AI Chat
                    </Button>
                  </Link>
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/settings') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button 
                      variant={isActive('/profile') ? 'default' : 'ghost'} 
                      className="w-full justify-start gap-3"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-destructive"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Start</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};