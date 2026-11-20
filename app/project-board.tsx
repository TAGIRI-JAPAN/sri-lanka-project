"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AVATAR_IDS, customPortrait, expandCandidateWindows, MAX_PROJECT_SLOTS, projectChoices, projectMarks, PROJECT_ORGANIZER_NAME,
  type CandidateWindow, type ProjectAvatar, type ProjectAvatarStyle, type ProjectBoard as Board, type ProjectChoice, type ProjectPortraits, type Proposal,
} from "@/lib/project";
import { COLOMBO, dateLabel, DURATIONS, MAX_NAME_LENGTH, timeLabel, TOKYO, uuid, wallTime, zoneName, type Language } from "@/lib/schedule";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { Ink } from "./editorial-ink";
import { IslandFooter, IslandGuide, IslandHero } from "./island-entry";
import { Field, getDeviceZone } from "./schedule-app";
import { ScheduleHeader } from "./schedule-header";
import { ProjectClocks } from "./project-clocks";
import { ProjectConfirmedTicket } from "./project-confirmed-ticket";
import { ProjectRecommendations } from "./project-recommendations";
import { ProjectResponseComplete } from "./project-response-complete";
import "./renewed-base.css";
import "./new-forms.css";
import "./new-ballot.css";
import "./island-landing.css";
import "./island-workspace.css";
import "./project-meetings.css";
import "./project-country-scenes.css";
import "./project-proposal-scenes.css";

const ZONES = [TOKYO, COLOMBO] as const;
const WIDE_PORTRAITS = new Set<ProjectAvatar>(["01", "04", "05", "06"]);
type Mode = "reply" | "propose";
type MeetingFilter = "all" | "mine" | "confirmed";
type DraftWindow = CandidateWindow & { key: number };
type PortraitSets = Partial<Record<ProjectAvatarStyle, ProjectPortraits>>;
type Feedback = { message: Message; error?: boolean };
type MeetingDialog = { action: "confirm" | "delete"; item: Proposal };
type ProposalInput = { title: string; meetingUrl: string; windows: DraftWindow[]; zone: string; duration: number; respondentAvatars: ProjectAvatar[] };
type GuestEntry = { availableAvatars: ProjectAvatar[] };

const copy = {
  ja: {
    inviteRequired: "ページを開き直してください。", manage: "日程の管理", signIn: "ログイン", loading: "読み込み中…", refresh: "再読み込み",
    unavailable: "読み込みに失敗しました。もう一度お試しください。", saving: "保存中…",
    choose: "キャラクターを選択", pick: "このキャラクターで回答", portrait: "回答者", name: "表示する名前",
    chooseHint: "キャラクターを選んで、候補日時に回答できます。", character: "キャラクター",
    noGuestAvatars: "いま選べるキャラクターはありません。",
    taken: "使用中", selected: "選択中", unnamed: "名前を入力", portraitFailed: "回答者の画像を読み込めませんでした。",
    avatarTaken: "その画像は別の人が選びました。ほかの画像を選んでください。",
    full: "すべての画像が使用中です。イニシャルで回答できます。", useInitial: "イニシャルで進む",
    identity: "回答者", change: "回答者を変更", cancel: "戻る", organizer: "主催者", profileSaved: "回答者を設定しました。",
    reply: "候補日時を見る", propose: "候補日時を追加", mode: "操作を選ぶ", candidates: "候補日時",
    noProposals: "候補日時がまだありません。", meeting: "打ち合わせ", proposer: "提案者",
    open: "回答受付中", closed: "受付終了", confirmed: "日程が決まりました", finalizedSlot: "確定した日時", complete: "全員回答済み",
    preferred: "最優先", yes: "参加可", maybe: "要相談", no: "参加不可", vote: "出欠を入力", editVote: "回答を変更",
    pending: "未回答", voted: "回答を受け付けました", votedState: "回答済み", review: "回答を確認", waiting: "未回答",
    ineligible: "この候補の回答対象外です。", confirm: "日程を確定", reopen: "回答受付を再開",
    confirmPrompt: "この枠を日程に確定し、この打ち合わせの回答受付を終了します。", confirmedSaved: "日程を確定しました。", reopened: "回答受付を再開しました。",
    editMeeting: "編集", deleteMeeting: "削除", editHeading: "日程提案を編集",
    deleteHeading: "打ち合わせを削除", deletePrompt: "この打ち合わせの候補日時と回答がすべて削除されます。",
    savedEdit: "日程提案を更新しました。", deletedMeeting: "打ち合わせを削除しました。", saveEdit: "変更を保存",
    resetDraft: "入力をリセット", resetCandidateTimes: "候補日時を入れ直す", restoreEdit: "編集前に戻す", cancelEdit: "キャンセル",
    editHint: "変更した候補枠の回答は消去されます。", editReopens: "確定した日時を変更すると、回答受付を再開します。",
    meetingList: "打ち合わせ一覧", allMeetings: "すべて", myMeetings: "自分宛", confirmedMeetings: "確定済み",
    noMyMeetings: "あなた宛の打ち合わせはまだありません。", noConfirmedMeetings: "確定済みの打ち合わせはまだありません。",
    unansweredOnly: "未回答だけ見る", nextUnanswered: "次の未回答へ", allCandidates: "全候補を見る",
    joinUrl: "オンライン会議リンク（任意）", joinUrlHint: "確定後、回答対象者に表示されます。",
    invalidMeetingUrl: "https:// で始まる有効な会議リンクを入力してください。",
    title: "打ち合わせ名（任意）", placeholder: "例 日本語教育チーム定例",
    date: "日付", time: "開始時刻", end: "終了時刻", optional: "任意", zone: "入力する時刻の基準", duration: "打ち合わせ時間", minute: "分",
    window: "候補の時間帯", addWindow: "候補の日・時間帯を追加", removeWindow: "削除",
    windowHelp: "終了時刻を入れると、その時間帯を打ち合わせ時間ごとの枠に分けます。開始時刻だけなら、その時刻から1枠作ります。",
    converted: "回答枠のプレビュー", slotUnit: "枠", progress: "回答状況", personalProgress: "あなたの回答", teamProgress: "全枠に回答した人",
    respondents: "回答してほしい人", allMembers: "全員", audienceHint: "回答してほしい人のアイコンをタップ。本人の登録前でも選べます。",
    audience: "回答対象", unregistered: "本人未登録", self: "自分", personUnit: "人",
    post: "日程を提案", posted: "候補日時をまとめて追加しました。",
    backToEntry: "入力に戻る",
    invalid: "入力内容を確認してください。", invalidTime: "候補の日付・時刻を確認してください。",
    shortWindow: "打ち合わせ時間が収まるよう、候補の時間帯を広げてください。", tooManySlots: `一度に追加できるのは${MAX_PROJECT_SLOTS}枠までです。`,
    forbidden: "この操作は提案者か主催者が行えます。", missing: "候補日時が見つかりません。",
  },
  en: {
    inviteRequired: "Please reopen this page.", manage: "Manage schedules", signIn: "Sign in", loading: "Loading…", refresh: "Reload",
    unavailable: "Unable to load. Please try again.", saving: "Saving…",
    choose: "Choose a character", pick: "Respond with this character", portrait: "Respondent", name: "Display name",
    chooseHint: "Choose a character to respond to proposed times.", character: "Character",
    noGuestAvatars: "No characters are available to select right now.",
    taken: "In use", selected: "Selected", unnamed: "Enter a name", portraitFailed: "The portraits could not load.",
    avatarTaken: "Someone else chose that portrait. Please choose another one.",
    full: "All portraits are in use. You can respond with your initials.", useInitial: "Continue with initials",
    identity: "Responding as", change: "Change respondent", cancel: "Go back", organizer: "Organizer", profileSaved: "Respondent saved.",
    reply: "View proposed times", propose: "Add a proposed time", mode: "Choose an action", candidates: "Proposed times",
    noProposals: "No times have been proposed yet.", meeting: "Meeting", proposer: "Proposed by",
    open: "Accepting responses", closed: "Responses closed", confirmed: "Time confirmed", finalizedSlot: "Confirmed time", complete: "Everyone has responded",
    preferred: "Preferred", yes: "Available", maybe: "Maybe", no: "Unavailable", vote: "Add availability", editVote: "Edit response",
    pending: "No response yet", voted: "Your response was saved.", votedState: "Responded", review: "Check responses", waiting: "Awaiting response",
    ineligible: "You are not on the response list for this time.", confirm: "Confirm this time", reopen: "Reopen responses",
    confirmPrompt: "Confirm this slot and close responses for this meeting.", confirmedSaved: "The time was confirmed.", reopened: "Responses have reopened.",
    editMeeting: "Edit", deleteMeeting: "Delete", editHeading: "Edit proposed times",
    deleteHeading: "Delete meeting", deletePrompt: "This permanently deletes all proposed times and responses for this meeting.",
    savedEdit: "The proposal was updated.", deletedMeeting: "The meeting was deleted.", saveEdit: "Save changes",
    resetDraft: "Reset form", resetCandidateTimes: "Start over with new times", restoreEdit: "Restore saved entries", cancelEdit: "Cancel",
    editHint: "Responses for changed time slots will be removed.", editReopens: "Changing the confirmed time will reopen responses.",
    meetingList: "Meetings", allMeetings: "All", myMeetings: "For me", confirmedMeetings: "Confirmed",
    noMyMeetings: "You have no meetings to respond to yet.", noConfirmedMeetings: "No meetings have been confirmed yet.",
    unansweredOnly: "Show unanswered only", nextUnanswered: "Go to next unanswered", allCandidates: "Show all times",
    joinUrl: "Online meeting link (optional)", joinUrlHint: "Shared with the requested respondents after confirmation.",
    invalidMeetingUrl: "Enter a valid meeting link beginning with https://.",
    title: "Meeting name (optional)", placeholder: "e.g. Japanese education team check-in",
    date: "Date", time: "Start time", end: "End time", optional: "optional", zone: "Time zone for entry", duration: "Meeting length", minute: " min",
    window: "Candidate time windows", addWindow: "Add a date or time window", removeWindow: "Remove",
    windowHelp: "Add an end time to divide the window into meeting-length slots. A start time by itself creates a single slot.",
    converted: "Slot preview", slotUnit: "slots", progress: "Response status", personalProgress: "Your answers", teamProgress: "Respondents who answered every slot",
    respondents: "Who should respond?", allMembers: "Everyone", audienceHint: "Select portraits. You can include people before they join.",
    audience: "Requested respondents", unregistered: "Not yet linked", self: "You", personUnit: " selected",
    post: "Post proposed times", posted: "The proposed times were added.",
    backToEntry: "Return to the form",
    invalid: "Check your entries and try again.", invalidTime: "Check the dates and times.",
    shortWindow: "Extend the window to fit the meeting length.", tooManySlots: `You can propose up to ${MAX_PROJECT_SLOTS} slots at once.`,
    forbidden: "Only the proposer or organizer can do this.", missing: "The proposed time could not be found.",
  },
} as const;

