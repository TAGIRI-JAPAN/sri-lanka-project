"use client";

import type { MouseEvent, ReactNode } from "react";

function plainClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

export function ScheduleReturnLink({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return <a href="/" className={className} aria-label={label} onClick={event => {
    if (!plainClick(event) || !document.referrer || history.length <= 1) return;
    const previous = new URL(document.referrer);
    if (previous.origin === location.origin && previous.pathname === "/" && !location.hash) {
      event.preventDefault();
      history.back();
    }
  }}>{children}</a>;
}

export function CatalogJumpLink({ children, className, target = "lineup" }: { children: ReactNode; className?: string; target?: string }) {
  return <a href={`#${target}`} className={className} onClick={event => {
    if (!plainClick(event)) return;
    const section = document.getElementById(target);
    if (!section) return;
    event.preventDefault();
    section.focus({ preventScroll: true });
    section.scrollIntoView({ block: "start" });
  }}>{children}</a>;
}
