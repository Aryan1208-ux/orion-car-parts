import Link from "next/link";
import Image from "next/image";
import {
  getRegion,
  listCategories,
  listCollections,
  listProducts,
  productPrice,
} from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { HeroShowcase } from "@/components/hero-showcase";
import { BrandLogo } from "@/components/brand-logos";
import { BrandCard3D } from "@/components/brand-card-3d";
import { AccreditationRow } from "@/components/trust-badges";
import { QuoteButton } from "@/components/quote";
import { CinematicHero } from "@/components/cinematic-hero";

export const revalidate = 60;

const FEATURED_BRANDS = [
  "Ford", "Chevy", "BMW", "Toyota", "Honda", "Mercedes",
  "Audi", "Dodge", "Porsche", "Jeep", "Nissan", "Lexus",
  "Cadillac", "Volkswagen", "Subaru", "Hyundai", "Kia", "GMC",
  "Volvo", "Mazda", "Jaguar", "Acura", "Infiniti", "Chrysler",
];

const STEPS = [
  { icon: "🔍", title: "Tell us your vehicle", body: "Submit your make, model, year and VIN — online or over the phone." },
  { icon: "📋", title: "Get a matched quote", body: "We locate a VIN-matched unit and send you mileage, test results and price." },
  { icon: "🚚", title: "We test & ship", body: "Final inspection, palletized freight, tracking sent same day." },
  { icon: "✅", title: "Install with confidence", body: "Your written warranty starts the day it arrives. Support is a call away." },
];

const REVIEWS = [
  { text: '"Engine arrived in five days with the compression test sheet taped to the crate. Installed it the same weekend — runs like new."', name: "Mike R.", detail: "2014 Ford F-150 · Verified purchase" },
  { text: '"I was nervous buying a used transmission online. They walked me through the VIN match on the phone and the warranty paperwork was real. Zero issues after 8 months."', name: "Sandra T.", detail: "2017 Honda Accord · Verified purchase" },
  { text: '"Half the price the dealer quoted me, and it came with a 3-year warranty. My shop installs their engines regularly now."', name: "Dave M.", detail: "Owner, DM Auto Repair · Verified purchase" },
];

const FAQS = [
  { q: "How do I know the part will fit my car?", a: "We match every unit to your VIN before it ships. If a part we sent doesn't fit your factory specification, we replace it or refund you in full — including freight." },
  { q: "What does the warranty cover?", a: "Standard coverage is 12 months on internal components, with extended plans up to 3 years. You receive the written warranty terms with your quote, before you pay anything." },
  { q: "How are the engines tested?", a: "Every engine gets a compression test, leak-down test, fluid inspection and diagnostic scan by ASE-certified technicians. Test results ship with the unit." },
  { q: "How long does shipping take?", a: "Most orders arrive within 3–7 business days via palletized freight. You get tracking the day it leaves our facility, and liftgate delivery is available." },
  { q: "Do you offer financing?", a: "Yes — Affirm and Afterpay are available at checkout, so you can split the cost into monthly payments." },
];

