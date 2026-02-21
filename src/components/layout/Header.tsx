import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const isLoggedIn = !!user;
  const userType = profile?.userType;

  const path = location.pathname;
  const inEmployeeApp =
    (path.startsWith("/employee") && !path.startsWith("/employee/register")) ||
    path.startsWith("/tests") ||
    path.startsWith("/certifications");
  const inEmployerApp =
    path.startsWith("/employer") && !path.startsWith("/employer/register");

  const inAppArea = isLoggedIn && (inEmployeeApp || inEmployerApp);

  const dashboardPath =
    userType === "employee" ? "/employee/dashboard" :
    userType === "employer" ? "/employer/dashboard" :
    "/";

  const handleSignOutClick = () => {
    setSignOutDialogOpen(true);
    setIsMenuOpen(false);
  };

  const handleSignOutConfirm = async () => {
    await signOut();
    setSignOutDialogOpen(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg-hero flex items-center justify-center shadow-md">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Retail<span className="text-primary">Hire</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!inAppArea ? (
            <>
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </nav>
              <div className="hidden md:flex items-center gap-3">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/">Get Started</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate(dashboardPath)}
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOutClick}
              >
                Sign Out
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            {!inAppArea ? (
              <nav className="flex flex-col gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="flex flex-col gap-2 mt-4 px-4">
                  <Button variant="outline" asChild>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button variant="gradient" asChild>
                    <Link to="/" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              </nav>
            ) : (
              <nav className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="justify-start px-4"
                  onClick={() => {
                    navigate(dashboardPath);
                    setIsMenuOpen(false);
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="justify-start mx-4"
                  onClick={handleSignOutClick}
                >
                  Sign Out
                </Button>
              </nav>
            )}
          </div>
        )}
      </div>

      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOutDialogOpen(false)}>
              No
            </Button>
            <Button onClick={handleSignOutConfirm}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
