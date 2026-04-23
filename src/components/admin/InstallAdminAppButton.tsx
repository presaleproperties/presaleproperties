import { InstallAppButton } from "@/components/pwa/InstallAppButton";

export function InstallAdminAppButton() {
  return (
    <InstallAppButton
      appName="Admin"
      manifestPath="/manifest-admin.json"
      startUrl="/admin/leads"
    />
  );
}
