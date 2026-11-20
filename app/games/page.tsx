import type { Metadata } from "next";
import { CalendarDays, Camera, Coins, Compass, Gift, Monitor } from "lucide-react";
import { CatalogJumpLink, ScheduleReturnLink } from "./catalog-links";
import "./games.css";

export const metadata: Metadata = {
  title: "発売ゲーム | Sri Lankaプロジェクト",
  description: "日本語教育と職業訓練、スリランカ各地の冒険を描く、架空のSri Lankaプロジェクトシリーズ全5作。",
  openGraph: {
    title: "発売ゲーム | Sri Lankaプロジェクト",
    description: "5世代のパッケージとゲーム画面で巡る、架空のSri Lankaプロジェクトシリーズ。",
    images: [{ url: "/project/games/series/05/scene-3.webp", width: 1250, height: 703 }],
  },
};

const games = [
  {
    id: "01",
    name: "Sri Lankaプロジェクト",
    subtitle: "",
    platform: "PlayStation 2",
    cover: { width: 790, height: 987 },
    release: "2005-09-15",
    price: 7140,
    theme: "日本語教育・学校づくり",
    description: "主人公がスリランカの町で小さな日本語教室を始めるシリーズ第1作。授業を組み立て、教室や自習室を増やしながら、旧校舎の地下に残る手がかりを探します。",
    scenes: ["日本語教室での会話練習", "新しい教室と自習室の建設", "旧校舎の地下を調査"],
    gameplay: true,
  },
  {
    id: "02",
    name: "Sri Lankaプロジェクト2",
    subtitle: "雲を越える鉄路",
    platform: "PlayStation 3",
    cover: { width: 790, height: 987 },
    release: "2010-11-18",
    price: 7980,
    theme: "職業訓練・高原の交通",
    description: "エッラの高原へ向かった主人公は、現地の仲間と設備整備の訓練を始めます。予算を見ながら通学バスの路線をつなぎ、山に眠る旧鉄道トンネルを調べます。",
    scenes: ["設備整備コースで実習", "通学バスの予算と路線を検討", "旧鉄道トンネルの信号を切り替える"],
    gameplay: true,
  },
  {
    id: "03",
    name: "Sri Lankaプロジェクト3",
    subtitle: "南海の約束",
    platform: "PlayStation 4",
    cover: { width: 790, height: 987 },
    release: "2016-07-28",
    price: 8424,
    theme: "ビルクリーニング・就職支援",
    description: "舞台は海沿いのゴール。主人公はビルクリーニング実習を進めながら、ゴールと大阪の求人を見比べ、訓練を終えた仲間の進路を考えます。城塞の下には古い水路が広がっています。",
    scenes: ["ビルクリーニング実習で道具を選ぶ", "ゴールと大阪の就職先を比較", "城塞地下水路の水門を操作"],
    gameplay: true,
  },
  {
    id: "04",
    name: "Sri Lankaプロジェクト4",
    subtitle: "風の島便り",
    platform: "Nintendo Switch",
    cover: { width: 720, height: 1080 },
    release: "2019-08-29",
    price: 6458,
    theme: "日本語会話・地元の工房",
    description: "北部のジャフナで、主人公は町の人と日本語の会話クラブを開きます。地元に仕事を生む工房をつくり、風の書庫で島に伝わる仕掛けの謎に挑みます。",
    scenes: ["ジャフナの会話クラブで日本語を練習", "工房を建てて地元の仕事を増やす", "風の書庫で風向きの仕掛けを解く"],
    gameplay: true,
  },
  {
    id: "05",
    name: "Sri Lankaプロジェクト5",
    subtitle: "夜明けの道標",
    platform: "PlayStation 5",
    cover: { width: 790, height: 1053 },
    release: "2025-11-20",
    price: 8910,
    theme: "介護実習・進路選択",
    description: "主人公は介護実習を支え、参加者とスリランカや海外での働き方を考えます。もう一つの舞台は古い水路。忘れられた水門を探し、地域に水が流れる道をたどります。",
    scenes: ["介護実習で車いすの安全確認", "国をまたぐ進路を相談", "古い水路を調べて水門を開く"],
    gameplay: false,
  },
] as const;

const assetRoot = "/project/games/series/";
const dates = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});
const prices = new Intl.NumberFormat("ja-JP");

type Game = typeof games[number];

function coverOf(game: Game) {
  return assetRoot + game.id + "/cover.webp";
}

