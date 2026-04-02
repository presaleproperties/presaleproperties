import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { WizardStep1 } from "@/components/admin/off-market/WizardStep1";
import { WizardStep2 } from "@/components/admin/off-market/WizardStep2";
import { WizardStep3 } from "@/components/admin/off-market/WizardStep3";
import { WizardProgress } from "@/components/admin/off-market/WizardProgress";
import type { OffMarketListingForm, OffMarketUnit } from "@/components/admin/off-market/types";

const defaultForm: OffMarketListingForm = {
  linked_project_slug: "",
  linked_project_name: "",
  developer_id: null,
  developer_name: "",
  pricing_sheet_url: "",
  brochure_url: "",
  info_sheet_url: "",
  deposit_structure: "",
  deposit_percentage: null,
  incentives: "",
  incentive_expiry: null,
  vip_incentives: "",
  parking_type: "",
  parking_included: false,
  parking_cost: null,
  storage_included: false,
  storage_cost: null,
  storage_size: "",
  locker_included: false,
  locker_cost: null,
  completion_date: "",
  construction_stage: "",
  assignment_allowed: false,
  assignment_fee: "",
  available_upgrades: [],
  additional_notes: "",
  photo_urls: [],
  floorplan_urls: [],
  access_level: "teaser",
  auto_approve_access: false,
};

