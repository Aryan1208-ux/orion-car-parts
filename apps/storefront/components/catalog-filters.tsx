"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const YEARS = Array.from({ length: 2024 - 1990 + 1 }, (_, i) =>
  String(2024 - i)
);

type Props = {
  categories: { handle: string; name: string }[];
  makes: { handle: string; title: string }[];
  current: { q: string; part: string; make: string; year: string };
};

export function CatalogFilters({ categories, makes, current }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(current.q);
  const [part, setPart] = useState(current.part);
  const [make, setMake] = useState(current.make);
  const [year, setYear] = useState(current.year);

  const hasActiveFilters = Boolean(q || part || make || year);

  const apply = (
    next: Partial<{ q: string; part: string; make: string; year: string }>
  ) => {
    const merged = { q, part, make, year, ...next };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.part) sp.set("part", merged.part);
    if (merged.make) sp.set("make", merged.make);
    if (merged.year) sp.set("year", merged.year);
    const s = sp.toString();
    router.push(`/parts${s ? `?${s}` : ""}`);
  };

  const handleReset = () => {
    setQ("");
    setPart("");
    setMake("");
    setYear("");
    router.push("/parts");
  };

  return (
    <div className="parts-finder-panel-wrap">
      <form
        className="parts-finder-panel"
        onSubmit={(e) => {
          e.preventDefault();
          apply({});
        }}
      >
        {/* Search Input Field */}
        <div className="pf-field-wrap pf-search-wrap">
          <label className="pf-label">SEARCH INVENTORY</label>
          <div className="pf-input-box">
            <svg className="pf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="pf-input"
              placeholder="Search by Model, Engine Size, VIN..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                className="pf-clear-btn"
                onClick={() => {
                  setQ("");
                  apply({ q: "" });
                }}
                aria-label="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Part Type Dropdown */}
        <div className="pf-field-wrap">
          <label className="pf-label">PART TYPE</label>
          <div className="pf-select-box">
            <select
              className="pf-select"
              value={part}
              onChange={(e) => {
                const val = e.target.value;
                setPart(val);
                apply({ part: val });
              }}
            >
              <option value="">All Parts</option>
              {categories.map((c) => (
                <option key={c.handle} value={c.handle}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="pf-arrow">▾</span>
          </div>
        </div>

        {/* Make Dropdown */}
        <div className="pf-field-wrap">
          <label className="pf-label">MAKE</label>
          <div className="pf-select-box">
            <select
              className="pf-select"
              value={make}
              onChange={(e) => {
                const val = e.target.value;
                setMake(val);
                apply({ make: val });
              }}
            >
              <option value="">All Makes</option>
              {makes.map((m) => (
                <option key={m.handle} value={m.handle}>
                  {m.title}
                </option>
              ))}
            </select>
            <span className="pf-arrow">▾</span>
          </div>
        </div>

        {/* Year Dropdown */}
        <div className="pf-field-wrap">
          <label className="pf-label">YEAR</label>
          <div className="pf-select-box">
            <select
              className="pf-select"
              value={year}
              onChange={(e) => {
                const val = e.target.value;
                setYear(val);
                apply({ year: val });
              }}
            >
              <option value="">Any Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="pf-arrow">▾</span>
          </div>
        </div>

        {/* Actions Group */}
        <div className="pf-actions-wrap">
          <button type="submit" className="pf-btn-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>SEARCH</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="pf-btn-reset"
              onClick={handleReset}
              title="Reset All Filters"
            >
              Reset ✕
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
