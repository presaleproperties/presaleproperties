export interface OffMarketListingForm {
  linked_project_slug: string;
  linked_project_name: string;
  developer_id: string | null;
  developer_name: string;
  pricing_sheet_url: string;
  brochure_url: string;
  info_sheet_url: string;
  deposit_structure: string;
  deposit_percentage: number | null;
  incentives: string;
  incentive_expiry: string | null;
  vip_incentives: string;
  parking_type: string;
  parking_included: boolean;
  parking_cost: number | null;
  storage_included: boolean;
  storage_cost: number | null;
  storage_size: string;
  locker_included: boolean;
  locker_cost: number | null;
  completion_date: string;
  construction_stage: string;
  assignment_allowed: boolean;
  assignment_fee: string;
  available_upgrades: { name: string; price: string }[];
  additional_notes: string;
  photo_urls: string[];
  floorplan_urls: string[];
  access_level: string;
  auto_approve_access: boolean;
}

export interface OffMarketUnit {
  id?: string;
  unit_number: string;
  unit_name: string;
  unit_type: string;
  floor_level: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price: number;
  parking_included: boolean;
  parking_type: string;
  storage_included: boolean;
  locker_included: boolean;
  orientation: string;
  view_type: string;
  floorplan_url: string;
  has_unit_incentive: boolean;
  unit_incentive: string;
  status: string;
  inclusions: string[];
  display_order: number;
}
