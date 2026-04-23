import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadApprovalsHub } from "@/components/admin/leads/LeadApprovalsHub";

export default function AdminLeadApprovals() {
  useEffect(() => {
    document.title = "Lead Approvals — Admin";
  }, []);
  return (
    <AdminLayout>
      <div className="container max-w-7xl py-6">
        <LeadApprovalsHub />
      </div>
    </AdminLayout>
  );
}