type Message = keyof typeof copy.ja;

function localName(name: string, language: Language) {
  return name === PROJECT_ORGANIZER_NAME ? copy[language].organizer : name;
}

function placeName(zone: string, language: Language) {
  return zoneName(zone, language) + (language === "ja" ? "時間" : " time");
}

function photo(sets: PortraitSets, id: ProjectAvatar | null) {
  return id ? sets.kirie?.[id] : undefined;
}

function responseAvatar(board: Board, proposal: Proposal) {
  const audience = board.meetingAudience[proposal.meetingId ?? proposal.id];
  return board.profile?.avatar ?? audience?.find(({ member }) => member?.id === board.viewerId)?.avatar;
}

function Avatar({ src, name, own = false, showName = false, iconOnly = false }: {
  src?: string; name: string; own?: boolean; showName?: boolean; iconOnly?: boolean;
}) {
  const initial = Array.from(name.trim())[0] ?? "•";
  return <span className="project-voter" data-own={own || undefined} title={name}>
    {src ? <img src={src} alt={name} width={48} height={48} /> : <span className="project-voter-initial" role="img" aria-label={name}><Ink text={initial} /></span>}
    {!iconOnly && (showName || !src) && <span className="project-voter-name"><Ink text={name} /></span>}
  </span>;
}

function AudienceIcons({ board, sets, language, meeting, draft, limit }: {
  board: Board; sets: PortraitSets; language: Language;
  meeting?: Proposal; draft?: ProjectAvatar[]; limit?: number;
}) {
  const t = copy[language];
  const meetingId = meeting && (meeting.meetingId ?? meeting.id);
  const modern = meetingId ? board.meetingAudience[meetingId] : draft?.map(avatar => ({ avatar, member: board.portraitOwners[avatar] ?? null }));
  const legacy = meetingId ? board.legacyAudience?.[meetingId] : undefined;
  const people = modern?.length ? modern.map(({ avatar, member }) => ({
    key: avatar, avatar, member, name: member ? localName(member.name, language) : `${t.portrait} ${Number(avatar)} · ${t.unregistered}`,
  })) : legacy?.members.map(member => ({
    key: member.id, avatar: member.avatar, member, name: localName(member.name, language),
  })) ?? [];
  if (!people.length) return <span className="audience-everyone"><Ink text={legacy?.all === false ? meeting?.totalRespondents + t.personUnit : t.allMembers} /></span>;
  const hidden = limit ? people.slice(limit) : [];
  return <ul className="audience-avatars" aria-label={t.audience}>
    {people.slice(0, limit ?? people.length).map(({ key, avatar, member, name }) => <li key={key} data-awaiting={!member || undefined}>
      <Avatar src={photo(sets, avatar)} name={name} own={member?.id === board.viewerId} iconOnly />
    </li>)}
    {hidden.length > 0 && <li className="audience-avatar-overflow" title={hidden.map(person => person.name).join("、")}><Ink text={`+${hidden.length}`} /></li>}
  </ul>;
}

async function boardRequest<T>(token: string, body?: object, path = "/api/project"): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["X-Project-Member"] = token;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(path, {
    method: body ? "POST" : "GET", headers, cache: "no-store", body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const failure = await response.json<{ error?: string }>().catch(() => null);
    throw new Error(failure?.error ?? "unavailable");
  }
  return response.json<T>();
}

function DisplayedInput({ display, children }: { display: string; children: ReactNode }) {
  return <span className="displayed-input">
    {children}
    <span className="displayed-input-value" aria-hidden="true"><Ink text={display} /></span>
  </span>;
}

function formatInputDate(value: string, language: Language) {
  const day = Date.parse(value + "T12:00:00Z");
  return Number.isFinite(day) ? dateLabel(day, "UTC", language) : "–";
}

function ProjectTimes({ start, duration, language, primary = TOKYO, grouped = false }: {
  start: number; duration: number; language: Language; primary?: string; grouped?: boolean;
}) {
  const end = start + duration * 60_000;
  const headingDate = dateLabel(start, primary, language);
  const zones = primary === COLOMBO ? [COLOMBO, TOKYO] : ZONES;
  return <div className="meeting-time-pair">
    {zones.map(zone => {
      const startDay = dateLabel(start, zone, language);
      const endDay = dateLabel(end, zone, language);
      return <div key={zone} className="meeting-time" data-zone={zone === TOKYO ? "jp" : "lk"}>
        <span className="meeting-zone"><Ink text={placeName(zone, language)} /></span>
        <div className="meeting-time-range">
          <time dateTime={new Date(start).toISOString()}><Ink text={timeLabel(start, zone, language)} /></time>
          <span><Ink text="–" /></span>
          <time dateTime={new Date(end).toISOString()}><Ink text={timeLabel(end, zone, language)} /></time>
        </div>
        {(!grouped || startDay !== headingDate || startDay !== endDay) &&
          <small><Ink text={startDay === endDay ? startDay : startDay + " – " + endDay} /></small>}
      </div>;
    })}
  </div>;
}

type ReplyReceipt = { image: string | undefined; wide: boolean; name: string };

