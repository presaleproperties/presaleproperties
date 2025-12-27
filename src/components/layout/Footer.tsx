import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-8 sm:py-12 px-4">
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4 col-span-2 sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                Assignment<span className="text-primary">Hub</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Vancouver's premier marketplace for presale condo assignments.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">Explore</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/assignments" className="hover:text-foreground transition-colors">
                  All Assignments
                </Link>
              </li>
              <li>
                <Link to="/assignments?city=Vancouver" className="hover:text-foreground transition-colors">
                  Vancouver
                </Link>
              </li>
              <li>
                <Link to="/assignments?city=Burnaby" className="hover:text-foreground transition-colors">
                  Burnaby
                </Link>
              </li>
              <li>
                <Link to="/assignments?city=Surrey" className="hover:text-foreground transition-colors">
                  Surrey
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold">For Agents</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link to="/agents" className="hover:text-foreground transition-colors">
                  List Your Assignment
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">
                  Agent Login
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4 col-span-2 sm:col-span-1">
            <h4 className="text-xs sm:text-sm font-semibold">Contact</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>info@assignmenthub.ca</li>
              <li>Vancouver, BC</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} AssignmentHub Vancouver. All rights reserved.
          </p>
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}