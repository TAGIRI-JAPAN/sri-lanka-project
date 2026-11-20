import { Fragment, type CSSProperties } from "react";
import metrics from "./editorial-ink-metrics.json";
import "./editorial-ink.css";

const artRoot = "/project/ink/";
const labels = new Map<string, [string, number]>(
  Object.entries(metrics.labels).map(([label, [slug, width]]) => [label, [String(slug), Number(width)]]),
);
const glyphs = new Map(Object.entries(metrics.glyphs));
const em = (pixels: number) => pixels / metrics.unit + "em";
const wrappedInk = /\d+年|\d+月|\d+日(?:\([日月火水木金土]\))?|[A-Za-z0-9]+(?:[.’':/-][A-Za-z0-9]+)*|\s+|[^\s][、。？！］】）]|./gu;
const glyphSheet: CSSProperties = {
  maskSize: em(metrics.atlasWidth) + " " + em(metrics.atlasHeight),
  WebkitMaskSize: em(metrics.atlasWidth) + " " + em(metrics.atlasHeight),
};

function Glyph({ character }: { character: string }) {
  const glyph = glyphs.get(character);
  if (!glyph) {
    // A member can enter a name in any script. Keep the browser's own shaping
    // and font fallback for text outside the Japanese/English lettering set.
    return <>{character}</>;
  }
  const [x, y, width] = glyph;
  const position = em(-x) + " " + em(-y);
  return <i className="ink-glyph" style={{
    ...glyphSheet, width: em(width), maskPosition: position, WebkitMaskPosition: position,
  }} />;
}

export function Ink({ text, className = "" }: { text: string | number; className?: string }) {
  const label = String(text);
  const asset = labels.get(label);
  const finish = asset?.[0].startsWith("arcade-title-") ? "title"
    : asset?.[0].startsWith("arcade-") ? "arcade" : undefined;
  const tokens = asset ? [] : label.match(wrappedInk) ?? [];
  return <span className={`editorial-ink ${className}`.trim()}>
    <span className="ink-readable">{label}</span>
    <span className="ink-art" aria-hidden="true">{asset
      ? <i className="ink-wordmark" data-finish={finish} style={{
        width: em(asset[1]),
        "--ink-image": `url(${artRoot}${asset[0]}.webp)`,
      } as CSSProperties} />
      : tokens.map((token, index) => {
        if (/^\s+$/u.test(token)) return <Fragment key={index}>{token}</Fragment>;
        if (token.length === 1) return <Glyph character={token} key={index} />;
        return <i className="ink-token" key={index}>{Array.from(token, (ch, i) => <Glyph key={i} character={ch} />)}</i>;
      })}</span>
  </span>;
}