function ProposalSlot({ item, board, sets, language, primary, grouped = true, pending, feedback, receipt, busy, onVote, onConfirm }: {
  item: Proposal; board: Board; sets: PortraitSets; language: Language; primary: string; grouped?: boolean; pending: ProjectChoice | undefined;
  feedback: Feedback | undefined; receipt?: ReplyReceipt; busy: boolean; onVote: (choice: ProjectChoice) => void; onConfirm: () => void;
}) {
  const t = copy[language];
  const ownChoice = pending ?? item.ownChoice;
  const waitingCount = Math.max(0, item.totalRespondents - item.responses.length);
  const manage = item.canManage && !item.meetingClosed;
  const canVote = item.eligible && !item.meetingClosed;
  const showResponse = canVote || manage || item.responses.length > 0 || (!item.meetingClosed && waitingCount > 0) || Boolean(feedback);
  return <li id={`slot-${item.id}`} className="meeting-slot" tabIndex={-1} aria-label={dateLabel(item.start, primary, language) + " " + timeLabel(item.start, primary, language)}
    data-confirmed={item.confirmed || undefined} data-response={showResponse || undefined}>
    {item.confirmed && <p className="meeting-final"><img src="/project/art/u04.webp" alt="" width={20} height={20} /><Ink text={t.finalizedSlot} /></p>}
    <ProjectTimes start={item.start} duration={item.duration} language={language} primary={primary} grouped={grouped} />
    {showResponse && <div className="meeting-responses">
      {canVote && <div className="meeting-votes" role="group" aria-label={t.vote}>
        {projectChoices.map(choice => <button type="button" className="meeting-vote" key={choice} data-choice={choice}
          aria-pressed={ownChoice === choice} aria-label={projectMarks[choice] + " " + t[choice]}
          disabled={Boolean(pending) || busy} onClick={() => onVote(choice)}>
          <span className="meeting-vote-mark" aria-hidden="true"><Ink text={projectMarks[choice]} /></span>
          <span className="meeting-vote-label"><Ink text={t[choice]} /></span>
        </button>)}
      </div>}
      <div className="meeting-response-floor">
        <div className="meeting-counts" aria-label={t.review}>
          {projectChoices.map(choice => {
            const people = item.responses.filter(person => person.choice === choice);
            if (!people.length) return null;
            return <div className="meeting-count" key={choice} data-choice={choice} role="group" aria-label={t[choice] + " " + people.length}>
              <b aria-hidden="true"><Ink text={projectMarks[choice]} /> {people.length}</b>
              <ul>{people.map(person => <li key={person.id}>
                <Avatar src={photo(sets, person.avatar)} name={localName(person.name, language)}
                  own={person.id === board.viewerId} showName={Boolean(person.avatar && customPortrait(person.avatar))} />
              </li>)}</ul>
            </div>;
          })}
          {!item.meetingClosed && waitingCount > 0 && <span className="meeting-await">
            <Ink text={t.waiting} />{" "}<Ink text={waitingCount} />
          </span>}
        </div>
        <span className="meeting-saved" role="status">
          {pending ? <Ink text={t.saving} /> : feedback && !feedback.error && !receipt ? <Ink text={t.votedState} /> : null}
        </span>
        {manage && <button className="meeting-confirm-button" type="button" disabled={busy || Boolean(pending)}
          aria-haspopup="dialog" onClick={onConfirm}>
          <Ink text={t.confirm} />
        </button>}
      </div>
    </div>}
    {receipt && <div className="meeting-receipt" role="status" data-wide={receipt.wide || undefined}>
      {receipt.image && <img src={receipt.image} alt="" width={receipt.wide ? 288 : 80} height={receipt.wide ? 162 : 80} />}
      <div>
        <strong><Ink text={t.voted} /></strong>
        <p><Ink text={receipt.name} /></p>
      </div>
    </div>}
    {feedback?.error && <p role="alert" className="project-feedback is-error"><Ink text={t[feedback.message]} /></p>}
  </li>;
}

function MeetingCard({ slots, board, sets, language, pending, feedback, busy, revealed, onVote, onConfirm, onEdit, onDelete }: {
  slots: Proposal[]; board: Board; sets: PortraitSets; language: Language; pending: Record<string, ProjectChoice>;
  feedback: Record<string, Feedback>; busy: boolean; revealed: string | null;
  onVote: (slot: Proposal, choice: ProjectChoice) => void; onConfirm: (slot: Proposal) => void;
  onEdit: (slots: Proposal[]) => void; onDelete: (meeting: Proposal) => void;
}) {
  const t = copy[language];
  const [meeting] = slots;
  const [primary, setPrimary] = useState<string>(TOKYO);
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const lastJump = useRef<string | null>(null);
  useEffect(() => {
    if (getDeviceZone([...ZONES], TOKYO) === COLOMBO) setPrimary(COLOMBO);
  }, []);
  const meetingId = meeting.meetingId ?? meeting.id;
  const proposer = meeting.proposerName ? localName(meeting.proposerName, language) : t.organizer;
  const sortedSlots = [...slots].sort((a, b) => a.start - b.start);
  const unanswered = sortedSlots.filter(slot => slot.eligible && !slot.ownChoice);
  const answeredSlots = sortedSlots.filter(slot => slot.ownChoice).length;
  const personalComplete = meeting.eligible && !meeting.meetingClosed && unanswered.length === 0;
  const showUnanswered = onlyUnanswered && meeting.eligible && !meeting.meetingClosed;
  const respondentProgress = new Map<string, number>();
  const days = new Map<string, Proposal[]>();
  const confirmedSlot = meeting.meetingClosed ? slots.find(slot => slot.confirmed) : undefined;
  for (const slot of sortedSlots) {
    for (const person of slot.responses) respondentProgress.set(person.id, (respondentProgress.get(person.id) ?? 0) + 1);
    if (showUnanswered && slot.ownChoice) continue;
    const key = wallTime(slot.start, primary).slice(0, 10);
    const group = days.get(key);
    if (group) group.push(slot);
    else days.set(key, [slot]);
  }
  const answeredPeople = [...respondentProgress.values()].filter(count => count === slots.length).length;
  const complete = meeting.totalRespondents > 0 && answeredPeople === meeting.totalRespondents;
  const lastReply = slots.find(slot => slot.id === revealed && slot.ownChoice);
  const lastAvatar = lastReply && responseAvatar(board, lastReply);
  const widePortrait = lastAvatar && WIDE_PORTRAITS.has(lastAvatar) ? sets.wide?.[lastAvatar] : undefined;
  const receipt = lastReply && !personalComplete ? {
    image: widePortrait ?? (lastAvatar ? sets.kirie?.[lastAvatar] : undefined),
    wide: Boolean(widePortrait),
    name: localName(board.profile?.displayName ?? board.memberName ?? t.organizer, language),
  } : undefined;
  const japanese = language === "ja";
  const zonePrompt = japanese ? "日付の基準" : "Group dates by";
  function jumpToUnanswered() {
    const available = unanswered.filter(slot => !pending[slot.id]);
    if (!available.length) return;
    const index = available.findIndex(slot => slot.id === lastJump.current);
    const { id } = available[(index + 1) % available.length];
    lastJump.current = id;
    const element = document.getElementById(`slot-${id}`);
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: "center" });
  }
  const renderSlot = (slot: Proposal, grouped: boolean) => <ProposalSlot key={slot.id} item={slot} board={board} sets={sets}
    language={language} primary={primary} grouped={grouped} pending={pending[slot.id]} feedback={feedback[slot.id]} busy={busy}
    receipt={slot.id === lastReply?.id ? receipt : undefined}
    onVote={choice => onVote(slot, choice)} onConfirm={() => onConfirm(slot)} />;
  const dateSections = [...days.entries()].map(([day, group]) => <section className="meeting-day" key={day}>
    <h4>
      <time dateTime={day}><Ink text={dateLabel(group[0].start, primary, language)} /></time>
      <span><Ink text={group.length + (japanese ? "枠" : group.length === 1 ? " slot" : " slots")} /></span>
    </h4>
    <ol>{group.map(slot => renderSlot(slot, true))}</ol>
  </section>);
  return <article id={`meeting-${meetingId}`} className="meeting-sheet" tabIndex={-1} aria-labelledby={`title-${meetingId}`}>
    <header className="meeting-heading">
      <div className="meeting-title">
        <span className="meeting-status" data-state={confirmedSlot || complete ? "complete" : meeting.meetingClosed ? "closed" : "open"}>
          <Ink text={confirmedSlot ? t.confirmed : meeting.meetingClosed ? t.closed : complete ? t.complete : t.open} />
        </span>
        <h3 id={`title-${meetingId}`}><Ink text={meeting.title || t.meeting} /></h3>
      </div>
      <div className="meeting-heading-side">
        <div className="meeting-heading-people">
          {!board.guest && <div className="meeting-proposer">
            <span><Ink text={t.proposer} /></span>
            <Avatar src={photo(sets, meeting.proposerAvatar)} name={proposer} showName={Boolean(meeting.proposerAvatar && customPortrait(meeting.proposerAvatar))} />
          </div>}
          <div className="meeting-heading-audience">
            <span><Ink text={t.audience} /></span>
            <AudienceIcons board={board} sets={sets} language={language} meeting={meeting} />
          </div>
        </div>
        {meeting.canManage && <div className="meeting-management">
          <button type="button" disabled={busy} onClick={() => onEdit(slots)} aria-label={`${t.editMeeting} · ${meeting.title || t.meeting}`}><Ink text={t.editMeeting} /></button>
          <button type="button" className="meeting-delete" disabled={busy} aria-haspopup="dialog" onClick={() => onDelete(meeting)}
            aria-label={`${t.deleteMeeting} · ${meeting.title || t.meeting}`}><Ink text={t.deleteMeeting} /></button>
        </div>}
      </div>
    </header>
    {confirmedSlot && <>
      <ProjectConfirmedTicket meetingId={meetingId} title={meeting.title} start={confirmedSlot.start} duration={confirmedSlot.duration}
        language={language} joinUrl={confirmedSlot.meetingUrl} />
      {meeting.canManage && <div className="meeting-reopen"><button type="button" className="meeting-confirm-button" disabled={busy}
        onClick={() => onConfirm(confirmedSlot)}><Ink text={t.reopen} /></button></div>}
    </>}
    <div className="meeting-people">
      <span className="meeting-team-progress"><Ink text={t.teamProgress} /> <b><Ink text={answeredPeople + " / " + meeting.totalRespondents} /></b></span>
    </div>
    {meeting.eligible && !meeting.meetingClosed && unanswered.length > 0 && <div className="meeting-unanswered-tools">
      <strong aria-live="polite">{japanese ? `あなたの未回答 ${unanswered.length}枠` : `${unanswered.length} unanswered`}</strong>
      <button type="button" aria-pressed={showUnanswered} onClick={() => setOnlyUnanswered(value => !value)}>
        {japanese ? <Ink text={t.unansweredOnly} /> : t.unansweredOnly}
      </button>
      <button type="button" onClick={jumpToUnanswered} disabled={unanswered.every(slot => pending[slot.id])}>
        {japanese ? <Ink text={t.nextUnanswered} /> : t.nextUnanswered}<ArrowDown size={15} aria-hidden="true" />
      </button>
    </div>}
    {personalComplete && showUnanswered && <div className="meeting-unanswered-tools">
      <button type="button" onClick={() => setOnlyUnanswered(false)}>{t.allCandidates}</button>
    </div>}
    <div className="meeting-controls">
      {meeting.eligible ? <div className="meeting-progress">
        <div><Ink text={t.personalProgress} /><b><Ink text={answeredSlots + " / " + slots.length} /></b></div>
        <progress aria-label={t.personalProgress} value={answeredSlots} max={slots.length} />
      </div> : <div className="meeting-observer">
        <Ink text={japanese ? "みんなの回答" : "Team responses"} />
        {!meeting.meetingClosed && <small><Ink text={t.ineligible} /></small>}
      </div>}
      <div className="meeting-basis" role="group" aria-label={zonePrompt}>
        <span><Ink text={zonePrompt} /></span>
        <div>{ZONES.map(zone => <button key={zone} type="button" aria-pressed={primary === zone}
          aria-label={placeName(zone, language)} onClick={() => setPrimary(zone)}><Ink text={placeName(zone, language)} /></button>)}</div>
      </div>
    </div>
    {!showUnanswered && <ProjectRecommendations slots={slots} board={board} portraits={sets.kirie} language={language}
      busy={busy || slots.some(slot => Boolean(pending[slot.id]))} onConfirm={onConfirm} />}
    {confirmedSlot && dateSections.length > 0 ? <details className="meeting-history">
      <summary><Ink text={japanese ? "候補ごとの回答を確認" : "Review responses for each time"} /></summary>
      {dateSections}
    </details> : dateSections}
    {personalComplete && <ProjectResponseComplete language={language} />}
  </article>;
}

