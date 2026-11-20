"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { Ink } from "./editorial-ink";
import { COLOMBO, TOKYO, dateLabel, timeLabel, type Language } from "@/lib/schedule";
import "./project-clocks.css";

const clocks = [
  { zone: TOKYO, kind: "jp", abbreviation: "JST", name: { ja: "日本", en: "Japan" } },
  { zone: COLOMBO, kind: "lk", abbreviation: "SLST", name: { ja: "スリランカ", en: "Sri Lanka" } },
] as const;

function ClockDial({ localTime, kind }: { localTime: string | null; kind: "jp" | "lk" }) {
  const [hours, minutes] = localTime?.split(":").map(Number) ?? [0, 0];
  return <span className="project-clock-dial" aria-hidden="true">
    <img src={"/project/island/clock-dial-" + kind + ".webp"} alt="" width={192} height={192} />
    {localTime && <>
      <i className="project-clock-hand project-clock-hour" style={{ transform: `rotate(${hours % 12 * 30 + minutes / 2}deg)` }} />
      <i className="project-clock-hand project-clock-minute" style={{ transform: `rotate(${minutes * 6}deg)` }} />
      <i className="project-clock-pin" />
    </>}
  </span>;
}

export function ProjectClocks({ language }: { language: Language }) {
  const [instant, setInstant] = useState<number | null>(null);

  useEffect(() => {
    let timer: number;
    const tick = () => {
      const now = Date.now();
      setInstant(now);
      timer = window.setTimeout(tick, 60_000 - now % 60_000);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);

  const ja = language === "ja";
  return <div className="renewed-clocks project-world-clocks" role="group" aria-label={ja ? "現在時刻" : "Current local times"}>
    <span className="renewed-clocks-label"><Clock3 size={17} aria-hidden="true" /><Ink text={ja ? "両国の現在時刻" : "Local time now"} /></span>
    {clocks.map(({ zone, kind, abbreviation, name }) => {
      const localTime = instant === null ? null : timeLabel(instant, zone, language);
      return <div className="renewed-clock" data-zone={kind} key={zone}>
        <ClockDial localTime={localTime} kind={kind} />
        <span className="renewed-clock-zone">
          <Ink text={name[language]} />
          <small>{abbreviation}</small>
        </span>
        <time className="project-clock-time" dateTime={instant === null ? undefined : new Date(instant).toISOString()}>
          {localTime ?? "––:––"}
        </time>
        <span className="renewed-clock-date">{instant !== null && <Ink text={dateLabel(instant, zone, language)} />}</span>
      </div>;
    })}
    <span className="island-clock-difference"><Ink text={ja ? "スリランカは日本より3時間30分遅れ" : "Sri Lanka is 3½ hours behind Japan"} /></span>
  </div>;
}
