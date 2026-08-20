"use client";

import { useActionState, useState } from "react";
import { placeOrder, type CheckoutResult } from "@/lib/cart";

export function CheckoutForm() {
  const [state, formAction, isPending] = useActionState<
    CheckoutResult,
    FormData
  >(placeOrder, undefined);

  const [clientError, setClientError] = useState<string | null>(null);

  const handleInvalid = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError("Please fill out all required fields marked with an asterisk (*).");
  };

  const errorToDisplay = clientError || (state && "error" in state ? state.error : null);

  return (
    <form 
      action={formAction} 
      className="ck-form"
      onInvalid={handleInvalid}
      onChange={() => setClientError(null)}
    >
      {/* ── Error Banner ── */}
      {errorToDisplay ? (
        <div className="ck-form-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>{errorToDisplay}</span>
        </div>
      ) : null}

      {/* ═══════ CONTACT ═══════ */}
      <div className="ck-card ck-form-section">
        <div className="ck-section-head">
          <span className="ck-section-num">01</span>
          <h2 className="ck-section-title">CONTACT INFORMATION</h2>
        </div>
        <div className="ck-field-grid">
          <div className="ck-field ck-field-full">
            <label htmlFor="ck-email">Email Address <span className="ck-req">*</span></label>
            <input id="ck-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="ck-field">
            <label htmlFor="ck-phone">Phone Number</label>
            <input id="ck-phone" name="phone" type="tel" placeholder="(555) 555-0142" autoComplete="tel" />
          </div>
        </div>
      </div>

      {/* ═══════ SHIPPING ADDRESS ═══════ */}
      <div className="ck-card ck-form-section">
        <div className="ck-section-head">
          <span className="ck-section-num">02</span>
          <h2 className="ck-section-title">SHIPPING ADDRESS</h2>
        </div>
        <div className="ck-field-grid">
          <div className="ck-field">
            <label htmlFor="ck-fname">First Name <span className="ck-req">*</span></label>
            <input id="ck-fname" name="first_name" required autoComplete="given-name" />
          </div>
          <div className="ck-field">
            <label htmlFor="ck-lname">Last Name <span className="ck-req">*</span></label>
            <input id="ck-lname" name="last_name" required autoComplete="family-name" />
          </div>
          <div className="ck-field ck-field-full">
            <label htmlFor="ck-addr">Street Address <span className="ck-req">*</span></label>
            <input id="ck-addr" name="address_1" required placeholder="1240 Industrial Pkwy" autoComplete="street-address" />
          </div>
          <div className="ck-field">
            <label htmlFor="ck-city">City <span className="ck-req">*</span></label>
            <input id="ck-city" name="city" required autoComplete="address-level2" />
          </div>
          <div className="ck-field ck-field-half">
            <label htmlFor="ck-state">State</label>
            <input id="ck-state" name="province" placeholder="TX" autoComplete="address-level1" />
          </div>
          <div className="ck-field ck-field-half">
            <label htmlFor="ck-zip">ZIP Code <span className="ck-req">*</span></label>
            <input id="ck-zip" name="postal_code" required placeholder="77041" autoComplete="postal-code" />
          </div>
        </div>
      </div>

      {/* ═══════ DELIVERY / SHIPPING METHOD ═══════ */}
      <div className="ck-card ck-form-section">
        <div className="ck-section-head">
          <span className="ck-section-num">03</span>
          <h2 className="ck-section-title">DELIVERY METHOD</h2>
        </div>
        <div className="ck-ship-options">
          <label className="ck-ship-option ck-ship-selected">
            <input
              type="radio"
              name="shipping_option"
              value="standard"
              defaultChecked
              className="ck-ship-radio"
            />
            <div className="ck-ship-content">
              <div className="ck-ship-top">
                <span className="ck-ship-name">Standard Freight</span>
                <span className="ck-ship-price-tag">FREE</span>
              </div>
              <p className="ck-ship-desc">Palletized freight delivery, 3–7 business days. Free to the 48 contiguous states.</p>
            </div>
          </label>
          <label className="ck-ship-option">
            <input
              type="radio"
              name="shipping_option"
              value="liftgate"
              className="ck-ship-radio"
            />
            <div className="ck-ship-content">
              <div className="ck-ship-top">
                <span className="ck-ship-name">Liftgate + Residential</span>
                <span className="ck-ship-price-tag">$75</span>
              </div>
              <p className="ck-ship-desc">Freight with liftgate service — recommended for home delivery without a loading dock.</p>
            </div>
          </label>
        </div>
      </div>

      {/* ═══════ PLACE ORDER BUTTON ═══════ */}
      <button
        type="submit"
        className="ck-btn-primary ck-btn-place-order"
        disabled={isPending}
      >
        <span className="ck-btn-inner">
          {isPending ? (
            <>
              <span className="ck-spinner" />
              PROCESSING ORDER…
            </>
          ) : (
            <>
              PLACE ORDER
              <svg className="ck-btn-arrow" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </>
          )}
        </span>
      </button>

      <p className="ck-payment-note">
        Payment is processed securely through our order system. No card is required for this order — our parts specialist will confirm pricing and arrange payment after VIN verification.
      </p>
    </form>
  );
}
