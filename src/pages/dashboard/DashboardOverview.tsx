import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { Card } from "@/components/ui/card";
import { PenTool, Megaphone, FolderOpen, FileText, Mail, User, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  {
    label: "Email Builder",
    description: "Design and send branded campaigns to your clients.",
    href: "/dashboard/email-builder",
    icon: PenTool,
  },
  {
    label: "Marketing Hub",
    description: "Templates, pitch decks, and social posts in one place.",
    href: "/dashboard/marketing-hub",
    icon: Megaphone,
  },
  {
    label: "Project Docs",
    description: "Floorplans, brochures, and pricing for every project.",
    href: "/dashboard/projects",
    icon: FolderOpen,
  },
  {
    label: "My Listings",
    description: "Create and manage your assignment listings.",
    href: "/dashboard/listings",
    icon: FileText,
  },
  {
    label: "Email Tracking",
    description: "See opens, clicks, and engagement on every send.",
    href: "/dashboard/emails",
    icon: Mail,
  },
  {
    label: "Profile",
    description: "Update your name, photo, and contact details.",
    href: "/dashboard/profile",
    icon: User,
  },
];

export default function DashboardOverview() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header — quick actions + install CTA */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your marketing toolkit — everything you need to win more deals.
              </p>
            </div>
            <QuickActions />
          </div>
          <div className="flex-shrink-0 sm:pt-1">
            <InstallAppButton
              appName="Agent"
              manifestPath="/manifest-agent.json"
              startUrl="/dashboard"
              label="Install Agent App"
            />
          </div>
        </section>

        {/* Shortcut grid */}
        <section className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Tools
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHORTCUTS.map((s) => (
              <Link key={s.href} to={s.href} className="group">
                <Card
                  className={cn(
                    "p-5 h-full border-border/60 transition-all duration-200",
                    "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                    {s.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {s.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
