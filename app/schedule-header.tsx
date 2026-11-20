import { Compass, Gamepad2 } from "lucide-react";
import type { Language } from "@/lib/schedule";
import { Ink } from "./editorial-ink";

export function ScheduleHeader({ language, compact, onLanguageChange }: {
  language: Language;
  compact: boolean;
  onLanguageChange: (language: Language) => void;
}) {
  const ja = language === "ja";
  return <header className="island-header" data-board={compact || undefined}>
    <div className="island-header-inner">
      <div className="island-brand">
        {compact
          ? <img className="island-board-package" src="/project/games/series/01/cover-small.webp" alt="" width={136} height={170} />
          : <span className="island-brand-mark"><Compass size={24} strokeWidth={1.8} aria-hidden="true" /></span>}
        {compact ? <img className="island-board-wordmark"
          src={ja ? "/project/island/wordmark-ja.webp" : "/project/island/wordmark-en.webp"}
          alt={ja ? "Sri Lankaプロジェクト" : "Sri Lanka Project"}
          width={ja ? 710 : 720} height={ja ? 387 : 409} />
          : <span><strong>Sri Lanka Project</strong><small><Ink text={ja ? "プロジェクト日程調整" : "Team scheduling"} /></small></span>}
      </div>
      <div className="island-header-actions">
        <a href="/games" referrerPolicy="same-origin" className="island-games-link">
          <Gamepad2 size={19} aria-hidden="true" />
          {ja ? <img src="/project/games/release-wordmark.webp" alt="発売ゲーム" width={1024} height={252} /> : <span>Game releases</span>}
        </a>
        <nav className="island-language" aria-label={ja ? "表示言語" : "Display language"}>
          {(["ja", "en"] as const).map(lang =>
            <button type="button" key={lang} lang={lang} aria-pressed={language === lang} onClick={() => onLanguageChange(lang)}>
              <Ink text={lang === "ja" ? "日本語" : "EN"} />
            </button>)}
        </nav>
      </div>
    </div>
  </header>;
}
