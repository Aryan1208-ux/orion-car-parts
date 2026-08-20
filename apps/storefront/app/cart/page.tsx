import Link from "next/link";
import Image from "next/image";
import { retrieveCart } from "@/lib/cart";
import { formatUSD } from "@/lib/data";
import { CartLineControls } from "@/components/cart-line-controls";
import { PaymentMarks } from "@/components/trust-badges";

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

export default async function CartPage() {
  const cart = await retrieveCart();
  const items = cart?.items ?? [];

  /* ——— EMPTY CART STATE ——— */
  if (!cart || items.length === 0) {
    return (
      <main className="ck-page">
        <div className="ck-wrapper">
          <ProgressBar step={1} />
          <div className="ck-empty">
            <div className="ck-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <h1 className="ck-empty-title">YOUR CART IS EMPTY</h1>
            <p className="ck-empty-sub">Your next build starts here — find tested, VIN-matched parts for your vehicle.</p>
            <Link href="/parts" className="ck-btn-primary">
              EXPLORE INVENTORY
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const subtotal = cart.item_subtotal ?? 0;
  const total = cart.item_total ?? cart.total ?? 0;

  return (
    <main className="ck-page">
      <div className="ck-wrapper">
        <ProgressBar step={1} />

        <div className="ck-header">
          <h1 className="ck-title">YOUR CART</h1>
          <p className="ck-subtitle">Review your selected parts before checkout.</p>
        </div>

        <div className="ck-two-col">
          {/* ═══════════ LEFT: CART ITEMS ═══════════ */}
          <div className="ck-main">
            <div className="ck-card">
              <div className="ck-card-head">
                <h2 className="ck-card-title">YOUR ITEMS</h2>
                <span className="ck-item-count">{items.length} {items.length === 1 ? "item" : "items"}</span>
              </div>

              <div className="ck-lines">
                {items.map((item) => {
                  const meta = (item.variant?.product?.metadata ?? {}) as Record<string, string>;
                  const image = item.thumbnail || item.variant?.product?.thumbnail || undefined;
                  const make = meta.brand || meta.make || "";
                  const partType = meta.part || "";
                  const condition = meta.condition || "Used";

                  return (
                    <div key={item.id} className="ck-line">
                      <div className="ck-line-img-wrap">
                        {image ? (
                          <Image
                            src={image}
                            alt={item.product_title || item.title || ""}
                            fill
                            sizes="100px"
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <div className="ck-line-placeholder">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                          </div>
                        )}
                      </div>

                      <div className="ck-line-info">
                        {make && <span className="ck-line-make">{make.toUpperCase()}</span>}
                        <Link
                          href={`/parts/${item.variant?.product?.handle ?? ""}`}
                          className="ck-line-name"
                        >
                          {item.product_title || item.title}
                        </Link>
                        <div className="ck-line-meta">
                          {[partType, condition, item.variant_sku].filter(Boolean).join(" · ")}
                        </div>
                        <CartLineControls lineId={item.id} quantity={item.quantity} />
                      </div>

                      <div className="ck-line-price">
                        {formatUSD(item.unit_price * item.quantity)}
                        {item.quantity > 1 && (
                          <span className="ck-line-unit">{formatUSD(item.unit_price)} each</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══════════ RIGHT: ORDER SUMMARY ═══════════ */}
          <aside className="ck-sidebar">
            <div className="ck-summary-card">
              <h2 className="ck-summary-title">ORDER SUMMARY</h2>

              <div className="ck-summary-rows">
                <div className="ck-summary-row">
                  <span>Subtotal</span>
                  <span>{formatUSD(subtotal)}</span>
                </div>
                <div className="ck-summary-row">
                  <span>Shipping</span>
                  <span className="ck-shipping-free">Calculated at checkout</span>
                </div>
              </div>

              <div className="ck-summary-divider" />

              <div className="ck-summary-row ck-summary-total">
                <span>TOTAL</span>
                <span>{formatUSD(total)}</span>
              </div>

              <Link href="/checkout" className="ck-btn-primary ck-btn-full">
                PROCEED TO CHECKOUT
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              </Link>

              <div className="ck-trust-strip">
                <div className="ck-trust-item"><span className="ck-trust-check">🔒</span> Secure checkout</div>
                <div className="ck-trust-item"><span className="ck-trust-check">✓</span> VIN-matched parts</div>
                <div className="ck-trust-item"><span className="ck-trust-check">✓</span> Written warranty</div>
                <div className="ck-trust-item"><span className="ck-trust-check">✓</span> Free freight to 48 states</div>
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
