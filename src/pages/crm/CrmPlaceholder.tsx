import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/crm/dashboard": "CRM Dashboard",
  "/crm/pipeline": "Pipeline",
  "/crm/email": "Email Center",
  "/crm/templates": "Templates",
  "/crm/automations": "Automations",
  "/crm/calendar": "Showings Calendar",
  "/crm/reports": "Reports",
  "/crm/settings": "CRM Settings",
};

export default function CrmPlaceholder() {
  const { pathname } = useLocation();
  const title = titles[pathname] || "CRM";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">Coming soon</p>
    </div>
  );
}
