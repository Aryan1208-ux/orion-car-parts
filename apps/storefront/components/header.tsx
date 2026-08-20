"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark, CartIcon } from "./icons";
import { useRouter } from "next/navigation";
import { Topbar } from "./topbar";
import { useCart } from "./cart-context";


export function Header({ cartCount: initialCartCount }: { cartCount: number }) {
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { cartCount, setIsDrawerOpen } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/parts?q=${encodeURIComponent(query.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="site-header">
      {/* Row 1: Slim Dark Trust Bar */}
      <Topbar />

      {/* Row 2: Top Black Header Bar (Logo + Search + Currency + Cart) */}
      <div className="header-top-bar">
        <div className="container header-top-container">
          <Link href="/" className="logo" onClick={closeMobileMenu}>
            <span className="logo-mark">
              <LogoMark />
            </span>
            <span className="logo-word">
              ORION <span className="logo-accent">CAR PARTS</span>
            </span>
          </Link>

          {/* Centered Search Bar */}
          <form className="header-search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              className="header-search-input"
              placeholder="Search by Keywords, Brand, Part Number, Car & more"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="header-search-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

          {/* Right Controls */}
          <div className="header-top-right">
            <div className="currency-selector" title="US Region / USD Currency">
              <span>🇺🇸</span>
              <span>IN (USD $)</span>
              <small>▾</small>
            </div>

            <button
              type="button"
              className="cart-btn-ahs"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Shopping Cart"
              style={{ cursor: "pointer", border: "1px solid rgba(255, 255, 255, 0.12)" }}
            >
              <CartIcon />
              {cartCount > 0 && <span className="cart-badge-ahs">{cartCount}</span>}
            </button>


            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Full-Width Crimson Red Navigation Bar */}
      <div className="crimson-nav">
        <div className="container crimson-nav-container">
          <Link href="/" className="nav-tab-ahs active">
            HOME
          </Link>
          <Link href="/parts" className="nav-tab-ahs">
            SHOP BY PARTS
          </Link>
          <Link href="/parts?part=used-engines" className="nav-tab-ahs">
            SHOP BY MAKE ▾
          </Link>
          <Link href="/parts?part=used-transmissions" className="nav-tab-ahs">
            SHOP BY BRANDS
          </Link>
          <Link href="/parts" className="nav-tab-ahs">
            SHOP BY CATEGORY
          </Link>
          <Link href="/#warranty" className="nav-tab-ahs">
            ABOUT US
          </Link>
          <Link href="/#faq" className="nav-tab-ahs">
            CONTACT US
          </Link>
          <Link href="/#how" className="nav-tab-ahs">
            MORE ▾
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={closeMobileMenu}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-head">
              <span className="logo-word">ORION <span className="logo-accent">PARTS</span></span>
              <button type="button" className="mobile-drawer-close" onClick={closeMobileMenu}>✕</button>
            </div>

            <nav className="mobile-drawer-nav">
              <Link href="/" onClick={closeMobileMenu}>Home</Link>
              <Link href="/parts" onClick={closeMobileMenu}>Shop All Parts</Link>
              <Link href="/parts?part=used-engines" onClick={closeMobileMenu}>Used Engines</Link>
              <Link href="/parts?part=used-transmissions" onClick={closeMobileMenu}>Used Transmissions</Link>
              <Link href="/#warranty" onClick={closeMobileMenu}>About Us &amp; Warranty</Link>
              <Link href="/#faq" onClick={closeMobileMenu}>Contact &amp; FAQ</Link>
              <Link href="/cart" onClick={closeMobileMenu}>Shopping Cart ({cartCount})</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