export default async function HomePage() {
  const [collections, categories, region] = await Promise.all([
    listCollections(),
    listCategories(),
    getRegion(),
  ]);

  const enginesCategory = categories.find((c) => c.handle === "used-engines");
  const { products: productPool } = await listProducts({
    limit: 48,
    order: "-created_at",
    category_id: enginesCategory ? [enginesCategory.id] : undefined,
  });
  const withPhoto = productPool.filter((p) => p.thumbnail);
  const products = [
    ...withPhoto,
    ...productPool.filter((p) => !p.thumbnail),
  ].slice(0, 8);

  const makes = collections.map((c) => ({ id: c.id, handle: c.handle, title: c.title }));
  const categoryOpts = categories.map((c) => ({ id: c.id, handle: c.handle, name: c.name }));

  const spotlightProduct = withPhoto[0];
  const spotlight = spotlightProduct
    ? {
        handle: spotlightProduct.handle,
        title: spotlightProduct.title,
        thumbnail: spotlightProduct.thumbnail ?? null,
        price: productPrice(spotlightProduct),
        part: (spotlightProduct.metadata as Record<string, string>)?.part ?? "Engine",
        variantId: spotlightProduct.variants?.[0]?.id ?? null,
      }
    : null;

  return (
    <main>
      {/* 1. Cinematic Luxury Top Hero Banner */}
      <CinematicHero />

      {/* 2. Hero Showcase & Smart Fitment Finder */}
      <section className="hero-ahs" id="fitment-section">
        <HeroShowcase
          makes={makes}
          categories={categoryOpts}
          regionId={region.id}
          initial={spotlight}
        />

        {/* 3. Black Value Proposition Bar */}
        <div className="value-prop-bar">
          <div className="container value-prop-grid">
            <div className="value-prop-item">
              <span className="value-prop-icon">✓</span>
              <div>
                <div className="value-prop-title">Authorized OEM Retailer</div>
                <div className="value-prop-desc">Genuine parts at the industry&apos;s best prices.</div>
              </div>
            </div>
            <div className="value-prop-item">
              <span className="value-prop-icon">✓</span>
              <div>
                <div className="value-prop-title">Price Match Guarantee</div>
                <div className="value-prop-desc">Found a lower advertised price? We&apos;ll match it.</div>
              </div>
            </div>
            <div className="value-prop-item">
              <span className="value-prop-icon">✓</span>
              <div>
                <div className="value-prop-title">Worldwide Shipping</div>
                <div className="value-prop-desc">Palletized freight to all 50 US states.</div>
              </div>
            </div>
            <div className="value-prop-item">
              <span className="value-prop-icon">✓</span>
              <div>
                <div className="value-prop-title">Expert Parts Support</div>
                <div className="value-prop-desc">Need help? Our ASE team is here to help.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Category Image Cards */}
      <section className="section" style={{ padding: "56px 0 36px" }}>
        <div className="container">
          <div className="category-cards-grid">
            <Link href="/parts?part=used-engines" className="category-image-card">
              {withPhoto[0]?.thumbnail ? (
                <Image src={withPhoto[0].thumbnail} alt="Used Engines" fill className="category-card-img" sizes="(max-width:900px)100vw,420px" />
              ) : <div style={{background:"#1e293b",width:"100%",height:"100%"}} />}
              <div className="category-card-caption"><span>Engines</span><span className="cat-arrow">→</span></div>
            </Link>
            <Link href="/parts?part=used-transmissions" className="category-image-card">
              {withPhoto[1]?.thumbnail ? (
                <Image src={withPhoto[1].thumbnail} alt="Transmissions" fill className="category-card-img" sizes="(max-width:900px)100vw,420px" />
              ) : <div style={{background:"#1e293b",width:"100%",height:"100%"}} />}
              <div className="category-card-caption"><span>Transmissions</span><span className="cat-arrow">→</span></div>
            </Link>
            <Link href="/parts" className="category-image-card">
              {withPhoto[2]?.thumbnail ? (
                <Image src={withPhoto[2].thumbnail} alt="Performance" fill className="category-card-img" sizes="(max-width:900px)100vw,420px" />
              ) : <div style={{background:"#1e293b",width:"100%",height:"100%"}} />}
              <div className="category-card-caption"><span>Performance &amp; Exhausts</span><span className="cat-arrow">→</span></div>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. 3D Automotive Showroom Brand Logo Cards Grid */}
      <section className="section showroom-brand-section" style={{ padding: "56px 0 64px" }}>
        <div className="container">
          <div className="ahs-section-head">
            <div className="ahs-title-wrap">
              <span className="ahs-subtitle-tag">AUTOMOTIVE SHOWROOM</span>
              <h2 className="ahs-title">SHOP BY MAKE</h2>
              <p className="ahs-desc">Explore Genuine &amp; Tested Parts by Vehicle Brand</p>
            </div>
            <Link href="/parts" className="btn-view-all-brands">
              <span>VIEW ALL BRANDS</span>
              <span className="arrow">→</span>
            </Link>
          </div>

          <div className="brand-card-grid-3d">
            {FEATURED_BRANDS.map((make) => {
              const col = collections.find((c) => c.title.toLowerCase() === make.toLowerCase());
              return (
                <BrandCard3D
                  key={make}
                  make={make}
                  handle={col?.handle ?? make.toLowerCase()}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Brand Wall Banner ("Your One Stop Auto Shop") */}
      <section className="container" style={{ paddingBottom: 48 }}>
        <div className="brand-wall-banner">
          <div className="brand-wall-logos-col">
            {collections.slice(0, 20).map((c) => (
              <div key={c.id} className="brand-wall-logo-item">
                <BrandLogo make={c.title} size={110} />
              </div>
            ))}
          </div>
          <div className="brand-wall-cta-col">
            <h2 className="brand-wall-title">Your One Stop Auto Shop</h2>
            <p className="brand-wall-sub">See all the OEM brands &amp; parts we offer!</p>
            <Link href="/parts" className="btn-primary lg">
              Explore Brands →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Dyno-Tested Featured Products Grid */}
      <section className="section" id="catalog-section" style={{ background: "#ffffff", padding: "56px 0" }}>
        <div className="container">
          <div className="ahs-section-head">
            <div className="ahs-title-wrap"><h2 className="ahs-title">Recently Tested &amp; Ready to Ship</h2></div>
            <Link href="/parts" className="ahs-link">Browse All Inventory &gt;</Link>
          </div>
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* 8. How It Works */}
      <section id="how" className="section" style={{ padding: "56px 0" }}>
        <div className="container">
          <div className="ahs-section-head">
            <div className="ahs-title-wrap"><h2 className="ahs-title">How It Works</h2></div>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.title} className="step-card">
                <div className="step-icon">{s.icon}</div>
                <div className="step-num">STEP {i + 1}</div>
                <div className="step-title">{s.title}</div>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Licensed Facility / Warranty */}
      <section id="warranty" style={{ background: "#000", color: "#fff", padding: "80px 0" }}>
        <div className="container warranty-grid">
          <div className="warranty-photo">
            <Image src="/images/facility.jpg" alt="Orion Car Parts facility" fill sizes="(max-width:980px)100vw,600px" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <h2 className="head" style={{ fontWeight: 900, fontSize: 34, margin: "0 0 16px" }}>A Licensed Facility, Not a Middleman</h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "#9ca3af", marginBottom: 28 }}>
              Orion Car Parts is a licensed auto repair facility. Every engine and transmission passes through our own shop — compression testing, leak-down testing, fluid inspection and diagnostic scanning — before it&apos;s cleared for sale.
            </p>
            <div className="warranty-checks">
              {["Written warranty up to 3 years", "Mileage verified & documented", "30-day money-back guarantee", "Financing available at checkout"].map((t) => (
                <div key={t} className="warranty-check"><b style={{color:"var(--red-racing)"}}>✓</b> {t}</div>
              ))}
            </div>
            <AccreditationRow />
          </div>
        </div>
      </section>

      {/* 10. Reviews & FAQ */}
      <section className="section" style={{ background: "#fff", padding: "60px 0" }}>
        <div className="container">
          <div className="ahs-section-head">
            <div className="ahs-title-wrap"><h2 className="ahs-title">What Customers Say</h2></div>
            <span className="stars lg">★★★★★</span>
          </div>
          <div className="reviews-grid">
            {REVIEWS.map((r) => (
              <div key={r.name} className="review-card">
                <span className="stars">★★★★★</span>
                <p>{r.text}</p>
                <div style={{ marginTop: "auto", paddingTop: 6 }}>
                  <div className="review-name">{r.name}</div>
                  <div className="review-detail">{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" style={{ padding: "60px 0" }}>
        <div className="faq-wrap">
          <h2 style={{ textAlign: "center", fontSize: 36, fontWeight: 900, marginBottom: 36 }}>Frequently Asked Questions</h2>
          <div className="faq-list">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Quote Banner */}
      <section className="quote-banner">
        <div className="container quote-banner-inner">
          <div>
            <h2 style={{ color: "#fff", fontSize: 36, fontWeight: 900, margin: "0 0 10px" }}>Need the Right Part Today?</h2>
            <p style={{ color: "#9ca3af", fontSize: 17, margin: 0 }}>Get a no-obligation quote in minutes — or call and talk to a parts expert now.</p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <a href="tel:+18885550142" className="quote-banner-phone">1-888-555-0142</a>
            <QuoteButton className="btn-primary lg">Get a Free Quote</QuoteButton>
          </div>
        </div>
      </section>
    </main>
  );
}
