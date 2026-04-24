/**
 * PersonalizationCheck
 * ─────────────────────────────────────────────────────────────────────────
 * Scans subject + body for merge tags ({firstName}, {name}, {email},
 * {property}, {project}, etc.) and reports, per recipient, which tags
 * cannot be filled from the recipient record. Lets the user spot a missing
 * first name or property before sending — Gmail-style "this doesn't look
 * personalized" warning.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComposeRecipient } from "./LeadComposeDialog";

interface Props {
  subject: string;
  body: string;
  recipients: ComposeRecipient[];
  /** Extra per-recipient data the parent can pass (property, project name, etc.). Optional. */
  extra?: Record<string, Record<string, string | null | undefined>>;
}

/** Match every {tag} or {$tag} in the source. */
function extractTags(src: string): string[] {
  const out = new Set<string>();
  const re = /\{\$?([a-zA-Z][a-zA-Z0-9_]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    out.add(m[1].toLowerCase());
  }
  return Array.from(out);
}

function valueForTag(
  tag: string,
  r: ComposeRecipient,
  extra?: Record<string, string | null | undefined>,
): string | null {
  const t = tag.toLowerCase();
  const name = (r.name || "").trim();
  const firstName = name ? name.split(/\s+/)[0] : "";
  switch (t) {
    case "email":
      return r.email || null;
    case "name":
      return name || null;
    case "firstname":
    case "first_name":
      return firstName || null;
    case "lastname":
    case "last_name": {
      const parts = name.split(/\s+/);
      return parts.length > 1 ? parts.slice(1).join(" ") : null;
    }
    default:
      return extra?.[t]?.toString().trim() || null;
  }
}

const FRIENDLY: Record<string, string> = {
  firstname: "first name",
  first_name: "first name",
  lastname: "last name",
  last_name: "last name",
  property: "property",
  project: "project",
  city: "city",
  neighborhood: "neighborhood",
};

export function PersonalizationCheck({ subject, body, recipients, extra }: Props) {
  const [expanded, setExpanded] = useState(false);

  const tags = useMemo(() => extractTags(`${subject}\n${body}`), [subject, body]);

  const issues = useMemo(() => {
    if (tags.length === 0 || recipients.length === 0) return [];
    return recipients
      .map((r) => {
        const missing = tags.filter((t) => !valueForTag(t, r, extra?.[r.email]));
        return { recipient: r, missing };
      })
      .filter((x) => x.missing.length > 0);
  }, [tags, recipients, extra]);

  if (tags.length === 0) return null;

  const total = recipients.length;
  const affected = issues.length;
  const allGood = affected === 0;

  return (
    <div
      className={cn(
        "rounded-md border text-xs",
        allGood
          ? "border-success/30 bg-success/5"
          : "border-warning/40 bg-warning/5",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {allGood ? (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
          )}
          <span className="truncate text-[11px] font-medium">
            {allGood ? (
              <>Personalization looks good for all {total} recipients</>
            ) : (
              <>
                Missing fields for{" "}
                <span className="text-warning-strong dark:text-warning">
                  {affected} of {total}
                </span>{" "}
                recipients
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex flex-wrap gap-1">
            {tags.slice(0, 4).map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="h-4 px-1 font-mono text-[9px] uppercase"
              >
                {`{${t}}`}
              </Badge>
            ))}
            {tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{tags.length - 4}</span>
            )}
          </div>
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-2.5 py-2">
          {allGood ? (
            <div className="flex items-center gap-1.5 text-[11px] text-success-strong dark:text-success">
              <CheckCircle2 className="h-3 w-3" />
              Every merge tag resolves for every recipient.
            </div>
          ) : (
            <ul className="max-h-[160px] space-y-1 overflow-auto pr-1">
              {issues.slice(0, 50).map(({ recipient, missing }) => (
                <li
                  key={recipient.email}
                  className="flex items-center justify-between gap-2 rounded border border-warning/20 bg-background/50 px-2 py-1"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <UserX className="h-3 w-3 shrink-0 text-warning" />
                    <span className="truncate text-[11px]">
                      {recipient.name || (
                        <em className="text-muted-foreground">no name</em>
                      )}{" "}
                      <span className="text-muted-foreground">
                        &lt;{recipient.email}&gt;
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {missing.map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="h-4 border-warning/40 px-1 font-mono text-[9px] text-warning-strong dark:text-warning"
                      >
                        {FRIENDLY[t] || t}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
              {issues.length > 50 && (
                <li className="px-1 text-[10px] text-muted-foreground">
                  +{issues.length - 50} more recipients with missing fields
                </li>
              )}
            </ul>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Tip: missing values fall back to a safe default (e.g.{" "}
            <code className="font-mono">{"{firstName}"}</code> →{" "}
            <code className="font-mono">there</code>) so the email still sends.
          </p>
        </div>
      )}
    </div>
  );
}
