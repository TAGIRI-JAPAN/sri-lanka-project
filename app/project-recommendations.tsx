import { projectCharacterName, projectMarks, PROJECT_ORGANIZER_NAME, projectRetryRespondents, rankProjectCandidates, type ProjectAvatar, type ProjectBoard, type ProjectPortraits, type Proposal } from "@/lib/project";
import { COLOMBO, dateLabel, timeRange, TOKYO, type Language } from "@/lib/schedule";
import { Ink } from "./editorial-ink";
import "./project-recommendations.css";

const zones = [
  { id: TOKYO, ja: "日本時間", en: "Japan time" },
  { id: COLOMBO, ja: "スリランカ時間", en: "Sri Lanka time" },
] as const;

const copy = {
  ja: {
    heading: "有力候補 TOP 3",
    rule: "◎が多い順。同数なら○が多い順、×が少ない順、△が多い順です。",
    empty: "回答が入ると、有力な候補をここに表示します。",
    emptyAfterRetry: "順位を出せる回答がまだありません。",
    retry: "リトライ", retryPeople: "全候補に「×」と回答した人", retryRule: "下の人を除いた回答で順位を出します。",
    preferred: "最優先", yes: "参加可", maybe: "要相談", no: "参加不可", pending: "未回答",
    organizer: "主催者", character: "キャラクター",
    confirm: "この候補を確定",
    count: (value: number) => `${value}人`,
  },
  en: {
    heading: "Top 3 times",
    rule: "Ranked by most Preferred responses, then most Yes, fewest No, and most Maybe.",
    empty: "The top times will appear here once someone responds.",
    emptyAfterRetry: "There are no remaining responses to rank yet.",
    retry: "Retry", retryPeople: "Unavailable at every proposed time", retryRule: "The rankings use the other participants’ responses.",
    preferred: "Preferred", yes: "Yes", maybe: "Maybe", no: "No", pending: "Awaiting response",
    organizer: "Organizer", character: "Character",
    confirm: "Confirm this time",
    count: (value: number) => `${value} ${value === 1 ? "person" : "people"}`,
  },
} as const;

type Participant = { key: string; name: string; avatar?: ProjectAvatar | null };

function ParticipantGroup({ label, people, portraits }: { label: string; people: Participant[]; portraits?: ProjectPortraits }) {
  if (!people.length) return null;
  return <div className="project-recommendation-people">
    <strong><Ink text={label} /></strong>
    <ul aria-label={label}>
      {people.map(person => {
        const image = person.avatar ? portraits?.[person.avatar] : undefined;
        return <li key={person.key}>
          {image
            ? <img src={image} alt="" width={26} height={26} loading="lazy" />
            : <span className="project-recommendation-initial" aria-hidden="true">{Array.from(person.name)[0] ?? "•"}</span>}
          <span>{person.name}</span>
        </li>;
      })}
    </ul>
  </div>;
}

export function ProjectRecommendations({ slots, board, portraits, language, busy = false, onConfirm }: {
  slots: Proposal[]; board: ProjectBoard; portraits?: ProjectPortraits; language: Language;
  busy?: boolean; onConfirm?: (slot: Proposal) => void;
}) {
  const [meeting] = slots;
  if (!meeting?.canManage || meeting.meetingClosed) return null;
  const t = copy[language];
  const meetingId = meeting.meetingId ?? meeting.id;
  const heading = `recommendations-${meetingId}`;
  const targets = board.meetingAudience[meetingId] ?? [];
  const portraitsByMember = new Map(Object.entries(board.portraitOwners).flatMap(([avatar, person]) =>
    person ? [[person.id, avatar as ProjectAvatar] as const] : []));
  for (const { avatar, member } of targets) if (member) portraitsByMember.set(member.id, avatar);
  const name = (value: string) => value === PROJECT_ORGANIZER_NAME ? t.organizer : value;
  const unlinked = targets.filter(target => !target.member).map(({ avatar }) => ({
    key: avatar,
    avatar,
    name: projectCharacterName(avatar) ?? `${t.character} ${Number(avatar)}`,
  }));
  const responsePeople = (responses: Proposal["responses"]) => responses.map(person => ({
    key: person.id, name: name(person.name), avatar: person.avatar ?? portraitsByMember.get(person.id),
  }));
  const retry = projectRetryRespondents(slots);
  const ranked = rankProjectCandidates(slots, retry).slice(0, 3);

  return <section className="project-recommendations" aria-labelledby={heading}>
    <header className="project-recommendations-header">
      <h4 id={heading}><Ink text={t.heading} /></h4>
      <p>{ranked.length ? t.rule : retry.length ? t.emptyAfterRetry : t.empty}</p>
    </header>
    {retry.length > 0 && <div className="project-recommendation-retry">
      <div className="project-recommendation-retry-lead">
        <img src="/project/ink/retry-label.webp" alt={t.retry} width={384} height={114} />
        {ranked.length > 0 && <p>{t.retryRule}</p>}
      </div>
      <ParticipantGroup label={t.retryPeople} people={responsePeople(retry)} portraits={portraits} />
    </div>}
    {ranked.length > 0 && <ol className="project-recommendations-list">
      {ranked.map(({ slot, preferred, yes, maybe, no, pending, unavailable }) => {
        const totals = [
          { key: "preferred", mark: projectMarks.preferred, count: preferred },
          { key: "yes", mark: projectMarks.yes, count: yes },
          { key: "maybe", mark: projectMarks.maybe, count: maybe },
          { key: "no", mark: projectMarks.no, count: no },
          { key: "pending", mark: t.pending, count: pending },
        ] as const;
        return <li key={slot.id}>
          <div className="project-recommendation-summary">
            <div className="project-recommendation-times">
              {zones.map(zone => <div key={zone.id}>
                <span><Ink text={zone[language]} /> · {dateLabel(slot.start, zone.id, language)}</span>
                <time dateTime={new Date(slot.start).toISOString()}>{timeRange(slot.start, slot.duration, zone.id, language)}</time>
              </div>)}
            </div>
            <ul className="project-recommendation-totals">
              {totals.map(result => <li key={result.key} data-result={result.key}>
                <span className="sr-only">{`${t[result.key]} ${t.count(result.count)}`}</span>
                <span aria-hidden="true"><Ink text={result.mark} /></span><b aria-hidden="true">{result.count}</b>
              </li>)}
            </ul>
          </div>
          <ParticipantGroup label={t.no} people={responsePeople(unavailable)} portraits={portraits} />
          <ParticipantGroup label={t.pending} people={[
            ...slot.waiting.map(person => ({ key: person.id, name: name(person.name), avatar: person.avatar ?? portraitsByMember.get(person.id) })),
            ...unlinked,
          ]} portraits={portraits} />
          {onConfirm && slot.canManage && <button type="button" className="project-recommendation-confirm" aria-haspopup="dialog"
            aria-label={`${t.confirm} · ${dateLabel(slot.start, TOKYO, language)} ${timeRange(slot.start, slot.duration, TOKYO, language)}`}
            disabled={busy} onClick={() => onConfirm(slot)}><Ink text={t.confirm} /></button>}
        </li>;
      })}
    </ol>}
  </section>;
}
