"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { Check, X } from "lucide-react";
import type { Language } from "@/lib/schedule";
import { Ink } from "./editorial-ink";
import "./project-response-complete.css";

const wordmarks = [
  ["ja", 299], ["si", 332], ["vi", 358], ["uz", 307], ["ru", 347],
  ["en", 335], ["zh", 365], ["ko", 366], ["th", 360], ["my", 358],
] as const;
const copy = {
  ja: {
    status: "すべての候補に回答済み",
    trigger: "回答を終了する",
    title: "回答完了",
    close: "戻る",
    message: "世界が俺たちを呼んでいる",
  },
  en: {
    status: "You’ve answered every time slot",
    trigger: "Finish responding",
    title: "Responses complete",
    close: "Back",
    message: "The world is calling us",
  },
} as const;

export function ProjectResponseComplete({ language }: { language: Language }) {
  const t = copy[language];
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [showWordmarks, setShowWordmarks] = useState(false);

  function openCelebration() {
    const panel = dialog.current;
    if (!panel || panel.open) return;
    setShowWordmarks(true);
    panel.showModal();
    closeButton.current?.focus({ preventScroll: true });
  }

  return <>
    <div className="project-response-complete" lang={language}>
      <span className="project-response-complete-check" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
      <strong>{t.status}</strong>
      <button className="project-response-complete-trigger" type="button" aria-haspopup="dialog" aria-controls={id}
        ref={trigger} onClick={openCelebration}><Ink text={t.trigger} /></button>
    </div>
    <dialog className="project-response-celebration" id={id} lang={language}
      aria-labelledby={id + "-title"} aria-describedby={id + "-message"} ref={dialog}
      onClose={() => {
        setShowWordmarks(false);
        trigger.current?.focus({ preventScroll: true });
      }}>
      <header className="project-celebration-header">
        <h2 id={id + "-title"}><Check aria-hidden="true" size={22} />{t.title}</h2>
        <button type="button" className="project-celebration-close" ref={closeButton} onClick={() => dialog.current?.close()}>
          <X aria-hidden="true" size={18} /><Ink text={t.close} />
        </button>
      </header>
      <p id={id + "-message"} className="sr-only">{t.message}</p>
      {showWordmarks && <div className="project-celebration-wordmarks" aria-hidden="true">
        {wordmarks.map(([language, height], index) => <div className="project-celebration-wordmark" key={language} lang={language}
          style={{ "--celebration-order": index } as CSSProperties}>
          <img src={`/project/celebration/${language}.webp`} alt="" width={1100} height={height} decoding="async" draggable={false} />
        </div>)}
      </div>}
    </dialog>
  </>;
}
