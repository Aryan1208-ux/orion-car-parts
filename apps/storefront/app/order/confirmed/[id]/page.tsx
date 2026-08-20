import Link from "next/link";
import { sdk } from "@/lib/sdk";
import { formatUSD } from "@/lib/data";

export const dynamic = "force-dynamic";

/* ——— progress step indicator ——— */
function ProgressBar() {
  const steps = [
    { n: 1, label: "CART" },
    { n: 2, label: "CHECKOUT" },
    { n: 3, label: "CONFIRMATION" },
  ];
  return (
    <div className="ck-progress">
      {steps.map((s, i) => (
        <div key={s.n} className="ck-progress-step-wrap">
          <div className="ck-progress-step active current">
            <span className="ck-progress-num">{String(s.n).padStart(2, "0")}</span>
            <span className="ck-progress-label">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="ck-progress-divider done">
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

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let order: Awaited<
    ReturnType<typeof sdk.store.order.retrieve>
  >["order"] | null = null;
  try {
    const res = await sdk.store.order.retrieve(id, {
      fields: "*items,*shipping_address,*shipping_methods",
    });
    order = res.order;
  } catch {
    // order not accessible — show generic confirmation
  }

  return (
    <main className="ck-page">
      <div className="ck-wrapper">
        <ProgressBar />

        <div className="ck-confirm-hero">
          <div className="ck-confirm-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h1 className="ck-confirm-title">ORDER CONFIRMED</h1>
          <p className="ck-confirm-sub">
            Thanks{order?.shipping_address?.first_name ? `, ${order.shipping_address.first_name}` : ""}!
            Your order has been received. A parts specialist will verify the VIN match and email freight tracking as soon as your unit ships.
          </p>
        </div>

        {order && (
          <div className="ck-card ck-confirm-details">
            <div className="ck-confirm-order-header">
              <div>
                <span className="ck-confirm-order-label">Order Number</span>
                <strong className="ck-confirm-order-id">#{order.display_id}</strong>
              </div>
              <div>
                <span className="ck-confirm-order-label">Email</span>
                <span className="ck-confirm-order-email">{order.email}</span>
              </div>
            </div>

            <div className="ck-summary-divider" />

            {order.items?.map((item) => (
              <div key={item.id} className="ck-summary-mini-row">
                <span className="ck-mini-name">
                  {item.title} × {item.quantity}
                </span>
                <span className="ck-mini-price">{formatUSD(item.unit_price * item.quantity)}</span>
              </div>
            ))}

            <div className="ck-summary-divider" />

            <div className="ck-summary-rows">
              <div className="ck-summary-row">
                <span>Shipping</span>
                <span>{formatUSD(order.shipping_total ?? 0)}</span>
              </div>
            </div>
            <div className="ck-summary-row ck-summary-total">
              <span>TOTAL</span>
              <span>{formatUSD(order.total ?? 0)}</span>
            </div>
          </div>
        )}

        <div className="ck-confirm-actions">
          <Link href="/parts" className="ck-btn-primary">
            CONTINUE SHOPPING
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
