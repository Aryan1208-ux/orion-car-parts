import Link from "next/link";
import { PaymentMarks } from "./trust-badges";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <div className="footer-brand">
            ORION <span className="logo-accent">CAR PARTS</span>
          </div>
          <p className="footer-desc">
            America&apos;s premier supplier of tested OEM used engines and transmissions. VIN-matched, ASE-inspected, and backed by a written nationwide warranty.
          </p>
          <div className="footer-contact-box">
            <div className="footer-contact-item">
              <span className="contact-icon">📍</span>
              <span>1240 Industrial Pkwy, Houston, TX 77041</span>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">📞</span>
              <a href="tel:+18885550142">1-888-555-0142 (Toll-Free)</a>
            </div>
            <div className="footer-contact-item">
              <span className="contact-icon">✉️</span>
              <a href="mailto:support@orioncarparts.com">support@orioncarparts.com</a>
            </div>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Shop Inventory</h4>
          <Link href="/parts?part=used-engines">Used Engines</Link>
          <Link href="/parts?part=used-transmissions">Used Transmissions</Link>
          <Link href="/#finder">VIN Fitment Finder</Link>
          <Link href="/parts">Full Catalog</Link>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Customer Support</h4>
          <Link href="/#warranty">Warranty Policy</Link>
          <Link href="/#how">Shipping &amp; Freight</Link>
          <Link href="/#faq">Returns &amp; Guarantee</Link>
          <Link href="/#faq">FAQ &amp; Help</Link>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Company &amp; Trust</h4>
          <Link href="/#warranty">About Orion Facility</Link>
          <Link href="/#faq">Affirm Financing</Link>
          <a href="mailto:support@orioncarparts.com">Contact Sales</a>
          <Link href="/">Terms &amp; Privacy Policy</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <div className="footer-bottom-left">
          <span>© 2026 Orion Car Parts Inc. All rights reserved.</span>
          <span className="footer-us-badge">🇺🇸 Shipped from USA Facilities</span>
        </div>
        <PaymentMarks />
      </div>
    </footer>
  );
}
