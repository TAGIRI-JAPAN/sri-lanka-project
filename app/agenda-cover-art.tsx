import type { ProjectAvatar } from "@/lib/project";
import { PROJECT_ART } from "@/lib/project-art";
import "./agenda-cover-art.css";

type Postcard = readonly [keyof typeof PROJECT_ART, keyof typeof PROJECT_ART];
const postcards: Record<ProjectAvatar, Postcard> = {
  "01": ["b03", "t03"],
  "02": ["b02", "t02"],
  "03": ["b05", "p04"],
  "04": ["b01", "t06"],
  "05": ["m01", "t04"],
  "06": ["m02", "t05"],
  "07": ["b04", "p05"],
  "08": ["b05", "p03"],
  "09": ["b02", "t01"],
};

export function AgendaCoverArt({ avatar }: { avatar: ProjectAvatar | null }) {
  const [landscape, detail] = avatar ? postcards[avatar] : ["b03", "p06"] as const;
  return <div className="agenda-postcard" aria-hidden="true">
    <img className="agenda-postcard-land" src={PROJECT_ART[landscape]} alt="" width={380} height={200} loading="lazy" />
    <img className="agenda-postcard-subject" src={PROJECT_ART[detail]} alt="" width={116} height={116} loading="lazy" />
  </div>;
}