export default function AdminOffMarketWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OffMarketListingForm>({ ...defaultForm });
  const [units, setUnits] = useState<OffMarketUnit[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [projectPreview, setProjectPreview] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("off_market_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) { toast.error("Listing not found"); navigate("/admin/off-market"); return; }
      setForm({
        linked_project_slug: data.linked_project_slug || "",
        linked_project_name: data.linked_project_name || "",
        developer_id: data.developer_id,
        developer_name: data.developer_name || "",
        pricing_sheet_url: data.pricing_sheet_url || "",
        brochure_url: data.brochure_url || "",
        info_sheet_url: data.info_sheet_url || "",
        deposit_structure: data.deposit_structure || "",
        deposit_percentage: data.deposit_percentage,
        incentives: data.incentives || "",
        incentive_expiry: data.incentive_expiry,
        vip_incentives: data.vip_incentives || "",
        parking_type: data.parking_type || "",
        parking_included: data.parking_included || false,
        parking_cost: data.parking_cost,
        storage_included: data.storage_included || false,
        storage_cost: data.storage_cost,
        storage_size: data.storage_size || "",
        locker_included: data.locker_included || false,
        locker_cost: data.locker_cost,
        completion_date: data.completion_date || "",
        construction_stage: data.construction_stage || "",
        assignment_allowed: data.assignment_allowed || false,
        assignment_fee: data.assignment_fee || "",
        available_upgrades: (data.available_upgrades as any[]) || [],
        additional_notes: data.additional_notes || "",
        photo_urls: data.photo_urls || [],
        floorplan_urls: data.floorplan_urls || [],
        access_level: data.access_level || "teaser",
        auto_approve_access: data.auto_approve_access || false,
      });

      // Load project preview
      if (data.linked_project_slug) {
        const { data: proj } = await supabase
          .from("presale_projects")
          .select("id, name, slug, city, neighborhood, developer_name, project_type, completion_year, featured_image, map_lat, map_lng, address")
          .eq("slug", data.linked_project_slug)
          .maybeSingle();
        if (proj) setProjectPreview(proj);
      }

      const { data: unitData } = await supabase
        .from("off_market_units")
        .select("*")
        .eq("listing_id", id)
        .order("display_order");
      setUnits(
        (unitData || []).map((u: any) => ({
          id: u.id, unit_number: u.unit_number, unit_name: u.unit_name || "",
          unit_type: u.unit_type || "", floor_level: u.floor_level,
          bedrooms: u.bedrooms, bathrooms: u.bathrooms, sqft: u.sqft, price: u.price,
          parking_included: u.parking_included || false, parking_type: u.parking_type || "",
          storage_included: u.storage_included || false, locker_included: u.locker_included || false,
          orientation: u.orientation || "", view_type: u.view_type || "",
          floorplan_url: u.floorplan_url || "", has_unit_incentive: u.has_unit_incentive || false,
          unit_incentive: u.unit_incentive || "", status: u.status || "available",
          inclusions: u.inclusions || [], display_order: u.display_order || 0,
        }))
      );
      setLoading(false);
    })();
  }, [id]);

  const saveListing = async (publish: boolean) => {
    setSaving(true);
    try {
      const payload: any = {
        linked_project_slug: form.linked_project_slug,
        linked_project_name: form.linked_project_name,
        developer_id: form.developer_id || null,
        developer_name: form.developer_name || null,
        pricing_sheet_url: form.pricing_sheet_url || null,
        brochure_url: form.brochure_url || null,
        info_sheet_url: form.info_sheet_url || null,
        deposit_structure: form.deposit_structure || null,
        deposit_percentage: form.deposit_percentage,
        incentives: form.incentives || null,
        incentive_expiry: form.incentive_expiry,
        vip_incentives: form.vip_incentives || null,
        parking_type: form.parking_type || null,
        parking_included: form.parking_included,
        parking_cost: form.parking_cost,
        storage_included: form.storage_included,
        storage_cost: form.storage_cost,
        storage_size: form.storage_size || null,
        locker_included: form.locker_included,
        locker_cost: form.locker_cost,
        completion_date: form.completion_date || null,
        construction_stage: form.construction_stage || null,
        assignment_allowed: form.assignment_allowed,
        assignment_fee: form.assignment_fee || null,
        available_upgrades: form.available_upgrades,
        additional_notes: form.additional_notes || null,
        photo_urls: form.photo_urls,
        floorplan_urls: form.floorplan_urls,
        access_level: form.access_level,
        auto_approve_access: form.auto_approve_access,
        status: publish ? "published" : "draft",
      };
      if (publish) payload.published_at = new Date().toISOString();

      let listingId = id;
      if (isEdit) {
        const { error } = await supabase.from("off_market_listings").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("off_market_listings").insert(payload).select("id").single();
        if (error) throw error;
        listingId = data.id;
      }

      if (listingId) {
        if (isEdit) await supabase.from("off_market_units").delete().eq("listing_id", listingId);
        if (units.length > 0) {
          const unitRows = units.map((u, i) => ({
            listing_id: listingId, developer_id: form.developer_id || null,
            unit_number: u.unit_number, unit_name: u.unit_name || null,
            unit_type: u.unit_type || null, floor_level: u.floor_level,
            bedrooms: u.bedrooms, bathrooms: u.bathrooms, sqft: u.sqft, price: u.price,
            parking_included: u.parking_included, parking_type: u.parking_type || null,
            storage_included: u.storage_included, locker_included: u.locker_included,
            orientation: u.orientation || null, view_type: u.view_type || null,
            floorplan_url: u.floorplan_url || null, has_unit_incentive: u.has_unit_incentive,
            unit_incentive: u.unit_incentive || null, status: u.status,
            inclusions: u.inclusions, display_order: i,
          }));
          const { error } = await supabase.from("off_market_units").insert(unitRows);
          if (error) throw error;
        }
      }

      toast.success(publish ? "Listing published!" : "Draft saved!");
      navigate("/admin/off-market");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 md:px-10 py-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/off-market">
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Listing" : "New Off-Market Listing"}</h1>
        </div>

        <WizardProgress currentStep={step} />

        <div className="mt-8">
          {step === 1 && (
            <WizardStep1
              form={form}
              setForm={setForm}
              projectPreview={projectPreview}
              setProjectPreview={setProjectPreview}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <WizardStep2
              units={units}
              setUnits={setUnits}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <WizardStep3
              form={form}
              setForm={setForm}
              units={units}
              saving={saving}
              onBack={() => setStep(2)}
              onSaveDraft={() => saveListing(false)}
              onPublish={() => saveListing(true)}
              projectPreview={projectPreview}
              showAccessSettings={true}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
