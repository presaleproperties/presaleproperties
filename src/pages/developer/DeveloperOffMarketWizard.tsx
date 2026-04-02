import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, Send } from "lucide-react";
import { WizardStep1 } from "@/components/admin/off-market/WizardStep1";
import { WizardStep2 } from "@/components/admin/off-market/WizardStep2";
import { WizardStep3 } from "@/components/admin/off-market/WizardStep3";
import { WizardProgress } from "@/components/admin/off-market/WizardProgress";
import type { OffMarketListingForm, OffMarketUnit } from "@/components/admin/off-market/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Package, DollarSign, FileText } from "lucide-react";

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

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-500",
  reserved: "bg-yellow-500/10 text-yellow-500",
  sold: "bg-red-500/10 text-red-400",
  hold: "bg-muted text-muted-foreground",
};

export default function DeveloperOffMarketWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const isEdit = !!id;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OffMarketListingForm>({ ...defaultForm });
  const [units, setUnits] = useState<OffMarketUnit[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [developerProfile, setDeveloperProfile] = useState<any>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [listingStatus, setListingStatus] = useState<string>("draft");
  const [projectPreview, setProjectPreview] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/developer/login");
    if (user) loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    if (!user) return;
    const { data: dev } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!dev || dev.verification_status !== "approved") {
      navigate("/developer");
      return;
    }
    setDeveloperProfile(dev);

    // Find matching developer in developers table
    const { data: devRow } = await supabase
      .from("developers")
      .select("id")
      .ilike("name", `%${dev.company_name}%`)
      .maybeSingle();

    const devId = devRow?.id || null;
    setDeveloperId(devId);
    setForm(f => ({ ...f, developer_id: devId, developer_name: dev.company_name }));

    if (isEdit && id) {
      const { data, error } = await supabase
        .from("off_market_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Listing not found");
        navigate("/developer");
        return;
      }
      // Verify ownership
      if (data.developer_name?.toLowerCase() !== dev.company_name.toLowerCase() && data.developer_id !== devId) {
        toast.error("Access denied");
        navigate("/developer");
        return;
      }
      setListingStatus(data.status || "draft");
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

      const { data: unitData } = await supabase
        .from("off_market_units")
        .select("*")
        .eq("listing_id", id)
        .order("display_order");
      setUnits(
        (unitData || []).map((u: any) => ({
          id: u.id,
          unit_number: u.unit_number,
          unit_name: u.unit_name || "",
          unit_type: u.unit_type || "",
          floor_level: u.floor_level,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          sqft: u.sqft,
          price: u.price,
          parking_included: u.parking_included || false,
          parking_type: u.parking_type || "",
          storage_included: u.storage_included || false,
          locker_included: u.locker_included || false,
          orientation: u.orientation || "",
          view_type: u.view_type || "",
          floorplan_url: u.floorplan_url || "",
          has_unit_incentive: u.has_unit_incentive || false,
          unit_incentive: u.unit_incentive || "",
          status: u.status || "available",
          inclusions: u.inclusions || [],
          display_order: u.display_order || 0,
        }))
      );
    }
    setLoading(false);
  };

  const saveListing = async (submitForReview: boolean) => {
    setSaving(true);
    try {
      const payload: any = {
        linked_project_slug: form.linked_project_slug,
        linked_project_name: form.linked_project_name,
        developer_id: developerId || null,
        developer_name: developerProfile?.company_name || form.developer_name || null,
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
        access_level: "teaser",
        auto_approve_access: false,
        status: submitForReview ? "pending_review" : "draft",
      };

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
        if (isEdit) {
          await supabase.from("off_market_units").delete().eq("listing_id", listingId);
        }
        if (units.length > 0) {
          const unitRows = units.map((u, i) => ({
            listing_id: listingId,
            developer_id: developerId || null,
            unit_number: u.unit_number,
            unit_name: u.unit_name || null,
            unit_type: u.unit_type || null,
            floor_level: u.floor_level,
            bedrooms: u.bedrooms,
            bathrooms: u.bathrooms,
            sqft: u.sqft,
            price: u.price,
            parking_included: u.parking_included,
            parking_type: u.parking_type || null,
            storage_included: u.storage_included,
            locker_included: u.locker_included,
            orientation: u.orientation || null,
            view_type: u.view_type || null,
            floorplan_url: u.floorplan_url || null,
            has_unit_incentive: u.has_unit_incentive,
            unit_incentive: u.unit_incentive || null,
            status: u.status,
            inclusions: u.inclusions,
            display_order: i,
          }));
          const { error } = await supabase.from("off_market_units").insert(unitRows);
          if (error) throw error;
        }
      }

      if (submitForReview) {
        toast.success("Inventory submitted for review! Our team will review it within 24-48 hours.");
      } else {
        toast.success("Draft saved!");
      }
      navigate("/developer");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DeveloperPortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DeveloperPortalLayout>
    );
  }

  // Read-only states for pending_review or published
  if (isEdit && (listingStatus === "pending_review" || listingStatus === "published")) {
    return (
      <DeveloperPortalLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {listingStatus === "pending_review" ? "Under Review" : "Live Listing"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {listingStatus === "pending_review"
              ? "This listing is being reviewed by our team. You'll be notified when it's published."
              : "This listing is live. Contact info@presaleproperties.com to request changes."}
          </p>
          <Badge className={listingStatus === "pending_review" ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"}>
            {listingStatus === "pending_review" ? "Pending Review" : "Published"}
          </Badge>
          <div className="mt-8">
            <Link to="/developer">
              <Button variant="outline" className="rounded-xl">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </DeveloperPortalLayout>
    );
  }

  // DevStep4 removed — now using shared WizardStep3 with preview

  return (
    <DeveloperPortalLayout>
      <div className="px-6 md:px-10 py-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/developer">
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Inventory" : "Add Off-Market Inventory"}</h1>
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
              showAccessSettings={false}
            />
          )}
        </div>
      </div>
    </DeveloperPortalLayout>
  );
}
