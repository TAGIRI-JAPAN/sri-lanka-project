export const PROJECT_ART = {
  b01: "/project/art/b01.webp",
  b02: "/project/art/b02.webp",
  b03: "/project/art/b03.webp",
  b04: "/project/art/b04.webp",
  b05: "/project/art/b05.webp",
  m01: "/project/art/m01.webp",
  m02: "/project/art/m02.webp",
  t01: "/project/art/t01.webp",
  t02: "/project/art/t02.webp",
  t03: "/project/art/t03.webp",
  t04: "/project/art/t04.webp",
  t05: "/project/art/t05.webp",
  t06: "/project/art/t06.webp",
  p01: "/project/art/p01.webp",
  p02: "/project/art/p02.webp",
  p03: "/project/art/p03.webp",
  p04: "/project/art/p04.webp",
  p05: "/project/art/p05.webp",
  p06: "/project/art/p06.webp",
  u01: "/project/art/u01.webp",
  u02: "/project/art/u02.webp",
  u03: "/project/art/u03.webp",
  u04: "/project/art/u04.webp",
  u05: "/project/art/u05.webp",
  u06: "/project/art/u06.webp",
  f01: "/project/art/f01.webp",
  f02: "/project/art/f02.webp",
  f03: "/project/art/f03.webp",
  f04: "/project/art/f04.webp",
} as const;

type ArtId = keyof typeof PROJECT_ART;
type ArtLabel = [id: ArtId, ja: string, en: string];

function category(id: string, title: { ja: string; en: string }, labels: ArtLabel[]) {
  return {
    id,
    title,
    items: labels.map(([artId, ja, en]) => ({ id: artId, src: PROJECT_ART[artId], label: { ja, en } })),
  };
}

export const PROJECT_ART_CATEGORIES = [
  category("places", { ja: "スリランカの風景", en: "Sri Lankan landscapes" }, [
    ["b01", "シーギリヤの朝", "Morning in Sigiriya"],
    ["b02", "エッラの高原鉄道", "The highland railway in Ella"],
    ["b03", "ゴールの灯台", "Galle Lighthouse"],
    ["b04", "コロンボの夜", "Colombo by night"],
    ["b05", "夕暮れの蓮池", "A lotus pond at dusk"],
    ["m01", "霧の茶畑", "Tea hills in the mist"],
    ["m02", "ヤシの海岸", "A palm-lined shore"],
  ]),
  category("travel", { ja: "旅の小物", en: "Along the way" }, [
    ["t01", "トゥクトゥク", "Tuk-tuk"],
    ["t02", "青い列車", "Blue train"],
    ["t03", "キングココナッツ", "King coconut"],
    ["t04", "シナモン", "Cinnamon"],
    ["t05", "帆かけ舟", "Outrigger sailboat"],
    ["t06", "ゾウ", "Elephant"],
  ]),
  category("plants", { ja: "南国の植物", en: "Tropical plants" }, [
    ["p01", "ヤシの葉", "Palm frond"],
    ["p02", "茶葉", "Tea sprig"],
    ["p03", "ヤシの実", "Coconuts"],
    ["p04", "蓮の花", "Lotus"],
    ["p05", "プルメリア", "Frangipani"],
    ["p06", "バナナの葉", "Banana leaf"],
  ]),
  category("schedule", { ja: "日程調整のアイコン", en: "Scheduling icons" }, [
    ["u01", "時計", "Watch"],
    ["u02", "カレンダー", "Calendar"],
    ["u03", "地図ピン", "Map pin"],
    ["u04", "回答済み", "Response checkmark"],
    ["u05", "選択の星", "Selection star"],
    ["u06", "吹き出し", "Speech bubbles"],
  ]),
  category("frames", { ja: "人物のフレーム", en: "Portrait frames" }, [
    ["f01", "朱と金の光", "Gold and vermilion"],
    ["f02", "茶葉の緑", "Tea-leaf green"],
    ["f03", "紺と金の星", "Indigo and gold star"],
    ["f04", "紫と蓮の花", "Purple and lotus"],
  ]),
];
