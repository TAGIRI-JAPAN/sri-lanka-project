import { projectLetteringAsset, type ProjectLetteringId, type ProjectLetteringTone } from "@/lib/project-lettering";

export function ProjectLettering({ id, label, tone = "dark", className }: {
  id: ProjectLetteringId;
  label: string;
  tone?: ProjectLetteringTone;
  className?: string;
}) {
  return <img {...projectLetteringAsset(id, tone)} className={className ? `project-lettering ${className}` : "project-lettering"} alt={label} decoding="async" />;
}
