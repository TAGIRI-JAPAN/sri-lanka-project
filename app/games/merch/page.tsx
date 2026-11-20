import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, LayoutGrid, PackageOpen } from "lucide-react";
import { merchCategories, merchProducts, type MerchProduct } from "./catalog";
import "../games.css";
import "./merch.css";

export const metadata: Metadata = {
  title: "関連グッズ | Sri Lankaプロジェクト",
  description: "Sri Lankaプロジェクトの関連グッズ40点を紹介。",
};

const colors = {
  "game-accessories": "#405674",
  stationery: "#715a3b",
  lifestyle: "#3d6050",
  keychains: "#80543a",
  collectibles: "#3f5e58",
  plush: "#8e5538",
  books: "#63547d",
  cards: "#41635b",
  drinks: "#795931",
} as const;

const featuredIds = ["14", "21", "22"];
const priceFormatter = new Intl.NumberFormat("ja-JP");

const groups = merchCategories.map(category => ({
  ...category,
  products: merchProducts.filter(product => product.category === category.id),
}));

const showcase = featuredIds.flatMap(id => merchProducts.filter(product => product.id === id));

function productImage(id: string) {
  return "/project/games/merch/" + id + ".webp";
}

function productAnchor(id: string) {
  return "merch-product-" + id;
}

function MerchCard({ product }: { product: MerchProduct }) {
  const image = productImage(product.id);
  return <article className="merch-card" id={productAnchor(product.id)} aria-labelledby={productAnchor(product.id) + "-name"}>
    <a className="merch-card-image" href={image} target="_blank" rel="noopener noreferrer"
      aria-label={product.name + "の画像を別タブで開く"}>
      <img src={image} alt={product.name} loading="lazy" decoding="async" />
      <span className="merch-image-icon" aria-hidden="true"><ImageIcon size={15} /></span>
    </a>
    <div className="merch-card-content">
      <p className="merch-item-number">商品番号 {product.id}</p>
      <h4 id={productAnchor(product.id) + "-name"}>{product.name}</h4>
      <p className="merch-price">{priceFormatter.format(product.price)}<span>円</span></p>
      <p className="merch-description">{product.description}</p>
      <p className="merch-motif"><span>モチーフ</span> {product.subtitle}</p>
    </div>
  </article>;
}

export default function MerchPage() {
  return <div className="game-catalog merch-page">
    <header className="game-catalog-header">
      <div className="game-catalog-header-inner">
        <Link href="/games" className="game-catalog-brand" aria-label="Sri Lankaプロジェクトの発売ゲーム">
          <img src="/project/island/wordmark-ja.webp" alt="" width={710} height={387} />
        </Link>
        <nav aria-label="サイト内メニュー">
          <Link href="/games">発売ゲーム</Link>
          <a href="#merch-catalog" aria-current="page">関連グッズ</a>
        </nav>
      </div>
    </header>

    <main>
      <section className="merch-hero" aria-labelledby="merch-title">
        <div className="merch-hero-inner">
          <div className="merch-hero-content">
            <h1 id="merch-title">関連グッズ</h1>
            <p className="merch-hero-lead">ゲームで出会った風景を、<br />手元に。</p>
            <div className="game-catalog-hero-actions">
              <a className="game-catalog-hero-action" href="#merch-catalog"><LayoutGrid size={18} aria-hidden="true" />グッズ一覧を見る</a>
            </div>
          </div>
          <div className="merch-showcase" role="group" aria-label="ピックアップ商品">
            {showcase.map(product => <a key={product.id} data-item={product.id} href={"#" + productAnchor(product.id)} aria-label={product.name + "を見る"}>
              <img src={productImage(product.id)} alt="" decoding="async" fetchPriority={product.id === "21" ? "high" : "auto"} />
            </a>)}
          </div>
        </div>
      </section>

      <section className="merch-catalog" id="merch-catalog" aria-labelledby="merch-catalog-title">
        <header className="merch-catalog-heading">
          <PackageOpen size={34} strokeWidth={1.65} aria-hidden="true" />
          <div>
            <h2 id="merch-catalog-title">グッズカタログ</h2>
          </div>
        </header>
        <div className="merch-catalog-layout">
          <nav className="merch-category-nav" aria-label="グッズのカテゴリ">
            <ul>
              {groups.map(category => <li key={category.id}>
                <a href={"#merch-" + category.id}>
                  <span>{category.name}</span>
                  <span className="merch-category-nav-count">{category.products.length}<span className="merch-screen-reader">点</span></span>
                </a>
              </li>)}
            </ul>
          </nav>
          <div className="merch-sections">
            {groups.map(category => <section className="merch-category" id={"merch-" + category.id}
              key={category.id} aria-labelledby={"merch-category-title-" + category.id} style={{ borderColor: colors[category.id] }}>
              <header className="merch-category-heading">
                <h3 id={"merch-category-title-" + category.id}>{category.name}</h3>
                <span>{category.products.length}点</span>
              </header>
              <div className="merch-card-grid">{category.products.map(product => <MerchCard key={product.id} product={product} />)}</div>
            </section>)}
          </div>
        </div>
      </section>
    </main>

    <footer className="game-catalog-footer">
      <div className="game-catalog-footer-inner">
        <span>Sri Lankaプロジェクト</span>
        <Link href="/games">発売ゲームへ戻る</Link>
      </div>
    </footer>
  </div>;
}
