"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SmartFinder, type MatchedPart } from "./smart-finder";
import { ShieldIcon } from "./icons";
import { AddToCartButton } from "./add-to-cart";

type MakeOpt = { id: string; handle: string; title: string };
type CatOpt = { id: string; handle: string; name: string };

function formatUSD(amount: number): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

export function HeroShowcase({
  makes,
  categories,
  regionId,
  initial,
}: {
  makes: MakeOpt[];
  categories: CatOpt[];
  regionId: string;
  initial: MatchedPart | null;
}) {
  // last few searched parts — newest first, switchable via the thumb tabs
  const [history, setHistory] = useState<MatchedPart[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [checking, setChecking] = useState(false);

  const handleMatch = useCallback((m: MatchedPart | null) => {
    if (!m) return;
    setHistory((h) => [m, ...h.filter((x) => x.handle !== m.handle)].slice(0, 3));
    setActiveIdx(0);
  }, []);

  const shown = history[activeIdx] ?? initial;
  const isLive = history.length > 0;

  return (
    <div className="container hero-grid">
      <div>
        <div className="hero-badge">
          <ShieldIcon />
          Tested · Warrantied · VIN-matched
        </div>
        <h1>
          Tell us the car. We&apos;ll find the <em>exact</em> part.
        </h1>
        <p className="hero-sub">
          Type it how you&apos;d say it out loud — or use your VIN or plate.
          We&apos;ll show you what we understood and check live inventory
          before you go anywhere.
        </p>
        <SmartFinder
          makes={makes}
          categories={categories}
          regionId={regionId}
          onMatch={handleMatch}
          onChecking={setChecking}
        />
        <p className="sf-fallback">
          Rather click through it?{" "}
          <Link href="/parts">Browse by part, make and year</Link>
        </p>
        <div className="hero-stats" style={{ marginTop: 30 }}>
          <div>
            <div className="hero-stat-num">40,000+</div>
            <div className="hero-stat-label">parts shipped since 2011</div>
          </div>
          <div>
            <div className="hero-stat-num">4.9 / 5</div>
            <div className="hero-stat-label">from 3,200+ verified reviews</div>
          </div>
          <div>
            <div className="hero-stat-num">3-year</div>
            <div className="hero-stat-label">warranty available</div>
          </div>
        </div>
      </div>
      {shown && (
        <div
          className={`hero-float ${checking ? "checking" : ""}`}
          key={shown.handle}
        >
          <Link
            href={`/parts/${shown.handle}`}
            className="hero-float-img"
            aria-label={`View details for ${shown.title}`}
          >
            {shown.thumbnail ? (
              <Image
                src={shown.thumbnail}
                alt={shown.title}
                fill
                sizes="(max-width: 980px) 100vw, 560px"
                priority
                style={{ objectFit: "contain" }}
              />
            ) : (
              <span className="photo-placeholder">
                {(shown.part || "part").toLowerCase()} photo
              </span>
            )}
          </Link>
          {isLive && (
            <div className="hero-float-actions">
              {shown.variantId && (
                <AddToCartButton
                  variantId={shown.variantId}
                  className="btn-primary hero-float-btn"
                />
              )}
              <Link
                href={`/parts/${shown.handle}`}
                className="hero-float-btn hero-float-btn-ghost"
              >
                View Details
              </Link>
            </div>
          )}
          <div className="hero-float-chip">
            <div style={{ minWidth: 0 }}>
              <div className={`hero-spotlight-tag ${isLive ? "live" : ""}`}>
                {isLive ? (
                  <>
                    <span className="hero-live-dot" /> Live match from your
                    search
                  </>
                ) : (
                  <>{shown.part || "Engine"} · fresh off the dyno</>
                )}
              </div>
              <Link href={`/parts/${shown.handle}`} className="hero-float-name">
                {shown.title}
              </Link>
            </div>
            <span className="hero-spotlight-price">
              {shown.price !== null ? formatUSD(shown.price) : ""}
            </span>
          </div>
          {history.length >= 2 && (
            <div
              className="hero-float-switch"
              role="tablist"
              aria-label="Recently searched parts"
            >
              {history.map((h, i) => (
                <button
                  key={h.handle}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIdx}
                  className="hero-float-thumb"
                  title={h.title}
                  onClick={() => setActiveIdx(i)}
                >
                  {h.thumbnail ? (
                    <Image src={h.thumbnail} alt={h.title} fill sizes="44px" style={{ objectFit: "cover" }} />
                  ) : (
                    <span>{(h.part || "P")[0]}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
