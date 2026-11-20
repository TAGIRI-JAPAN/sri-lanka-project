"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  cities, choices, dateLabel, marks, MAX_NAME_LENGTH, timeLabel,
  timeRange, validZone, zoneName, type Choice, type Language, type Poll, type PollSummary,
} from "@/lib/schedule";
import "./island-archive.css";

const strings = {
  ja: {
    product: "日程調整",
    archive: "日程調整アーカイブ",
    slots: "候補日時",
    inProgress: "処理中…",
    invitees: "指定した回答者", pending: "未回答", answered: "回答済み",
    inviteRequired: "主催者から届いた専用の回答リンクを開いてください。",
    mine: "作成した日程", noPolls: "作成した日程がここに表示されます。",
    back: "プロジェクトへ", loading: "読み込み中…",
    view: "表示する時間帯", attendee: "回答する", results: "回答一覧", legend: "○ 参加可　△ 未定　× 参加不可",
    name: "お名前", nameExample: "例：山田 太郎", yes: "参加可", maybe: "未定", no: "参加不可",
    progress: (answered: number, total: number) => `${total}件中 ${answered}件を選択`,
    send: "回答を保存", update: "回答を更新", saved: "回答を保存しました。",
    link: "回答リンクをコピー", copied: "リンクをコピーしました。", refresh: "集計を更新",
    copiedFail: "下のリンクを選んでコピーしてください。", missing: "この日程調整が見つかりません。",
    closed: "日程が確定しました。", reopen: "回答受付を再開", finalize: "この候補で確定",
    confirm: "この候補で日程を確定し、回答受付を終了しますか？",
    noResponses: "まだ回答がありません。", respondents: "件の回答", best: "最多支持", selected: "確定済み",
    open: "受付中", chooseAll: "すべての候補に回答してください。",
    invalid: "入力内容を確認してください。",
    unavailable: "一時的に利用できません。時間をおいて再試行してください。",
    forbidden: "この操作には主催者のログインが必要です。",
    sharing: "リンクを開ける人には回答者名と回答内容が表示されます。",
  },
  en: {
    product: "Scheduling",
    archive: "Scheduling archive",
    slots: "Suggested times",
    inProgress: "Working…",
    invitees: "Designated respondents", pending: "Awaiting response", answered: "Responded",
    inviteRequired: "Open the individual response link sent by the organizer.",
    mine: "Your polls", noPolls: "Polls you create will appear here.",
    back: "Back to project", loading: "Loading…",
    view: "Display time zone", attendee: "Your response", results: "Responses", legend: "○ Yes　△ Maybe　× No",
    name: "Your name", nameExample: "e.g. Alex Example", yes: "Yes", maybe: "Maybe", no: "No",
    progress: (answered: number, total: number) => `${answered} of ${total} selected`,
    send: "Submit response", update: "Update response", saved: "Your response was saved.",
    link: "Copy response link", copied: "Link copied.", refresh: "Refresh results",
    copiedFail: "Select and copy the link below.", missing: "This poll could not be found.",
    closed: "The meeting time is confirmed.", reopen: "Reopen voting", finalize: "Confirm this time",
    confirm: "Confirm this time and close voting?",
    noResponses: "No responses yet.", respondents: "responses", best: "Top choice", selected: "Confirmed",
    open: "Open", chooseAll: "Please answer every suggested time.",
    invalid: "Check your entries and try again.",
    unavailable: "Temporarily unavailable. Please try again shortly.",
    forbidden: "Only the signed-in organizer can do this.",
    sharing: "People who can open the link can see respondent names and their answers.",
  },
} as const;

export function getDeviceZone(available: string[], defaultZone: string) {
  const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return available.find(zone => new Intl.DateTimeFormat("en", { timeZone: zone }).resolvedOptions().timeZone === device)
    ?? defaultZone;
}

export function ZoneOptions({ language, existing = [] }: { language: Language; existing?: string[] }) {
  return [...new Set([...Object.keys(cities), ...existing])].map(zone => (
    <option key={zone} value={zone}>{zoneName(zone, language)}</option>
  ));
}

function errorText(language: Language, code: string) {
  const t = strings[language];
  const messages: Record<string, string> = {
    invalid: t.invalid, unavailable: t.unavailable,
    forbidden: t.forbidden, missing: t.missing, closed: t.closed, inviteRequired: t.inviteRequired,
  };
  return messages[code] ?? t.unavailable;
}

