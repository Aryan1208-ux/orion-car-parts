import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { retrieveCart } from "@/lib/cart";
import { formatUSD } from "@/lib/data";
import { CheckoutForm } from "@/components/checkout-form";

export const dynamic = "force-dynamic";

/* ——— progress step indicator ——— */
function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "CART" },
    { n: 2, label: "CHECKOUT" },
    { n: 3, label: "CONFIRMATION" },
  ];
  return (
    <div className="ck-progress">
      {steps.map((s, i) => (
        <div key={s.n} className="ck-progress-step-wrap">
          <div
            className={`ck-progress-step ${s.n <= step ? "active" : ""} ${s.n === step ? "current" : ""}`}
          >
            <span className="ck-progress-num">{String(s.n).padStart(2, "0")}</span>
            <span className="ck-progress-label">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <span className={`ck-progress-divider ${s.n < step ? "done" : ""}`}>
              <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
                <path d="M2 5h14M13 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function CheckoutPage() {
  const cart = await retrieveCart();
  if (!cart || !cart.items?.length) redirect("/cart");

  const items = cart.items;
  const subtotal = cart.item_subtotal ?? 0;
  const total = cart.item_total ?? cart.total ?? 0;

  return (
    <main className="ck-page">
      <div className="ck-wrapper">
        <ProgressBar step={2} />

        <div className="ck-header">
          <h1 className="ck-title">CHECKOUT</h1>
          <p className="ck-subtitle">Review your order and complete your purchase.</p>
        </div>

        <div className="ck-two-col">
          {/* ═══════════ LEFT: FORM + ITEMS ═══════════ */}
          <div className="ck-main">
            {/* — Order Items — */}
            <div className="ck-card ck-card-items-compact">
              <div className="ck-card-head">
                <h2 className="ck-card-title">YOUR ITEMS</h2>
                <span className="ck-item-count">{items.length} {items.length === 1 ? "item" : "items"}</span>
              </div>

              <div className="ck-lines ck-lines-compact">
                {items.map((item) => {
                  const meta = (item.variant?.product?.metadata ?? {}) as Record<string, string>;
                  const image = item.thumbnail || item.variant?.product?.thumbnail;
                  const make = meta.brand || meta.make || "";

                  return (
                    <div key={item.id} className="ck-line ck-line-compact">
                      <div className="ck-line-img-wrap ck-img-sm" style={{ position: "relative", width: "72px", height: "56px", minWidth: "72px", minHeight: "56px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {image ? (
                          <Image
                            src={image}
                            alt={item.product_title || item.title || ""}
                            fill
                            sizes="72px"
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <div className="ck-line-placeholder">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                          </div>
                        )}
                      </div>
                      <div className="ck-line-info">
                        {make && <span className="ck-line-make">{make.toUpperCase()}</span>}
                        <span className="ck-line-name-compact">{item.product_title || item.title}</span>
                        <span className="ck-line-qty-label">Qty {item.quantity}</span>
                      </div>
                      <div className="ck-line-price">
                        {formatUSD(item.unit_price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link href="/cart" className="ck-edit-cart-link">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4l-9 0M13 8l-9 0M13 12l-5 0"/></svg>
                Edit cart
              </Link>
            </div>

            {/* — Checkout Form (Contact, Address, Shipping, Place Order) — */}
            <CheckoutForm />
          </div>

          {/* ═══════════ RIGHT: ORDER SUMMARY ═══════════ */}
          <aside className="ck-sidebar">
            <div className="ck-summary-card">
              <h2 className="ck-summary-title">ORDER SUMMARY</h2>

              <div className="ck-summary-items-mini">
                {items.map((item) => (
                  <div key={item.id} className="ck-summary-mini-row">
                    <span className="ck-mini-name">
                      {item.product_title || item.title}
                      {item.quantity > 1 && <span className="ck-mini-qty"> × {item.quantity}</span>}
                    </span>
                    <span className="ck-mini-price">{formatUSD(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="ck-summary-divider" />

              <div className="ck-summary-rows">
                <div className="ck-summary-row">
                  <span>Subtotal</span>
                  <span>{formatUSD(subtotal)}</span>
                </div>
                <div className="ck-summary-row">
                  <span>Shipping</span>
                  <span className="ck-shipping-free">FREE</span>
                </div>
              </div>

              <div className="ck-summary-divider" />

              <div className="ck-summary-row ck-summary-total">
                <span>TOTAL</span>
                <span>{formatUSD(total)}</span>
              </div>

              <div className="ck-trust-strip">
                <div className="ck-trust-item"><span className="ck-trust-check">🔒</span> Secure checkout</div>
                <div className="ck-trust-item"><span className="ck-trust-check">✓</span> VIN-matched parts</div>
                <div className="ck-trust-item"><span className="ck-trust-check">✓</span> Written warranty</div>
                <div className="ck-trust-item"><span className="ck-trust-check">✓</span> Nationwide shipping</div>
              </div>

              <div className="ck-pay-marks">
                <PaymentMarks />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ── kept outside default to import as named if needed ── */
import { PaymentMarks } from "@/components/trust-badges";
