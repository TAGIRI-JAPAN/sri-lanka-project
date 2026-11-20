import type { Proposal } from "./project";
import { TOKYO, wallTime } from "./schedule";

function haveAllRespondentsAnswered(slots: readonly Proposal[]) {
  const [first, ...remaining] = slots;
  if (!first || slots.some(slot => slot.totalRespondents <= 0)) return false;

  const expected = Math.max(...slots.map(slot => slot.totalRespondents));
  let sharedRespondents = new Set(first.responses.map(response => response.id));
  for (const slot of remaining) {
    const answered = new Set(slot.responses.map(response => response.id));
    sharedRespondents = new Set([...sharedRespondents].filter(id => answered.has(id)));
  }

  // The expected total includes any reserved portrait that a participant has
  // yet to claim. A response from every currently registered person can fall short.
  return sharedRespondents.size >= expected;
}

export function getProjectMeetingStatus(slots: readonly Proposal[], todayInTokyo: string) {
  const confirmed = slots.find(slot => slot.confirmed);
  if (!confirmed && !haveAllRespondentsAnswered(slots)) return { complete: false, hidden: false };

  const start = confirmed?.start ?? Math.max(...slots.map(slot => slot.start));
  return { complete: true, hidden: wallTime(start, TOKYO).slice(0, 10) < todayInTokyo };
}
