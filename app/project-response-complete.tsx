import { Check } from "lucide-react";
import type { Language } from "@/lib/schedule";
import "./project-response-complete.css";

export function ProjectResponseComplete({ language, animate = true }: { language: Language; animate?: boolean }) {
  return (
    <div className="project-response-complete" role="status" lang={language} data-animate={animate || undefined}>
      <span className="project-response-complete-check" aria-hidden="true"><Check size={17} strokeWidth={3} /></span>
      <strong>{language === "ja" ? "回答完了" : "You've answered every time slot"}</strong>
      <span className="project-response-complete-art" aria-hidden="true">
        <img src="/project/island/elephant.webp" alt="" width={320} height={320} decoding="async" />
      </span>
    </div>
  );
}
