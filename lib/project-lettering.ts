const letteringSizes = {
  a01: [520, 77],
  a02: [520, 76],
  a03: [520, 90],
  a04: [474, 98],
  a05: [520, 60],
  a06: [476, 100],
  a07: [481, 100],
  a08: [482, 100],
  a09: [482, 100],
  a10: [473, 99],
  a11: [477, 99],
  a12: [520, 74],
  e01: [520, 75],
  e02: [520, 68],
  e03: [520, 74],
  e04: [448, 88],
  e05: [309, 106],
  e06: [520, 80],
  e07: [520, 69],
  e08: [520, 86],
  e09: [520, 103],
  e10: [520, 66],
  h01: [520, 138],
  h02: [520, 134],
  h03: [520, 55],
  h04: [520, 109],
  h05: [520, 91],
  h06: [520, 137],
  h07: [520, 62],
  s01: [520, 74],
  s02: [412, 99],
  s03: [520, 65],
  s04: [293, 99],
  s05: [384, 101],
  s06: [287, 99],
  s07: [289, 99],
  s08: [475, 100],
  s09: [381, 100],
  s10: [520, 54],
  t01: [372, 99],
  t02: [520, 77],
  t03: [386, 99],
  t04: [520, 88],
  t05: [380, 99],
  t06: [386, 99],
} as const;

export type ProjectLetteringId = keyof typeof letteringSizes;
export type ProjectLetteringTone = "dark" | "light";

export function projectLetteringAsset(id: ProjectLetteringId, tone: ProjectLetteringTone = "dark") {
  const [width, height] = letteringSizes[id];
  return { src: `/project/lettering/${id}-${tone}.webp`, width, height };
}

type LetteringItem = {
  id: string;
  src: string;
  label: { ja: string; en: string };
  alternateSrc?: string;
};

type LetteringCategory = {
  id: string;
  title: { ja: string; en: string };
  items: LetteringItem[];
};

function letteringItem(id: ProjectLetteringId, ja: string, en: string): LetteringItem {
  return {
    id,
    src: projectLetteringAsset(id).src,
    label: { ja, en },
    alternateSrc: projectLetteringAsset(id, "light").src,
  };
}

export const PROJECT_LETTERING_CATEGORIES: LetteringCategory[] = [
  {
    id: "lettering-title",
    title: { ja: "題字", en: "Title lettering" },
    items: [{
      id: "l01",
      src: "/project/supplied-title.webp",
      label: { ja: "Sri Lankaプロジェクト", en: "Sri Lanka Project" },
    }],
  },
  {
    id: "lettering-headings",
    title: { ja: "見出し", en: "Headings" },
    items: [
      letteringItem("h01", "日程調整", "Scheduling"),
      letteringItem("h02", "候補日時", "Proposed times"),
      letteringItem("h03", "自分のアイコンを選ぶ", "Choose your icon"),
      letteringItem("h04", "都合を入力", "Add availability"),
      letteringItem("h05", "みんなの回答", "Team responses"),
      letteringItem("h06", "回答状況", "Response status"),
      letteringItem("h07", "日程が決まりました", "Time confirmed"),
    ],
  },
  {
    id: "lettering-actions",
    title: { ja: "操作ボタン", en: "Action labels" },
    items: [
      letteringItem("a01", "候補日時を見る", "View proposed times"),
      letteringItem("a02", "候補日時を追加", "Add a proposed time"),
      letteringItem("a03", "回答者を選ぶ", "Choose respondents"),
      letteringItem("a04", "日程を提案", "Propose a time"),
      letteringItem("a05", "このアイコンで回答", "Respond with this icon"),
      letteringItem("a06", "出欠を入力", "Enter availability"),
      letteringItem("a07", "回答を送信", "Submit response"),
      letteringItem("a08", "回答を変更", "Edit response"),
      letteringItem("a09", "回答を確認", "Check responses"),
      letteringItem("a10", "日程を確定", "Confirm the time"),
      letteringItem("a11", "入力に戻る", "Return to the form"),
      letteringItem("a12", "リンクをコピー", "Copy link"),
    ],
  },
  {
    id: "lettering-status",
    title: { ja: "回答・選択の状態", en: "Response and selection states" },
    items: [
      letteringItem("s01", "○ 参加できます", "○ Available"),
      letteringItem("s02", "△ 要相談", "△ Maybe"),
      letteringItem("s03", "× 参加できません", "× Unavailable"),
      letteringItem("s04", "未回答", "Awaiting response"),
      letteringItem("s05", "回答済み", "Responded"),
      letteringItem("s06", "選択中", "Selected"),
      letteringItem("s07", "使用中", "Taken"),
      letteringItem("s08", "回答受付中", "Open for responses"),
      letteringItem("s09", "受付終了", "Responses closed"),
      letteringItem("s10", "回答を受け付けました", "Response received"),
    ],
  },
  {
    id: "lettering-times",
    title: { ja: "時間とタイムゾーン", en: "Times and time zones" },
    items: [
      letteringItem("t01", "日本時間", "Japan time"),
      letteringItem("t02", "スリランカ時間", "Sri Lanka time"),
      letteringItem("t03", "現地時間", "Local time"),
      letteringItem("t04", "タイムゾーン", "Time zone"),
      letteringItem("t05", "開始時刻", "Start time"),
      letteringItem("t06", "終了時刻", "End time"),
    ],
  },
  {
    id: "lettering-english",
    title: { ja: "英語表記", en: "English lettering" },
    items: [
      letteringItem("e01", "候補日時", "Proposed times"),
      letteringItem("e02", "自分のアイコンを選ぶ", "Choose your icon"),
      letteringItem("e03", "都合を入力", "Add availability"),
      letteringItem("e04", "参加できます", "Available"),
      letteringItem("e05", "要相談", "Maybe"),
      letteringItem("e06", "参加できません", "Unavailable"),
      letteringItem("e07", "回答を送信", "Submit response"),
      letteringItem("e08", "回答を変更", "Edit response"),
      letteringItem("e09", "日本時間", "Japan time"),
      letteringItem("e10", "スリランカ時間", "Sri Lanka time"),
    ],
  },
];
