import { CalendarDays, Check, CircleHelp, Compass, Link2, MapPin, Users } from "lucide-react";
import type { Language } from "@/lib/schedule";
import { Ink } from "./editorial-ink";

const assets = "/project/island/";

export function IslandHero({ language, onStart }: { language: Language; onStart: () => void }) {
  const ja = language === "ja";
  return <section className="island-hero" aria-labelledby="island-title">
    <picture className="island-hero-image">
      <source media="(max-width: 600px)" srcSet={assets + "palm-coast.webp"} />
      <img src={assets + "sigiriya-sunset.webp"} srcSet={assets + "sigiriya-sunset-small.webp 1100w, " + assets + "sigiriya-sunset.webp 1672w"}
        sizes="(min-width: 1332px) 1236px, 94vw" alt="" width={1672} height={941} fetchPriority="high" />
    </picture>
    <div className="island-hero-content">
      <h1 id="island-title">
        <img src={assets + (ja ? "wordmark-ja.webp" : "wordmark-en.webp")}
          alt={ja ? "Sri Lankaプロジェクト" : "Sri Lanka Project"}
          width={ja ? 710 : 720} height={ja ? 387 : 409} fetchPriority="high" />
      </h1>
      <p><Ink text={ja ? "海を越えて、予定を合わせよう。" : "Make time, across borders."} /></p>
      <button className="island-hero-action" type="button" onClick={onStart}>
        <CalendarDays size={19} aria-hidden="true" />
        <Ink text={ja ? "日程調整をはじめる" : "Find a time together"} />
      </button>
    </div>
    <p className="island-hero-place">
      <MapPin size={15} aria-hidden="true" />
      <span className="island-place-desktop">{ja ? "シーギリヤ・スリランカ" : "Sigiriya, Sri Lanka"}</span>
      <span className="island-place-mobile">{ja ? "スリランカの海岸" : "Sri Lanka’s coast"}</span>
    </p>
  </section>;
}

const steps = [
  {
    key: "invite", icon: Link2, scene: "galle-compact.webp", sticker: "tuk-tuk.webp",
    ja: ["参加リンクを開く", "主催者から届いたリンクで、打ち合わせに参加。"],
    en: ["Open your invitation", "Use the link from your organizer to join a meeting."],
  },
  {
    key: "portrait", icon: Users, scene: "ella-compact.webp",
    ja: ["自分のアイコンを選ぶ", "切り絵のアイコンから、回答に使う一枚を選択。"],
    en: ["Choose your portrait", "Pick a paper-cut portrait to use for your answers."],
  },
  {
    key: "vote", icon: Check, scene: "colombo.webp", sticker: "calendar.webp",
    ja: ["候補ごとに出欠を回答", "両国の時刻を見ながら、○・△・×で回答。"],
    en: ["Mark your availability", "Compare both local times and answer yes, maybe, or no."],
  },
] as const;

export function IslandGuide({ language }: { language: Language }) {
  const ja = language === "ja";
  return <section className="island-guide" aria-labelledby="island-guide-title">
    <h2 id="island-guide-title"><CircleHelp size={25} aria-hidden="true" /><Ink text={ja ? "回答の流れ" : "How to respond"} /></h2>
    <ol>
      {steps.map(step => {
        const [title, description] = step[language];
        return <li key={step.key} className="island-step" data-step={step.key}>
          <div className="island-step-art" aria-hidden="true">
            <img className="island-step-scene" src={assets + step.scene} alt="" width={640} height={360} loading="lazy" />
            {"sticker" in step
              ? <img className="island-step-sticker" src={assets + step.sticker} alt="" width={104} height={104} loading="lazy" />
              : <div className="island-step-icons">
                {["coconut", "elephant", "lotus"].map(icon =>
                  <img key={icon} src={assets + icon + ".webp"} alt="" width={64} height={64} loading="lazy" />)}
              </div>}
          </div>
          <div className="island-step-body">
            <span className="island-step-symbol"><step.icon size={17} aria-hidden="true" /></span>
            <h3><Ink text={title} /></h3>
            <p>{description}</p>
          </div>
        </li>;
      })}
    </ol>
  </section>;
}

export function IslandFooter({ language }: { language: Language }) {
  return <footer className="island-footer">
    <div className="island-footer-inner">
      <div className="island-footer-brand"><Compass size={20} aria-hidden="true" />Sri Lanka Project</div>
      <p>{language === "ja" ? "日本とスリランカの日程調整" : "Scheduling between Japan and Sri Lanka"}</p>
    </div>
  </footer>;
}