async function request<T>(id?: string, body?: object, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["X-Voter-Token"] = token;
  const response = await fetch("/api/schedules" + (id ? "?id=" + encodeURIComponent(id) : ""), {
    method: body ? "POST" : "GET", headers, cache: "no-store", body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const failure = await response.json<{ error?: string }>().catch(() => null);
    throw new Error(failure?.error ?? "unavailable");
  }
  return response.json();
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function ArchiveBanner({ title, language, children }: { title: string; language: Language; children?: ReactNode }) {
  return <section className="island-archive-banner">
    <a href="/" className="island-archive-back">{strings[language].back}</a>
    <div className="island-archive-heading"><h1>{title}</h1>{children}</div>
  </section>;
}

function ScheduleArchive({ language, signedIn }: { language: Language; signedIn: boolean }) {
  const t = strings[language];
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [listError, setListError] = useState(false);
  useEffect(() => {
    if (signedIn) request<{ polls: PollSummary[] }>().then(data => setPolls(data.polls)).catch(() => setListError(true));
  }, [signedIn]);

  return <>
    <ArchiveBanner title={t.archive} language={language} />
    <section className="panel previous">
      <h2>{t.mine}</h2>
      {!signedIn ? <p>{t.forbidden}</p> : <>
        {listError && <p role="alert">{t.unavailable}</p>}
        {!listError && polls.length === 0 && <p>{t.noPolls}</p>}
        {polls.length > 0 && <ul>{polls.map(poll => <li key={poll.id}><a href={"/?poll=" + poll.id}><span>{poll.title}</span><small className={"status" + (poll.finalSlot !== null ? " confirmed" : "")}>{poll.finalSlot === null ? t.open : t.selected}</small></a></li>)}</ul>}
      </>}
    </section>
  </>;
}

function TimePair({ value, duration, zone, partner, language }: { value: number; duration: number; zone: string; partner: string; language: Language }) {
  const shown = zone === partner ? [zone] : [zone, partner];
  return <div className="time-pair">{shown.map((item, index) => <div key={item} className={index === 0 ? "time-first" : "time-second"}>
    <span>{zoneName(item, language)} · {dateLabel(value, item, language)}</span>
    <strong>{timeRange(value, duration, item, language)}</strong>
  </div>)}</div>;
}

function PollView({ id, language }: { id: string; language: Language }) {
  const t = strings[language];
  const [poll, setPoll] = useState<Poll | null>(null);
  const [token, setToken] = useState("");
  const activeToken = useRef("");
  const [zone, setZone] = useState("");
  const [name, setName] = useState("");
  const [votes, setVotes] = useState<(Choice | undefined)[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<"saved" | "copied" | "copiedFail" | "">("");
  const [copiedLink, setCopiedLink] = useState("");

  const load = useCallback(async (voter: string, fillForm = false) => {
    const data = await request<Poll>(id, undefined, voter);
    if (activeToken.current !== voter) return;
    setPoll(data);
    if (fillForm) {
      setZone(current => current || getDeviceZone([...Object.keys(cities), data.organizerZone, data.partnerZone], data.organizerZone));
      setName(data.guestName ?? data.ownVote?.name ?? "");
      setVotes(data.ownVote?.votes ?? data.slots.map(() => undefined));
    }
  }, [id]);

  useEffect(() => {
    function openBallot() {
      let voter = new URLSearchParams(window.location.hash.slice(1)).get("invite");
      if (!voter) {
        voter = crypto.randomUUID();
        try {
          const key = "tagiri-vote-" + id;
          voter = localStorage.getItem(key) || voter;
          localStorage.setItem(key, voter);
        } catch {}
      }
      setPoll(null);
      setError("");
      setNotice("");
      activeToken.current = voter;
      setToken(voter);
      load(voter, true).catch(failure => {
        if (activeToken.current === voter) setError(failure.message);
      });
    }
    openBallot();
    window.addEventListener("hashchange", openBallot);
    return () => window.removeEventListener("hashchange", openBallot);
  }, [id, load]);

  const counts = useMemo(() => poll?.slots.map((_, index) => {
    return { yes: poll.responses.filter(reply => reply.votes[index] === "yes").length,
      maybe: poll.responses.filter(reply => reply.votes[index] === "maybe").length,
      no: poll.responses.filter(reply => reply.votes[index] === "no").length };
  }) ?? [], [poll]);

  if (!poll) return <>
    <ArchiveBanner title={t.product} language={language} />
    <section className="panel state" role="status">{error ? errorText(language, error) : t.loading}</section>
  </>;

  const displayZone = validZone(zone) ? zone : poll.organizerZone;
  const otherZone = displayZone === poll.partnerZone ? poll.organizerZone : poll.partnerZone;
  const score = (count: { yes: number; maybe: number }) => count.yes * 2 + count.maybe;
  const highest = Math.max(0, ...counts.map(score));
  const link = typeof window === "undefined" ? "" : new URL("/?poll=" + id, window.location.origin).href;

  async function copy(invite?: string) {
    const target = invite ? link + "#invite=" + invite : link;
    setCopiedLink(target);
    try {
      await navigator.clipboard.writeText(target);
      setNotice("copied");
    } catch {
      setNotice("copiedFail");
    }
  }

  async function mutate(action: object, wasVote = false) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await request(id, { ...action, id }, token);
      if (wasVote) setNotice("saved");
      await load(token, wasVote);
    } catch (failure) {
      const code = (failure as Error).message;
      setError(code);
      if (code === "closed") await load(token).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  return <>
    <ArchiveBanner title={poll.title} language={language}>
      <span className={"status" + (poll.finalSlot !== null ? " confirmed" : "")}>{poll.finalSlot === null ? t.open : t.selected}</span>
    </ArchiveBanner>
    <section className="panel poll-hero" aria-label={t.product}>
      {poll.note && <p className="poll-note">{poll.note}</p>}
      <div className="poll-controls">
        <Field label={t.view}><select value={displayZone} onChange={event => setZone(event.target.value)}>
          <ZoneOptions language={language} existing={[poll.organizerZone, poll.partnerZone]} />
        </select></Field>
        {!poll.restricted && <button type="button" className="button button-light" onClick={() => copy()}>{t.link}</button>}
      </div>
      {!poll.restricted && notice && notice !== "saved" && <p role="status" className="notice">{t[notice]}</p>}
      {poll.finalSlot !== null && notice === "saved" && <p role="status" className="notice island-archive-saved">{t.saved}</p>}
      {!poll.restricted && notice === "copiedFail" && <input className="copy-field" aria-label={t.link} readOnly value={copiedLink} onFocus={event => event.target.select()} />}
      {error && error !== "chooseAll" && <p className="notice error" role="alert">{errorText(language, error)}</p>}
    </section>
    {poll.invitees.length > 0 && <section className="panel invited-people">
      <h2>{t.invitees}</h2>
      <ul>{poll.invitees.map(person => <li key={person.token}>
        <div><strong>{person.name}</strong><small>{person.responded ? t.answered : t.pending}</small></div>
        <button type="button" className="button button-light" aria-label={`${person.name} · ${t.link}`} onClick={() => copy(person.token)}>{t.link}</button>
        {copiedLink.endsWith("#invite=" + person.token) && (notice === "copied" || notice === "copiedFail") &&
          <div className="invite-copy-feedback"><p role="status" className="hint">{t[notice]}</p>
            {notice === "copiedFail" && <input className="copy-field" aria-label={t.link} readOnly value={copiedLink} onFocus={event => event.target.select()} />}
          </div>}
      </li>)}</ul>
    </section>}
    {poll.finalSlot !== null
      ? <section className="panel final-panel"><h2>{t.closed}</h2><TimePair value={poll.finalSlot} duration={poll.duration} zone={displayZone} partner={otherZone} language={language} />
        {poll.managed && <button type="button" className="button button-light" disabled={busy} onClick={() => mutate({ action: "reopen" })}>{t.reopen}</button>}
      </section>
      : (!poll.restricted || poll.guestName) && <section className="panel voting">
        <h2>{t.attendee}</h2>
        <form onSubmit={event => {
          event.preventDefault();
          if (votes.some(vote => !vote) || votes.length !== poll.slots.length) {
            setError("chooseAll");
            return;
          }
          mutate({ action: "vote", name, votes }, true);
        }}>
          <Field label={t.name}><input required maxLength={MAX_NAME_LENGTH} value={name} readOnly={Boolean(poll.guestName)} onChange={event => setName(event.target.value)} placeholder={t.nameExample} /></Field>
          <div className="island-archive-voting-head">
            <h3>{t.slots}</h3>
            <p>{t.progress(votes.filter(Boolean).length, poll.slots.length)}</p>
          </div>
          {poll.slots.map((time, index) => <fieldset className="ballot" key={time}>
            <legend className="sr-only">{dateLabel(time, displayZone, language)} {timeLabel(time, displayZone, language)}</legend>
            <TimePair value={time} duration={poll.duration} zone={displayZone} partner={otherZone} language={language} />
            <div className="vote-options">{choices.map(choice => <label key={choice} className={"vote-option " + choice}>
              <input type="radio" name={"slot-" + index} value={choice} checked={votes[index] === choice} required onChange={() => setVotes(old => old.map((vote, key) => key === index ? choice : vote))} />
              <span><b aria-hidden="true">{marks[choice]}</b>{t[choice]}</span>
            </label>)}</div>
          </fieldset>)}
          <p className="hint">{t.sharing}</p>
          <button type="submit" className="button primary" disabled={busy || !token}>{busy ? t.inProgress : poll.ownVote ? t.update : t.send}</button>
          {error === "chooseAll" && <p className="notice error" role="alert">{t.chooseAll}</p>}
          {notice === "saved" && <p className="notice island-archive-saved" role="status">{t.saved}</p>}
        </form>
      </section>}
    <section className="panel results">
      <div className="results-header"><div><h2>{t.results}</h2><p>{poll.responses.length} {t.respondents}</p></div>
        <button type="button" className="button button-light" disabled={busy} onClick={async () => {
          setError("");
          setBusy(true);
          try { await load(token); } catch (failure) { setError((failure as Error).message); } finally { setBusy(false); }
        }}>{t.refresh}</button>
      </div>
      {poll.responses.length === 0 && <p>{t.noResponses}</p>}
      {(poll.responses.length > 0 || poll.managed) && <div className="result-scroll" tabIndex={0} aria-label={t.results}>
        <table>
          <thead><tr><th scope="col">{t.slots}</th><th scope="col">{t.legend}</th>{poll.responses.map((reply, index) => <th scope="col" key={index}>{reply.name}</th>)}</tr></thead>
          <tbody>{poll.slots.map((time, index) => <tr key={time} className={poll.finalSlot === time || (highest > 0 && score(counts[index]) === highest) ? "top-choice" : ""}>
            <th scope="row"><TimePair value={time} duration={poll.duration} zone={displayZone} partner={otherZone} language={language} /></th>
            <td>
              <div className="counts">{choices.map(choice => <span className={choice} key={choice}>{marks[choice]} {counts[index][choice]}</span>)}</div>
              {poll.finalSlot === time && <span className="result-badge">{t.selected}</span>}
              {poll.finalSlot === null && highest > 0 && score(counts[index]) === highest && <span className="result-badge">{t.best}</span>}
              {poll.managed && poll.finalSlot === null && <button className="text-link finalize" type="button" disabled={busy} onClick={() => {
                if (window.confirm(t.confirm)) mutate({ action: "finalize", slot: time });
              }}>{t.finalize}</button>}
            </td>
            {poll.responses.map((reply, key) => <td key={key} className={"reply " + reply.votes[index]}>{marks[reply.votes[index]]}</td>)}
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  </>;
}

export function ScheduleApp({ signedIn, pollId }: { signedIn: boolean; pollId: string }) {
  const [language, setLanguage] = useState<Language>("ja");
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("tagiri-schedule-language"); } catch {}
    setLanguage(saved === "ja" || saved === "en" ? saved : navigator.language.startsWith("ja") ? "ja" : "en");
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const t = strings[language];
  return <div className="island-archive">
    <header className="site-header"><div className="header-inner">
      <a href="/" className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /></span><strong>Sri Lanka Project</strong></a>
      <nav aria-label={language === "ja" ? "表示言語" : "Display language"} className="language">
        {(["ja", "en"] as const).map(lang => <button type="button" aria-pressed={language === lang} key={lang} onClick={() => {
          setLanguage(lang);
          try { localStorage.setItem("tagiri-schedule-language", lang); } catch {}
        }}>{lang === "ja" ? "日本語" : "EN"}</button>)}
      </nav>
    </div></header>
    <main className={pollId ? "shell poll-shell" : "shell"}>
      {pollId ? <PollView id={pollId} language={language} /> : <ScheduleArchive language={language} signedIn={signedIn} />}
    </main>
    <footer className="footer"><strong>TAGIRI</strong><span>{t.product}</span></footer>
  </div>;
}
