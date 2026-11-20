"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Language } from "@/lib/schedule";
import "./project-scene.css";

export type ProjectSceneView = "entry" | "identity" | "overview" | "reply" | "propose" | "complete" | "empty";

type Scene = {
  landscape: string;
  focus: string;
  mobileLandscape?: string;
  mobileFocus?: string;
  foreground?: string;
};

const scenes: Record<ProjectSceneView, Scene> = {
  entry: {
    landscape: "25-partners-landing",
    mobileLandscape: "26-partners-mobile",
    focus: "76% 60%", mobileFocus: "64% 72%",
  },
  identity: {
    landscape: "04-athgala-watch", foreground: "character-11-kohizou",
    focus: "68% 54%",
  },
  overview: {
    landscape: "01-minawa-rail", mobileLandscape: "22-minawa-mobile",
    foreground: "object-18-travel-journal", focus: "70% 58%", mobileFocus: "50% 70%",
  },
  reply: {
    landscape: "03-sendara-lake", foreground: "character-12-tsuyukero",
    focus: "64% 55%",
  },
  propose: {
    landscape: "06-highland-tea", foreground: "character-10-nawanta",
    focus: "66% 52%",
  },
  complete: {
    landscape: "08-whalesong-bay", foreground: "object-21-lotus-stamp",
    focus: "70% 39%",
  },
  empty: {
    landscape: "02-rock-palace", mobileLandscape: "23-rock-palace-mobile",
    foreground: "object-16-tuk-tuk", focus: "61% 49%", mobileFocus: "50% 62%",
  },
};

const root = "/project/extra/";

// The board's two live clocks and these illustrations share Colombo's local day.
const colomboHour = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
type Daylight = "early" | "day" | "sunset" | "night";
const timedScenes: Partial<Record<ProjectSceneView, Partial<Record<Daylight, Scene>>>> = {
  overview: {
    early: { landscape: "05-garato-lighthouse", foreground: "character-14-kainaria", focus: "65% 50%" },
    sunset: { landscape: "03-sendara-lake", foreground: "object-19-tea-cup", focus: "64% 54%" },
    night: { landscape: "07-starlit-palace", foreground: "character-13-seimonga", focus: "70% 40%" },
  },
  reply: {
    early: { landscape: "09-forest-bridge", foreground: "character-15-etagaran", focus: "68% 53%" },
    night: { landscape: "07-starlit-palace", foreground: "character-13-seimonga", focus: "70% 40%" },
  },
};

export function ProjectScenery({ view, language }: { view: ProjectSceneView; language: Language }) {
  const [daylight, setDaylight] = useState<Daylight>("day");
  useEffect(() => {
    if (!timedScenes[view]) return;
    let timer: number;
    function update() {
      const now = new Date();
      const [hour, minute] = colomboHour.format(now).split(":").map(Number);
      setDaylight(hour < 5 || hour >= 19 ? "night" : hour < 9 ? "early" : hour < 17 ? "day" : "sunset");
      timer = window.setTimeout(update, (60 - minute) * 60_000 - now.getSeconds() * 1000 - now.getMilliseconds() + 50);
    }
    update();
    return () => window.clearTimeout(timer);
  }, [view]);
  const scene = timedScenes[view]?.[daylight] ?? scenes[view];
  return <div className="project-scenery" data-view={view} data-night={scene.landscape === "07-starlit-palace" || undefined} aria-hidden="true" lang={language}
    style={{ "--scenery-focus": scene.focus, "--scenery-mobile-focus": scene.mobileFocus ?? scene.focus } as CSSProperties}>
    <picture>
      {scene.mobileLandscape && <source media="(max-width: 580px)" srcSet={root + "landscape-" + scene.mobileLandscape + ".webp"} />}
      <img src={root + "landscape-" + scene.landscape + ".webp"} alt="" width={720} height={405} />
    </picture>
    {scene.foreground && <img className="project-scenery-object" src={root + scene.foreground + ".webp"} alt="" width={240} height={240} />}
  </div>;
}