function GameCard({ game }: { game: Game }) {
  const sectionId = "game-" + game.id;
  const gameAssets = assetRoot + game.id + "/";
  const hd = game.id !== "01";
  return <article id={sectionId} className="game-catalog-card" tabIndex={-1} data-game={game.id} aria-labelledby={sectionId + "-title"}>
    <div className="game-catalog-edition">
      <figure className="game-catalog-cover">
        <img src={coverOf(game)} alt={game.name + "の" + game.platform + "版パッケージ"}
          width={game.cover.width} height={game.cover.height} loading="lazy" />
      </figure>
      <div className="game-catalog-card-body">
        <p className="game-catalog-platform"><Monitor size={16} aria-hidden="true" />{game.platform}</p>
        <h3 id={sectionId + "-title"}>
          {game.name}
          {game.subtitle && <span className="game-catalog-subtitle">{game.subtitle}</span>}
        </h3>
        <p className="game-catalog-theme">{game.theme}</p>
        <p className="game-catalog-description">{game.description}</p>
        <dl className="game-catalog-facts">
          <div>
            <dt><CalendarDays size={16} aria-hidden="true" />発売日</dt>
            <dd><time dateTime={game.release}>{dates.format(new Date(game.release + "T00:00:00+09:00"))}</time></dd>
          </div>
          <div>
            <dt><Coins size={16} aria-hidden="true" />価格（税込）</dt>
            <dd>{prices.format(game.price)}<small>円</small></dd>
          </div>
        </dl>
      </div>
    </div>
    <section className="game-catalog-scenes" aria-labelledby={sectionId + "-scenes"}>
      <h4 id={sectionId + "-scenes"}><Camera size={19} aria-hidden="true" />ゲーム画面</h4>
      <div className="game-catalog-gallery" data-hd={hd || undefined}>
        {game.scenes.map((caption, index) => {
          const src = gameAssets + "scene-" + (index + 1) + ".webp";
          return <figure key={src}>
            <a href={src} target="_blank" rel="noopener noreferrer" aria-label={caption + "の画像を別タブで開く"}>
              <img src={src} alt={caption} width={1250} height={hd ? 703 : 938} loading="lazy" />
            </a>
            <figcaption>{caption}</figcaption>
          </figure>;
        })}
      </div>
      {game.gameplay && <figure className="game-catalog-video">
        <figcaption>プレイ映像</figcaption>
        <video controls playsInline preload="none" poster={gameAssets + "gameplay-01.webp"}
          aria-label={game.name + "のプレイ映像"}>
          <source src={gameAssets + "gameplay-01.mp4"} type="video/mp4" />
        </video>
      </figure>}
    </section>
  </article>;
}

export default function GamesPage() {
  return <div className="game-catalog">
    <header className="game-catalog-header">
      <div className="game-catalog-header-inner">
        <ScheduleReturnLink className="game-catalog-brand" label="Sri Lankaプロジェクトの日程調整">
          <img src="/project/island/wordmark-ja.webp" alt="" width={710} height={387} />
        </ScheduleReturnLink>
        <nav aria-label="サイト内メニュー">
          <CatalogJumpLink><img src="/project/games/release-wordmark.webp" alt="発売ゲーム" width={1024} height={252} /></CatalogJumpLink>
          <a href="/games/merch">関連グッズ</a>
          <ScheduleReturnLink>日程調整へ戻る</ScheduleReturnLink>
        </nav>
      </div>
    </header>

    <main>
      <section className="game-catalog-hero" aria-labelledby="game-catalog-title">
        <div className="game-catalog-hero-inner">
          <div className="game-catalog-hero-content">
            <h1 id="game-catalog-title">
              <img src="/project/games/release-wordmark.webp" alt="発売ゲーム" width={1024} height={252} fetchPriority="high" />
            </h1>
            <p className="game-catalog-tagline">ひとりの主人公が歩く、<br />スリランカの5つの物語。</p>
            <p className="game-catalog-intro">日本語教室を開くところから、職業訓練、海を越える進路相談へ。スリランカ各地を舞台にした架空のゲームシリーズ。</p>
            <div className="game-catalog-hero-actions">
              <CatalogJumpLink className="game-catalog-hero-action"><Compass size={19} aria-hidden="true" />全5作品を見る</CatalogJumpLink>
              <a className="game-catalog-hero-action game-catalog-hero-action-secondary" href="/games/merch">
                <Gift size={19} aria-hidden="true" />関連グッズ40点
              </a>
            </div>
          </div>
          <div className="game-catalog-hero-covers" aria-hidden="true">
            {[games[0], games[2], games[4]].map(game => <img key={game.id} src={coverOf(game)} alt="" width={game.cover.width} height={game.cover.height} />)}
          </div>
        </div>
      </section>

      <section id="lineup" className="game-catalog-lineup" tabIndex={-1} aria-labelledby="game-catalog-lineup-title">
        <header className="game-catalog-lineup-head">
          <h2 id="game-catalog-lineup-title">シリーズ全5作品</h2>
          <p>架空のゲーム企画です。発売日・価格・対応機種は作品設定です。</p>
        </header>
        <nav className="game-catalog-index" aria-label="機種から作品へ移動">
          {games.map(game => <CatalogJumpLink key={game.id} target={"game-" + game.id}>
            <strong>{game.platform}</strong>
            <span>{game.subtitle || game.name}</span>
          </CatalogJumpLink>)}
        </nav>
        <div className="game-catalog-grid">
          {games.map(game => <GameCard key={game.id} game={game} />)}
        </div>
      </section>
    </main>

    <footer className="game-catalog-footer">
      <div className="game-catalog-footer-inner">
        <span>Sri Lankaプロジェクト</span>
        <a href="/games/merch">関連グッズ</a>
        <ScheduleReturnLink>日程調整へ戻る</ScheduleReturnLink>
      </div>
    </footer>
  </div>;
}
