"use client";

import Link from "next/link";
import Image from "next/image";
import { QuoteButton } from "./quote";

export function CinematicHero() {
  const scrollToFitment = () => {
    const el = document.getElementById("fitment-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="cinematic-hero">
      {/* Background Image Container */}
      <div className="cinematic-hero-bg">
        <Image
          src="/images/hero_sports_car_track.jpg"
          alt="High performance luxury supercar on racing track"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 45%" }}
          className="cinematic-hero-img"
        />
        <div className="cinematic-hero-overlay" />
        <div className="cinematic-hero-glow" />
      </div>

      {/* Content Container */}
      <div className="container cinematic-hero-container">
        <div className="cinematic-hero-content">
          <div className="cinematic-badge">
            <span className="cinematic-pulse-dot" />
            <span>52,000+ VIN-MATCHED OEM PARTS READY TO SHIP</span>
          </div>

          <h1 className="hero-title-cinematic">
            ENGINEERED FOR THE <br />
            <span className="text-gradient-red">EXTRAORDINARY</span>
          </h1>

          <p className="hero-sub-cinematic">
            Performance, precision and design brought together in one exceptional experience.
            Tested by ASE-certified technicians and shipped nationwide.
          </p>

          <div className="cinematic-hero-ctas">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={scrollToFitment}
            >
              EXPLORE NOW
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </button>

            <Link href="/parts" className="btn-hero-outline">
              VIEW COLLECTION
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>

            <QuoteButton className="btn-hero-ghost">
              Get Instant Quote
            </QuoteButton>
          </div>

          {/* Quick Metrics Strip */}
          <div className="cinematic-stats-row">
            <div className="cinematic-stat-item">
              <span className="stat-num">99.8%</span>
              <span className="stat-lbl">VIN Match Accuracy</span>
            </div>
            <div className="stat-divider" />
            <div className="cinematic-stat-item">
              <span className="stat-num">3-YEAR</span>
              <span className="stat-lbl">Written Warranty</span>
            </div>
            <div className="stat-divider" />
            <div className="cinematic-stat-item">
              <span className="stat-num">3–7 DAYS</span>
              <span className="stat-lbl">USA Express Freight</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