function managementSignIn(signInPath: string, meeting: string | null) {
  const url = new URL(signInPath, "https://app.local");
  url.searchParams.set("return_to", "/?manage=1" + (meeting ? "#meeting=" + meeting : ""));
  return url.pathname + url.search;
}

export function ProjectBoard({ signInPath }: { signInPath: string }) {
  const [language, setLanguage] = useState<Language>("ja");
  const [board, setBoard] = useState<Board | null>(null);
  const [guestEntry, setGuestEntry] = useState<GuestEntry | null>(null);
  const [manageEntry, setManageEntry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("reply");
  const [meetingFilter, setMeetingFilter] = useState<MeetingFilter>("all");
  const [editingRespondent, setEditingRespondent] = useState(false);
  const [initials, setInitials] = useState(false);
  const [chosen, setChosen] = useState<ProjectAvatar | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [sets, setSets] = useState<PortraitSets>({});
  const [portraitErrors, setPortraitErrors] = useState<Partial<Record<ProjectAvatarStyle, boolean>>>({});
  const [portraitRetry, setPortraitRetry] = useState(0);
  const [pending, setPending] = useState<Record<string, ProjectChoice>>({});
  const [voteFeedback, setVoteFeedback] = useState<Record<string, Feedback>>({});
  const [revealed, setRevealed] = useState<string | null>(null);
  const [linkedMeeting, setLinkedMeeting] = useState<string | null>(null);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [windows, setWindows] = useState<DraftWindow[]>([{ key: 0, date: "", from: "", to: "" }]);
  const [zone, setZone] = useState(TOKYO);
  const [duration, setDuration] = useState<number>(30);
  const [title, setTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [respondentAvatars, setRespondentAvatars] = useState<ProjectAvatar[]>([]);
  const [dialog, setDialog] = useState<MeetingDialog | null>(null);
  const [editing, setEditing] = useState<{ item: Proposal; saved: ProposalInput; confirmed?: Proposal } | null>(null);

  const token = useRef("");
  const authRevision = useRef(0);
  const readRevision = useRef(0);
  const votesInFlight = useRef(new Set<string>());
  const nextWindowKey = useRef(1);
  const content = useRef<HTMLElement>(null);
  const casting = useRef<HTMLElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const newProposalDraft = useRef<ProposalInput | null>(null);
  const t = copy[language];
  const profile = board?.profile;
  const signedIn = Boolean(board);
  const publicChooser = !board && guestEntry !== null;
  const avatarChoices = publicChooser ? guestEntry.availableAvatars : AVATAR_IDS;
  const publicPortraits = publicChooser && avatarChoices.length > 0;
  const allTaken = board?.takenAvatars.length === AVATAR_IDS.length;
  const chooseRespondent = publicChooser || (signedIn && (editingRespondent || (!profile && !initials)));
  const ownName = localName(profile?.displayName ?? board?.memberName ?? t.organizer, language);
  const activePortraits = sets.kirie;
  const selectedTaken = Boolean(chosen && (board?.takenAvatars.includes(chosen) || (publicChooser && !avatarChoices.includes(chosen))));
  const requiresName = Boolean(board && chosen && customPortrait(chosen));
  const readyWindows = windows.filter(window => window.date && window.from);
  const preview = readyWindows.length ? expandCandidateWindows(readyWindows, zone, duration) : undefined;
  const meetings = new Map<string, Proposal[]>();
  for (const slot of board?.proposals ?? []) {
    const key = slot.meetingId ?? slot.id;
    const group = meetings.get(key);
    if (group) group.push(slot);
    else meetings.set(key, [slot]);
  }
  const orderedMeetings = [...meetings].sort(([, a], [, b]) =>
    Number(a[0].meetingClosed) - Number(b[0].meetingClosed) || Number(b[0].eligible) - Number(a[0].eligible));
  const meetingLists = {
    all: orderedMeetings,
    mine: orderedMeetings.filter(([, slots]) => slots.some(slot => slot.eligible)),
    confirmed: orderedMeetings.filter(([, slots]) => slots.some(slot => slot.confirmed)),
  };
  const displayedMeetings = meetingLists[meetingFilter];
  const selectedMeeting = displayedMeetings.find(([id]) => id === activeMeetingId) ?? displayedMeetings[0];
  const selectedMeetingId = selectedMeeting?.[0];
  const audienceSlot = selectedMeeting?.[1][0];
  const editedConfirmation = editing?.confirmed;
  const editReopens = editedConfirmation && preview?.starts
    && (duration !== editedConfirmation.duration || !preview.starts.includes(editedConfirmation.start));
  const canResetDraft = Boolean(title || meetingUrl || respondentAvatars.length || windows.length > 1
    || windows[0]?.from || windows[0]?.to || duration !== 30 || windows[0]?.date !== wallTime(Date.now(), zone).slice(0, 10));

  const refresh = useCallback(async () => {
    const revision = ++readRevision.current;
    const session = authRevision.current;
    const managing = new URLSearchParams(location.search).get("manage") === "1";
    const next = await boardRequest<Board>(token.current, undefined, managing ? "/api/project?manage=1" : "/api/project");
    if (session === authRevision.current && revision === readRevision.current) setBoard(next);
    return next;
  }, []);

  const openBoard = useCallback(async () => {
    const session = ++authRevision.current;
    const managing = new URLSearchParams(location.search).get("manage") === "1";
    const parameters = new URLSearchParams(location.hash.slice(1));
    token.current = parameters.get("member") ?? "";
    const meeting = parameters.get("meeting");
    const target = meeting && uuid.test(meeting) ? meeting : null;
    votesInFlight.current.clear();
    setBoard(null);
    setGuestEntry(null);
    setManageEntry(managing);
    setLoading(true);
    setBusy(false);
    setFeedback(undefined);
    setMode("reply");
    setMeetingFilter("all");
    setLinkedMeeting(target);
    setActiveMeetingId(target);
    setEditingRespondent(false);
    setInitials(false);
    setChosen(null);
    setDisplayName("");
    setSets({});
    setPortraitErrors({});
    setVoteFeedback({});
    setRevealed(null);
    setPending({});
    setRespondentAvatars([]);
    setTitle("");
    setMeetingUrl("");
    setDuration(30);
    const basis = getDeviceZone([...ZONES], TOKYO);
    setZone(basis);
    setWindows([{ key: nextWindowKey.current++, date: wallTime(Date.now(), basis).slice(0, 10), from: "", to: "" }]);
    newProposalDraft.current = null;
    setEditing(null);
    setDialog(null);
    confirmation.current?.close();
    try {
      await refresh();
    } catch (error) {
      if (session === authRevision.current && (error as Error).message === "inviteRequired" && !managing) {
        const available = await boardRequest<GuestEntry>("", undefined, "/api/project?join=1").catch(() => null);
        if (session === authRevision.current && available) {
          setGuestEntry(available);
          return;
        }
      }
      if (session === authRevision.current) setFeedback({ message: (error as Error).message as Message, error: true });
    } finally {
      if (session === authRevision.current) setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let preference: string | null = null;
      try { preference = localStorage.getItem("tagiri-schedule-language"); } catch {}
      setLanguage(preference === "ja" || preference === "en" ? preference : navigator.language.startsWith("ja") ? "ja" : "en");
      void openBoard();
    });
    function openInvite() { void openBoard(); }
    window.addEventListener("hashchange", openInvite);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openInvite);
    };
  }, [openBoard]);

  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => {
    if (!signedIn) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh().catch(() => {});
    }, 10000);
    return () => window.clearInterval(interval);
  }, [refresh, signedIn]);

  const needsWide = mode === "reply" && !chooseRespondent && Boolean(board?.proposals.some(proposal => {
    const avatar = responseAvatar(board, proposal);
    return proposal.eligible && avatar && WIDE_PORTRAITS.has(avatar);
  }));
  const wideLoaded = Boolean(sets.wide);
  const kirieLoaded = Boolean(sets.kirie);
  useEffect(() => {
    if (!signedIn && !publicPortraits) return;
    const session = authRevision.current;
    const required: ProjectAvatarStyle[] = [];
    if (!kirieLoaded) required.push("kirie");
    if (needsWide && !wideLoaded) required.push("wide");
    for (const art of required) {
      const path = art === "kirie" ? "/api/project/portraits?style=kirie" + (signedIn ? "" : "&join=1") : "/api/project/portraits";
      void boardRequest<ProjectPortraits>(token.current, undefined, path).then(photos => {
        if (authRevision.current === session) setSets(old => ({ ...old, [art]: photos }));
      }).catch(() => {
        if (authRevision.current === session) setPortraitErrors(old => ({ ...old, [art]: true }));
      });
    }
  }, [signedIn, publicPortraits, needsWide, wideLoaded, kirieLoaded, portraitRetry]);

  useEffect(() => {
    if (signedIn && mode === "reply" && !chooseRespondent && linkedMeeting) {
      document.getElementById(`meeting-${linkedMeeting}`)?.scrollIntoView({ block: "start" });
    }
  }, [signedIn, mode, chooseRespondent, linkedMeeting]);

  useEffect(() => {
    if (!chooseRespondent) return;
    casting.current?.focus({ preventScroll: true });
    if (editingRespondent) casting.current?.scrollIntoView({ block: "start" });
  }, [chooseRespondent, editingRespondent]);

  useEffect(() => {
    if (!activeMeetingId && selectedMeetingId) setActiveMeetingId(selectedMeetingId);
  }, [activeMeetingId, selectedMeetingId]);

  useEffect(() => {
    if (dialog && confirmation.current && !confirmation.current.open) confirmation.current.showModal();
  }, [dialog]);

  async function perform<T extends object = object>(action: object, success: Message) {
    if (busy) return false;
    const session = authRevision.current;
    setBusy(true);
    setFeedback(undefined);
    try {
      const result = await boardRequest<T>(token.current, action);
      if (authRevision.current !== session) return false;
      await refresh().catch(() => {});
      if (authRevision.current !== session) return false;
      setFeedback({ message: success });
      return result;
    } catch (error) {
      if (authRevision.current !== session) return false;
      const message = (error as Error).message as Message;
      setFeedback({ message, error: true });
      if (message === "avatarTaken" || message === "closed") void refresh().catch(() => {});
      return false;
    } finally {
      if (authRevision.current === session) setBusy(false);
    }
  }

  async function vote(item: Proposal, choice: ProjectChoice) {
    if (!board || !item.eligible || item.meetingClosed || item.ownChoice === choice || votesInFlight.current.has(item.id)) return;
    const session = authRevision.current;
    votesInFlight.current.add(item.id);
    setPending(old => ({ ...old, [item.id]: choice }));
    setVoteFeedback(old => {
      const next = { ...old };
      delete next[item.id];
      return next;
    });
    try {
      await boardRequest(token.current, { action: "vote", id: item.id, choice });
      if (authRevision.current !== session) return;
      setBoard(previous => previous ? {
        ...previous,
        proposals: previous.proposals.map(candidate => candidate.id === item.id ? {
          ...candidate, ownChoice: choice, ownAvailability: null,
          waiting: candidate.waiting.filter(person => person.id !== previous.viewerId),
          responses: [...candidate.responses.filter(person => person.id !== previous.viewerId), {
            id: previous.viewerId, name: previous.memberName ?? PROJECT_ORGANIZER_NAME,
            choice, avatar: responseAvatar(previous, candidate) ?? null, avatarStyle: previous.profile?.avatarStyle ?? null, availability: null,
          }],
        } : candidate),
      } : previous);
      setVoteFeedback(old => ({ ...old, [item.id]: { message: "voted" } }));
      setRevealed(item.id);
      await refresh().catch(() => {});
    } catch (error) {
      if (authRevision.current !== session) return;
      setVoteFeedback(old => ({ ...old, [item.id]: { message: (error as Error).message as Message, error: true } }));
      void refresh().catch(() => {});
    } finally {
      if (authRevision.current === session) {
        votesInFlight.current.delete(item.id);
        setPending(old => {
          const next = { ...old };
          delete next[item.id];
          return next;
        });
      }
    }
  }

  function switchMode(next: Mode) {
    if (editing && next === "reply") endEdit();
    setMode(next);
    setFeedback(undefined);
  }

  function selectMeeting(id: string) {
    setActiveMeetingId(id);
    if (window.matchMedia("(max-width: 920px)").matches) {
      requestAnimationFrame(() => {
        const card = document.getElementById(`meeting-${id}`);
        card?.focus({ preventScroll: true });
        document.getElementById("project-meeting-detail")?.scrollIntoView({ block: "start" });
      });
    }
  }

  function applyProposalInput(input: ProposalInput) {
    setTitle(input.title);
    setMeetingUrl(input.meetingUrl);
    setWindows(input.windows);
    setZone(input.zone);
    setDuration(input.duration);
    setRespondentAvatars(input.respondentAvatars);
  }

  function resetProposal() {
    if (editing) {
      applyProposalInput(editing.saved);
    } else {
      applyProposalInput({
        title: "", meetingUrl: "", zone, duration: 30, respondentAvatars: [],
        windows: [{ key: nextWindowKey.current++, date: wallTime(Date.now(), zone).slice(0, 10), from: "", to: "" }],
      });
    }
    setFeedback(undefined);
  }

  function resetCandidateTimes() {
    const key = nextWindowKey.current++;
    setWindows([{ key, date: wallTime(Date.now(), zone).slice(0, 10), from: "", to: "" }]);
    setFeedback(undefined);
    requestAnimationFrame(() => document.getElementById(`project-window-date-${key}`)?.focus());
  }

  function editMeeting(slots: Proposal[]) {
    const [item] = slots;
    newProposalDraft.current = { title, meetingUrl, windows, zone, duration, respondentAvatars };
    const saved = {
      title: item.title, meetingUrl: item.meetingUrl ?? "", zone, duration: item.duration, respondentAvatars: [],
      windows: slots.map(slot => {
        const time = wallTime(slot.start, zone);
        return { key: nextWindowKey.current++, date: time.slice(0, 10), from: time.slice(11, 16), to: "" };
      }),
    };
    setEditing({ item, saved, confirmed: slots.find(slot => slot.confirmed) });
    applyProposalInput(saved);
    setMode("propose");
    setFeedback(undefined);
    requestAnimationFrame(() => {
      content.current?.focus({ preventScroll: true });
      content.current?.scrollIntoView({ block: "start" });
    });
  }

  function endEdit() {
    if (newProposalDraft.current) applyProposalInput(newProposalDraft.current);
    newProposalDraft.current = null;
    setEditing(null);
  }

  function retryPortraits() {
    setPortraitErrors(old => ({ ...old, kirie: false }));
    setPortraitRetry(value => value + 1);
  }

  function toggleAudience(avatar: ProjectAvatar) {
    setRespondentAvatars(old => old.includes(avatar) ? old.filter(entry => entry !== avatar) : [...old, avatar]);
  }

  function editRespondent() {
    if (profile) {
      setChosen(profile.avatar);
      setDisplayName(profile.displayName ?? ownName);
    }
    setEditingRespondent(true);
    setFeedback(undefined);
  }

  async function saveRespondent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosen || selectedTaken || (requiresName && !displayName.trim())) return;
    const avatarStyle = chosen === "09" ? "wide" : "kirie";
    if (publicChooser) {
      const session = authRevision.current;
      const result = await perform({ action: "join", avatar: chosen, avatarStyle, name: `${t.character} ${Number(chosen)}` }, "profileSaved");
      if (!result && session === authRevision.current) {
        const available = await boardRequest<GuestEntry>("", undefined, "/api/project?join=1").catch(() => null);
        if (session === authRevision.current && available) setGuestEntry(available);
      }
      return;
    }
    if (await perform({ action: "profile", avatar: chosen, avatarStyle, name: displayName }, "profileSaved")) {
      setBoard(previous => previous ? {
        ...previous,
        profile: { avatar: chosen, avatarStyle, displayName: requiresName ? displayName.trim() : null },
      } : previous);
      setEditingRespondent(false);
      setInitials(false);
      setRevealed(null);
      requestAnimationFrame(() => content.current?.focus({ preventScroll: true }));
    }
  }

  function updateWindow(key: number, patch: Partial<CandidateWindow>) {
    setWindows(old => old.map(window => window.key === key ? { ...window, ...patch } : window));
  }

  function addWindow() {
    const key = nextWindowKey.current++;
    setWindows(old => [...old, { key, date: old.at(-1)?.date ?? "", from: "", to: "" }]);
    requestAnimationFrame(() => document.getElementById(`project-window-date-${key}`)?.focus());
  }

  async function propose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview?.starts?.length || readyWindows.length !== windows.length) return;
    const entries = { title, meetingUrl, windows: windows.map(({ date, from, to }) => ({ date, from, to })), zone, duration };
    const created = await perform<{ meetingId: string | null; id: string }>({
      ...entries, ...(editing ? { action: "edit", id: editing.item.id } : { action: "propose", respondentAvatars }),
    }, editing ? "savedEdit" : "posted");
    if (created) {
      if (editing) {
        endEdit();
      } else {
        setTitle("");
        setMeetingUrl("");
        setWindows([{ key: nextWindowKey.current++, date: wallTime(Date.now(), zone).slice(0, 10), from: "", to: "" }]);
        setRespondentAvatars([]);
      }
      setMeetingFilter("all");
      setLinkedMeeting(created.meetingId ?? created.id);
      setActiveMeetingId(created.meetingId ?? created.id);
      setMode("reply");
      requestAnimationFrame(() => content.current?.focus({ preventScroll: true }));
    }
  }

  function openConfirm(item: Proposal) {
    if (item.confirmed) {
      void perform({ action: "reopen", id: item.id }, "reopened");
    } else {
      setFeedback(undefined);
      setDialog({ action: "confirm", item });
    }
  }

  function openDelete(item: Proposal) {
    setFeedback(undefined);
    setDialog({ action: "delete", item });
  }

  async function submitDialog() {
    if (!dialog) return;
    const { action, item } = dialog;
    if (!await perform({ action, id: item.id }, action === "delete" ? "deletedMeeting" : "confirmedSaved")) return;
    if (action === "delete") {
      const meetingId = item.meetingId ?? item.id;
      if (linkedMeeting === meetingId) setLinkedMeeting(null);
      if (activeMeetingId === meetingId) setActiveMeetingId(null);
      requestAnimationFrame(() => content.current?.focus({ preventScroll: true }));
    }
    confirmation.current?.close();
  }

  const status = feedback && <p className={"project-feedback" + (feedback.error ? " is-error" : "")}
    role={feedback.error ? "alert" : "status"}><Ink text={t[feedback.message] ?? t.unavailable} /></p>;

  return <div className="project-site island-edition renewed-project" data-open-board={Boolean(board) || undefined}>
    <ScheduleHeader language={language} compact={Boolean(board)} onLanguageChange={lang => {
      setLanguage(lang);
      try { localStorage.setItem("tagiri-schedule-language", lang); } catch {}
    }} />
    <main className="project-shell">
      {chooseRespondent ? <>
        <section className="project-identify sl-casting" data-public={publicChooser || undefined}
          ref={casting} tabIndex={-1} aria-labelledby="project-choose-respondent">
          <header className="sl-casting-heading">
            <div className="schedule-form-heading">
              <h2 id="project-choose-respondent"><Ink text={t.choose} /></h2>
            </div>
            <p><Ink text={t.chooseHint} /></p>
          </header>
          <form className="sl-casting-form" onSubmit={saveRespondent}>
            {!avatarChoices.length ? <p className="project-muted" role="status"><Ink text={t.noGuestAvatars} /></p>
              : activePortraits ? <div className="project-portrait-grid sl-casting-grid">
              {avatarChoices.map(id => {
                const portrait = activePortraits[id];
                if (!portrait) return null;
                const taken = board?.takenAvatars.includes(id) ?? false;
                const selected = !taken && chosen === id;
                const detail = taken ? t.taken : selected ? t.selected : !publicChooser && customPortrait(id) ? t.unnamed : "";
                return <button className="project-portrait" type="button" key={id} disabled={taken || busy} data-taken={taken || undefined}
                  aria-label={t.character + " " + Number(id) + (detail ? " · " + detail : "")} aria-pressed={selected} data-portrait-id={id}
                  onClick={() => {
                    setChosen(id);
                    setDisplayName(old => old || ownName);
                    setFeedback(undefined);
                  }}>
                  <img className="project-portrait-photo" src={portrait} alt="" width={400} height={400} />
                  {selected && <span className="sl-casting-check" aria-hidden="true"><img src="/project/art/u04.webp" width={24} height={24} alt="" /></span>}
                  {detail && <span className="project-portrait-tag"><Ink text={detail} /></span>}
                </button>;
              })}
            </div> : <p className="project-muted" role="status">
              {portraitErrors.kirie ? <><Ink text={t.portraitFailed} /> <button className="project-secondary" type="button" onClick={retryPortraits}><Ink text={t.refresh} /></button></> : <Ink text={t.loading} />}
            </p>}
            <div className="sl-casting-confirm">
              <div className="sl-casting-pass" data-selected={Boolean(chosen && !selectedTaken) || undefined}>
                {chosen && !selectedTaken && activePortraits && <img className="sl-selected-photo" src={activePortraits[chosen]} alt="" width={200} height={200} />}
                <div aria-live="polite"><strong><Ink text={chosen && !selectedTaken ? (publicChooser ? t.character + " " + Number(chosen) : requiresName ? displayName.trim() || t.unnamed : ownName) : (language === "ja" ? "未選択" : "Select a portrait")} /></strong>
                </div>
              </div>
              {requiresName && !selectedTaken && <Field label={<Ink text={t.name} />}>
                <input value={displayName} required maxLength={MAX_NAME_LENGTH} onChange={event => setDisplayName(event.target.value)} />
              </Field>}
              {allTaken && <p className="project-muted"><Ink text={t.full} /></p>}
              {!dialog && status}
              <div className="project-identify-actions">
                {allTaken ? <button className="project-primary" type="button" onClick={() => {
                  setEditingRespondent(false);
                  setInitials(true);
                }}><Ink text={t.useInitial} /></button> :
                  avatarChoices.length > 0 && <button className="project-primary" type="submit" disabled={!chosen || busy || selectedTaken || (requiresName && !displayName.trim())}>
                    <Ink text={busy ? t.saving : t.pick} />
                  </button>}
                {editingRespondent && <button className="project-secondary" type="button" disabled={busy} onClick={() => {
                  setEditingRespondent(false);
                  setFeedback(undefined);
                }}><Ink text={t.cancel} /></button>}
              </div>
            </div>
          </form>
        </section>
        <div className="island-board-clocks island-board-clocks-after-cast"><ProjectClocks language={language} /></div>
        {publicChooser && <>
          <IslandHero language={language} onStart={() => {
            casting.current?.focus({ preventScroll: true });
            casting.current?.scrollIntoView({ block: "start" });
          }} />
          <IslandGuide language={language} />
          <a href="/?manage=1" className="project-manage-link">{t.manage}</a>
        </>}
      </> : board ? <>
          <div className="island-board-clocks"><ProjectClocks language={language} /></div>
          <div className="island-tools">
            <div className="project-identity">
              <Avatar src={profile ? photo(sets, profile.avatar) : undefined} name={ownName} />
              <div className="island-identity-label"><span><Ink text={board.organizer ? t.organizer : t.portrait} /></span><strong><Ink text={ownName} /></strong></div>
              {!board.guest && <button type="button" className="island-switch" onClick={editRespondent} aria-label={t.change}>
                <Ink text={language === "ja" ? "変更" : "Change"} />
              </button>}
            </div>
            {(mode === "propose" || audienceSlot) && <div className="toolbar-audience" role="group" aria-label={t.audience}>
              <strong><Ink text={t.audience} /></strong>
              <AudienceIcons board={board} sets={sets} language={language} limit={4}
                meeting={mode === "propose" ? editing?.item : audienceSlot} draft={respondentAvatars} />
            </div>}
            {!board.guest && <nav className="project-mode" aria-label={t.mode}>
              {(["reply", "propose"] as const).map(action => <button key={action} type="button" data-mode={action}
                disabled={busy} aria-pressed={mode === action} onClick={() => switchMode(action)}>
                <strong className="project-mode-label"><Ink text={action === "propose" ? t.propose : t.reply} /></strong>
              </button>)}
            </nav>}
          </div>
          {!dialog && status}
          {mode === "reply" && <section className="project-list" ref={content} tabIndex={-1} aria-labelledby="project-candidates">
            <div className="island-list-head"><h2 id="project-candidates"><Ink text={t.meetingList} /></h2></div>
            {orderedMeetings.length === 0 ? <div className="project-empty"><p><Ink text={t.noProposals} /></p>
              {!board.guest && <button className="project-primary" type="button" onClick={() => switchMode("propose")}><Ink text={t.propose} /></button>}
            </div> : <div className="meeting-workbench">
              <nav id="project-meeting-picker" className="meeting-picker" aria-label={t.meetingList} tabIndex={-1}>
                <div className="island-list-filter" role="group" aria-label={language === "ja" ? "打ち合わせの表示" : "Meetings to display"}>
                  {(["all", "mine", "confirmed"] as const).map(filter => <button key={filter} type="button" aria-pressed={meetingFilter === filter}
                    onClick={() => setMeetingFilter(filter)}>
                    {filter === "all" ? t.allMeetings : filter === "mine" ? t.myMeetings : t.confirmedMeetings} <b>{meetingLists[filter].length}</b>
                  </button>)}
                </div>
                {displayedMeetings.length > 0 && <ul className="meeting-index">
                  {displayedMeetings.map(([id, slots]) => {
                    const [first] = slots;
                    const confirmed = slots.find(slot => slot.confirmed);
                    const pendingCount = slots.filter(slot => slot.eligible && !slot.ownChoice).length;
                    const active = id === selectedMeetingId;
                    const state = confirmed ? "confirmed" : first.meetingClosed ? "closed" : !first.eligible ? "open" : pendingCount ? "pending" : "answered";
                    const label = state === "confirmed" ? t.confirmedMeetings : state === "closed" ? t.closed : state === "open" ? t.open
                      : state === "answered" ? t.votedState : language === "ja" ? `未回答 ${pendingCount}枠` : `${pendingCount} unanswered`;
                    const date = confirmed?.start ?? first.start;
                    return <li key={id}>
                      <button className="meeting-index-item" type="button" aria-current={active ? "true" : undefined} onClick={() => selectMeeting(id)}>
                        <span className="meeting-index-title">{first.title || t.meeting}</span>
                        <span className="meeting-index-badge" data-state={state}>{label}</span>
                        <span className="meeting-index-date">{dateLabel(date, zone, language)} · {timeLabel(date, zone, language)} {zone === COLOMBO ? "SLST" : "JST"}</span>
                        <ChevronRight size={16} className="meeting-index-chevron" aria-hidden="true" />
                      </button>
                    </li>;
                  })}
                </ul>}
              </nav>
              {selectedMeeting ? <div id="project-meeting-detail" className="meeting-detail">
                <button className="meeting-index-back" type="button" onClick={() => {
                  const list = document.getElementById("project-meeting-picker");
                  list?.focus({ preventScroll: true });
                  list?.scrollIntoView({ block: "start" });
                }}><ArrowUp size={15} aria-hidden="true" />{language === "ja" ? <Ink text={t.meetingList} /> : t.meetingList}</button>
                <MeetingCard key={selectedMeeting[0]} slots={selectedMeeting[1]} board={board} sets={sets}
                  language={language} pending={pending} feedback={voteFeedback} busy={busy} revealed={revealed}
                  onVote={(slot, choice) => { void vote(slot, choice); }} onConfirm={openConfirm} onEdit={editMeeting} onDelete={openDelete} />
              </div> : <div className="meeting-index-empty"><p>{meetingFilter === "confirmed" ? t.noConfirmedMeetings : t.noMyMeetings}</p>
                <button type="button" className="project-secondary" onClick={() => setMeetingFilter("all")}>{t.allMeetings}</button>
              </div>}
            </div>}
          </section>}
          {mode === "propose" && <section className="project-compose proposal-studio" ref={content} tabIndex={-1} aria-labelledby="project-new-time">
            <header className="proposal-title schedule-form-heading">
              <h2 id="project-new-time"><Ink text={editing ? t.editHeading : t.propose} /></h2>
              <div className="proposal-edit-actions">
                {editing && <button type="button" className="project-secondary" disabled={busy} onClick={resetCandidateTimes}>
                  <Ink text={t.resetCandidateTimes} />
                </button>}
                <button type="button" className="project-secondary" disabled={busy || (!editing && !canResetDraft)} onClick={resetProposal}>
                  <Ink text={editing ? t.restoreEdit : t.resetDraft} />
                </button>
              </div>
            </header>
            <form onSubmit={propose}>
              <div className="proposal-editor">
                <section className="proposal-timing" aria-labelledby="proposal-timing-heading">
                  <h3 id="proposal-timing-heading"><Ink text={t.window} /></h3>
                  {editing && <p className="proposal-edit-hint" role="status"><Ink text={editReopens ? t.editReopens + " " + t.editHint : t.editHint} /></p>}
                  <Field label={<Ink text={t.title} />}><input value={title} maxLength={100} placeholder={t.placeholder} onChange={event => setTitle(event.target.value)} /></Field>
                  <Field label={<Ink text={t.joinUrl} />}><input type="url" value={meetingUrl} maxLength={2048} placeholder="https://"
                    aria-describedby="project-meeting-url-hint" onChange={event => setMeetingUrl(event.target.value)} /></Field>
                  <p id="project-meeting-url-hint" className="proposal-meeting-url-hint">{t.joinUrlHint}</p>
                  <div className="proposal-settings">
                    <Field label={<span className="proposal-field-label"><Ink text={t.zone} /></span>}><DisplayedInput display={placeName(zone, language)}><select aria-label={t.zone} value={zone} onChange={event => setZone(event.target.value)}>
                      {ZONES.map(value => <option key={value} value={value}>{placeName(value, language)}</option>)}
                    </select></DisplayedInput></Field>
                    <Field label={<span className="proposal-field-label"><Ink text={t.duration} /></span>}><DisplayedInput display={duration + t.minute}><select value={duration} onChange={event => setDuration(Number(event.target.value))}>
                      {DURATIONS.map(value => <option value={value} key={value}>{value}{t.minute}</option>)}
                    </select></DisplayedInput></Field>
                  </div>
                  <p className="proposal-length-note"><Ink text={language === "ja"
                    ? `終了時刻までを${duration}分ずつに分けます。開始時刻だけなら1枠です。`
                    : `Each window is divided into ${duration}-minute slots. A start time alone creates one slot.`} /></p>
                  <div className="proposal-windows">
                    {windows.map((window, index) => <div className="proposal-window" key={window.key} role="group" aria-labelledby={`project-window-heading-${window.key}`}>
                      <strong className="proposal-window-heading" id={`project-window-heading-${window.key}`}><Ink text={language === "ja" ? `候補 ${index + 1}` : `Window ${index + 1}`} /></strong>
                      <Field label={<span className="proposal-field-label"><Ink text={t.date} /></span>}><DisplayedInput display={formatInputDate(window.date, language)}><input id={`project-window-date-${window.key}`} type="date" value={window.date} required
                        onInput={event => updateWindow(window.key, { date: event.currentTarget.value })} /></DisplayedInput></Field>
                      <Field label={<Ink text={t.time} />}>
                        <DisplayedInput display={window.from || "––:––"}>
                          <input aria-label={t.time} type="time" value={window.from} required onInput={event => updateWindow(window.key, { from: event.currentTarget.value })} />
                        </DisplayedInput>
                      </Field>
                      <Field label={<span className="proposal-end-label"><Ink text={t.end} /><small><Ink text={"(" + t.optional + ")"} /></small></span>}>
                        <DisplayedInput display={window.to || "––:––"}>
                          <input aria-label={t.end} type="time" value={window.to} onInput={event => updateWindow(window.key, { to: event.currentTarget.value })} />
                        </DisplayedInput>
                      </Field>
                      {windows.length > 1 && <button className="proposal-remove" type="button" aria-label={t.window + " " + (index + 1) + " · " + t.removeWindow}
                        onClick={() => setWindows(old => old.filter(entry => entry.key !== window.key))}><Ink text={t.removeWindow} /></button>}
                    </div>)}
                  </div>
                  <button className="proposal-window-add" type="button" onClick={addWindow}>
                    <span aria-hidden="true"><Ink text="＋" /></span><Ink text={t.addWindow} />
                  </button>
                  {preview?.error && <p className="project-feedback is-error" role="status"><Ink text={t[preview.error]} /></p>}
                </section>
                {!editing && <fieldset className="proposal-cast">
                  <legend><Ink text={t.respondents} /></legend>
                  <div className="proposal-cast-intro">
                    <p><Ink text={t.audienceHint} /></p>
                    <button className="proposal-everyone" type="button" aria-pressed={respondentAvatars.length === 0}
                      disabled={busy} onClick={() => setRespondentAvatars([])}>
                      <Ink text={t.allMembers} />
                    </button>
                  </div>
                  {activePortraits ? <div className="proposal-faces">
                    {AVATAR_IDS.map(avatar => {
                      const owner = board.portraitOwners[avatar];
                      const name = owner ? localName(owner.name, language) : t.unregistered;
                      const self = owner?.id === board.viewerId;
                      const selected = respondentAvatars.includes(avatar);
                      const label = owner ? name + (self ? ` · ${t.self}` : "") : `${t.portrait} ${Number(avatar)} · ${name}`;
                      return <button className="proposal-face" type="button" key={avatar} data-portrait-id={avatar}
                        aria-label={label} title={label} aria-pressed={selected} disabled={busy} onClick={() => toggleAudience(avatar)}>
                        <span className="proposal-face-art">
                          <img src={activePortraits[avatar]} alt="" width={100} height={100} />
                          {selected && <span className="proposal-check" aria-hidden="true"><img src="/project/art/u04.webp" width={24} height={24} alt="" /></span>}
                        </span>
                        {owner && <span className="proposal-face-name"><Ink text={self ? t.self : name} /></span>}
                      </button>;
                    })}
                  </div> : <p role="status">
                    {portraitErrors.kirie ? <><Ink text={t.portraitFailed} /> <button className="project-secondary" type="button" onClick={retryPortraits}><Ink text={t.refresh} /></button></> : <Ink text={t.loading} />}
                  </p>}
                  <p className="proposal-cast-status" role="status">
                    <Ink text={respondentAvatars.length
                      ? (language === "ja" ? `${respondentAvatars.length}人に回答を依頼` : `${respondentAvatars.length} selected`)
                      : (language === "ja" ? "全員に回答を依頼" : "Everyone can respond")} />
                  </p>
                </fieldset>}

              </div>

              <aside className="proposal-review" aria-labelledby="proposal-review-heading">
                <div className="proposal-review-body">
                  <header className="proposal-review-head">
                    <h3 id="proposal-review-heading"><Ink text={t.converted} /></h3>
                    <strong aria-live="polite"><Ink text={(preview?.starts?.length ?? 0) + " " + t.slotUnit} /></strong>
                  </header>
                  {title.trim() && <p className="proposal-review-title"><Ink text={title.trim()} /></p>}
                  <div className="proposal-recipients">
                    {editing ? <AudienceIcons board={board} sets={sets} language={language} meeting={editing.item} limit={4} /> : <>
                    {respondentAvatars.length && activePortraits ? <div className="proposal-face-stack" aria-hidden="true">
                      {respondentAvatars.map(avatar => <img key={avatar} src={activePortraits[avatar]} alt="" width={28} height={28} />)}
                    </div> : null}
                    <span><Ink text={respondentAvatars.length ? respondentAvatars.length + t.personUnit : t.allMembers} /></span></>}
                    <span className="proposal-review-duration"><Ink text={duration + t.minute} /></span>
                  </div>
                  <div className="proposal-zone-headings">{ZONES.map(value => <div key={value}>
                    <Ink text={placeName(value, language)} />
                  </div>)}</div>
                  {preview?.starts?.length ? <ol className="proposal-slot-values">{preview.starts.map(start => <li key={start}>{ZONES.map(value => {
                    const date = dateLabel(start, value, language);
                    const endDate = dateLabel(start + duration * 60_000, value, language);
                    return <div key={value}>
                      <small><Ink text={date === endDate ? date : date + " – " + endDate} /></small>
                      <strong><Ink text={timeLabel(start, value, language) + "–" + timeLabel(start + duration * 60_000, value, language)} /></strong>
                    </div>;
                  })}</li>)}</ol> :
                    <p className="proposal-preview-empty"><Ink text={language === "ja" ? "日付と開始時刻を入れると、両国の候補日時が並びます。" : "Enter a date and start time to see the slots in both countries."} /></p>}
                </div>
                <div className={`proposal-ticket-bottom${editing ? " proposal-editor-footer" : ""}`}>
                  {editing && <button type="button" className="project-secondary" disabled={busy} onClick={() => switchMode("reply")}><Ink text={t.cancelEdit} /></button>}
                  <button type="submit" className="proposal-submit" disabled={busy || !preview?.starts?.length || readyWindows.length !== windows.length}>
                    <Ink text={busy ? t.saving : editing ? t.saveEdit : t.post} />
                  </button>
                </div>
              </aside>
            </form>
          </section>}
      </> : <div className="island-landing-actions">
        <section className="renewed-entry" aria-labelledby="sl-entry-title" aria-busy={loading || undefined}>
          <div className="renewed-entry-content">
            <h2 id="sl-entry-title"><Ink text={manageEntry ? t.manage : t.choose} /></h2>
            {loading ? <p role="status"><Ink text={t.loading} /></p>
              : manageEntry && feedback?.message === "inviteRequired"
                ? <a className="project-primary renewed-signin" href={managementSignIn(signInPath, linkedMeeting)} target="_top"><Ink text={t.signIn} /></a>
                : <>{status}<button type="button" className="project-secondary" onClick={openBoard}><Ink text={t.refresh} /></button></>}
          </div>
        </section>
      </div>}

      <dialog className="project-confirm" ref={confirmation} aria-labelledby="project-confirm-title"
        onCancel={event => { if (busy) event.preventDefault(); }} onClose={() => setDialog(null)}>
        {dialog && <>
          <header>
            <img src="/project/art/u04.webp" width={32} height={32} alt="" />
            <h2 id="project-confirm-title"><Ink text={dialog.action === "delete" ? t.deleteHeading : t.confirm} /></h2>
          </header>
          <div>
            <h3><Ink text={dialog.item.title || t.meeting} /></h3>
            {dialog.action === "confirm" && <ProjectTimes start={dialog.item.start} duration={dialog.item.duration} language={language} />}
            <p><Ink text={dialog.action === "delete" ? t.deletePrompt : t.confirmPrompt} /></p>
            {feedback?.error && status}
            <footer>
              <button type="button" className="project-secondary" autoFocus disabled={busy} onClick={() => confirmation.current?.close()}>
                <Ink text={dialog.action === "delete" ? t.cancelEdit : t.backToEntry} />
              </button>
              <button type="button" className={`project-primary${dialog.action === "delete" ? " meeting-delete" : ""}`} disabled={busy} onClick={() => { void submitDialog(); }}>
                <Ink text={busy ? t.saving : dialog.action === "delete" ? t.deleteHeading : t.confirm} />
              </button>
            </footer>
          </div>
        </>}
      </dialog>
    </main>
    <IslandFooter language={language} />
  </div>;
}
