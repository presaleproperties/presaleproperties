import { buildAiEmailHtml, type AiEmailCopy } from "@/components/admin/AiEmailTemplate";

export interface SavedAsset {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export function getDisplayName(asset: SavedAsset): string {
  return asset.form_data?.copy?.subjectLine || asset.form_data?.vars?.subjectLine || asset.name;
}

export function getSavedHtml(asset: SavedAsset): string {
  const fd = asset.form_data;
  if (fd?.finalHtml) return fd.finalHtml;
  try {
    if (!fd?.vars) return "";
    const copy: AiEmailCopy = {
      headline: fd.vars?.headline || "",
      bodyCopy: fd.vars?.bodyCopy || "",
      subjectLine: fd.vars?.subjectLine || "",
      previewText: fd.vars?.previewText || "",
      incentiveText: fd.vars?.incentiveText || "",
      projectName: fd.vars?.projectName || asset.project_name || "",
      city: fd.vars?.city || "",
      neighborhood: fd.vars?.neighborhood || "",
      developerName: fd.vars?.developerName || "",
      startingPrice: fd.vars?.startingPrice || "",
      deposit: fd.vars?.deposit || "",
      completion: fd.vars?.completion || "",
    };
    return buildAiEmailHtml(copy);
  } catch {
    return "";
  }
}
