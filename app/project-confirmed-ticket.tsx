"use client";

import { CalendarPlus, Copy, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { COLOMBO, TOKYO, dateLabel, timeLabel, zoneName, type Language } from "@/lib/schedule";
import { Ink } from "./editorial-ink";
import "./project-confirmed-ticket.css";

type ConfirmedTicketProps = {
  meetingId: string;
  title: string;
  start: number;
  duration: number;
  language: Language;
  joinUrl?: string | null;
};

const ticketCopy = {
  ja: {
    meeting: "打ち合わせ",
    confirmed: "確定した日時",
    calendar: "カレンダーに追加",
    copy: "確定内容をコピー",
    copied: "確定内容をコピーしました。",
    clipboardFallback: "以下の確定内容をコピーしてください。",
    join: "オンライン会議に参加",
  },
  en: {
    meeting: "Meeting",
    confirmed: "Confirmed time",
    calendar: "Add to calendar",
    copy: "Copy confirmed details",
    copied: "Confirmed details copied.",
    clipboardFallback: "Copy the confirmed details below.",
    join: "Join online meeting",
  },
} as const;

const ticketZones = [
  { zone: TOKYO, label: "JST" },
  { zone: COLOMBO, label: "SLST" },
] as const;

function safeJoinUrl(raw: ConfirmedTicketProps["joinUrl"]) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function calendarText(value: string) {
  return value.replaceAll("\\", "\\\\").replace(/\r\n|\r|\n/g, "\\n").replaceAll(";", "\\;").replaceAll(",", "\\,");
}

function calendarInstant(value: number) {
  return new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  let column = 0;
  let folded = "";
  for (const character of line) {
    const width = encoder.encode(character).length;
    if (column + width > 75) {
      folded += "\r\n ";
      column = 1;
    }
    folded += character;
    column += width;
  }
  return folded;
}

export function confirmedCalendarFile({
  meetingId, title, start, end, description, joinUrl, createdAt,
}: {
  meetingId: string;
  title: string;
  start: number;
  end: number;
  description: string;
  joinUrl: string | null;
  createdAt: number;
}) {
  const uid = encodeURIComponent(meetingId) + "@example.com";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TAGIRI//Sri Lanka Project//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTAMP:" + calendarInstant(createdAt),
    "DTSTART:" + calendarInstant(start),
    "DTEND:" + calendarInstant(end),
    "SUMMARY:" + calendarText(title),
    "DESCRIPTION:" + calendarText(description),
    ...(joinUrl ? ["URL:" + joinUrl] : []),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].map(foldCalendarLine).join("\r\n");
}

function ticketTime(start: number, end: number, zone: string, language: Language) {
  const startDate = dateLabel(start, zone, language);
  const endDate = dateLabel(end, zone, language);
  return {
    date: startDate === endDate ? startDate : startDate + " – " + endDate,
    startTime: timeLabel(start, zone, language),
    endTime: timeLabel(end, zone, language),
  };
}

function downloadCalendar(file: string) {
  const url = URL.createObjectURL(new Blob([file], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "sri-lanka-project-meeting.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProjectConfirmedTicket({ meetingId, title, start, duration, language, joinUrl }: ConfirmedTicketProps) {
  const labels = ticketCopy[language];
  const meetingTitle = title.trim() || labels.meeting;
  const end = start + duration * 60_000;
  const onlineUrl = safeJoinUrl(joinUrl);
  const zones = ticketZones.map(({ zone, label }) => ({
    zone,
    label,
    name: zoneName(zone, language),
    ...ticketTime(start, end, zone, language),
  }));
  const detailLines = zones.map(({ name, label, date, startTime, endTime }) => name + " (" + label + ")  " + date + "  " + startTime + "–" + endTime);
  if (onlineUrl) detailLines.push(labels.join + "  " + onlineUrl);
  const details = [meetingTitle, ...detailLines].join("\n");
  const [copyState, setCopyState] = useState<"copied" | "manual" | null>(null);
  const copyFallback = useRef<HTMLTextAreaElement>(null);
  const headingId = "ticket-" + meetingId;

  useEffect(() => {
    if (copyState === "manual") {
      copyFallback.current?.focus();
      copyFallback.current?.select();
    }
  }, [copyState]);

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(details);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
    }
  }

  function saveCalendar() {
    downloadCalendar(confirmedCalendarFile({
      meetingId,
      title: meetingTitle,
      start,
      end,
      description: detailLines.join("\n"),
      joinUrl: onlineUrl,
      createdAt: Date.now(),
    }));
  }

  return <section className="confirmed-ticket" aria-labelledby={headingId}>
    <header className="confirmed-ticket-banner">
      <h4 id={headingId}><Ink text={labels.confirmed} /></h4>
      <img src="/project/island/train.webp" width={108} height={108} alt="" loading="lazy" />
    </header>
    <div className="confirmed-ticket-times">
      {zones.map(({ zone, label, name, date, startTime, endTime }) =>
        <div className="confirmed-ticket-time" key={zone} data-zone={zone === TOKYO ? "jp" : "lk"}>
          <p className="confirmed-ticket-zone">{name}<abbr title={zone === TOKYO ? "Japan Standard Time" : "Sri Lanka Standard Time"}>{label}</abbr></p>
          <p className="confirmed-ticket-date">{date}</p>
          <p className="confirmed-ticket-range">
            <time dateTime={new Date(start).toISOString()}>{startTime}</time>
            <span>–</span>
            <time dateTime={new Date(end).toISOString()}>{endTime}</time>
          </p>
        </div>)}
    </div>
    <div className="confirmed-ticket-actions">
      {onlineUrl && <a className="confirmed-ticket-button" data-action="join" href={onlineUrl} target="_blank" rel="noopener noreferrer">
        <Video size={17} aria-hidden="true" /><span>{labels.join}</span>
      </a>}
      <button className="confirmed-ticket-button" data-action="calendar" type="button" onClick={saveCalendar}>
        <CalendarPlus size={17} aria-hidden="true" /><span>{labels.calendar}</span><small>.ics</small>
      </button>
      <button className="confirmed-ticket-button" type="button" onClick={() => { void copyDetails(); }}>
        <Copy size={17} aria-hidden="true" /><span>{labels.copy}</span>
      </button>
    </div>
    <p className="confirmed-ticket-feedback" role="status">
      {copyState === "copied" ? labels.copied : copyState === "manual" ? labels.clipboardFallback : ""}
    </p>
    {copyState === "manual" && <div className="confirmed-ticket-fallback">
      <textarea ref={copyFallback} aria-label={labels.copy} value={details} rows={onlineUrl ? 4 : 3} readOnly />
    </div>}
  </section>;
}
