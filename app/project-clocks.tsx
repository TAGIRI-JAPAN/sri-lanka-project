"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { Ink } from "./editorial-ink";
import { COLOMBO, TOKYO, dateLabel, timeLabel, type Language } from "@/lib/schedule";

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
  return <div className="renewed-clocks" role="group" aria-label={ja ? "現在時刻" : "Current local times"}>
    <span className="renewed-clocks-label"><Clock3 size={17} aria-hidden="true" /><Ink text={ja ? "両国の現在時刻" : "Local time now"} /></span>
    {[TOKYO, COLOMBO].map(zone => {
      const japan = zone === TOKYO;
      return <div className="renewed-clock" data-zone={japan ? "jp" : "lk"} key={zone}>
        <span className="renewed-clock-zone">
          <Ink text={japan ? (ja ? "日本" : "Japan") : (ja ? "スリランカ" : "Sri Lanka")} />
          <small><Ink text={japan ? "JST" : "SLST"} /></small>
        </span>
        <time dateTime={instant === null ? undefined : new Date(instant).toISOString()}>
          <strong><Ink text={instant === null ? "––:––" : timeLabel(instant, zone, language)} /></strong>
          <span className="renewed-clock-date">{instant !== null && <Ink text={dateLabel(instant, zone, language)} />}</span>
        </time>
      </div>;
    })}
    <span className="island-clock-difference"><Ink text={ja ? "スリランカは日本より3時間30分遅れ" : "Sri Lanka is 3½ hours behind Japan"} /></span>
  </div>;
}
