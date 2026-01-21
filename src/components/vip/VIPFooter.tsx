import { Link } from "react-router-dom";

export const VIPFooter = () => {
  return (
    <footer className="py-8 px-4 bg-background border-t border-border">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Presale Properties" className="h-8" />
        </Link>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </nav>

        <p className="text-sm text-muted-foreground">
          © 2026 Presale Properties. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
