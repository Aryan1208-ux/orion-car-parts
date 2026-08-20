"use client";

import { useState } from "react";
import type { HttpTypes } from "@medusajs/types";
import { AddToCartButton } from "./add-to-cart";
import { QuoteButton } from "./quote";

export function PdpBuyBlock({
  variants,
  price,
}: {
  variants: HttpTypes.StoreProductVariant[];
  price: number | null;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);

  if (!variants || variants.length === 0) {
    return (
      <div className="pdp-buy-unavailable">
        <p style={{ color: "var(--red-racing)", fontWeight: 700, margin: 0 }}>
          This part is currently unavailable.
        </p>
        <QuoteButton className="btn-outline">
          Request Stock Notification
        </QuoteButton>
      </div>
    );
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];

  return (
    <div className="pdp-buy-container">
      {/* Variant Selector (if multiple variants exist) */}
      {variants.length > 1 && (
        <div className="pdp-variant-selector-wrap">
          <label htmlFor="pdp-variant-select" className="pdp-selector-label">
            Select Spec / Grade:
          </label>
          <select
            id="pdp-variant-select"
            className="pdp-variant-select"
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} {v.sku ? `(SKU: ${v.sku})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity & Add to Cart Action Row */}
      <div className="pdp-actions-row">
        <div className="qty-row pdp-qty-selector">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            −
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity(quantity + 1)}>
            +
          </button>
        </div>

        {selectedVariantId && price !== null ? (
          <AddToCartButton
            variantId={selectedVariantId}
            quantity={quantity}
            className="btn-primary lg pdp-add-to-cart"
          />
        ) : (
          <QuoteButton className="btn-primary lg">Request Price Quote</QuoteButton>
        )}

        <QuoteButton className="btn-outline">Get a Free Quote</QuoteButton>
      </div>
    </div>
  );
}
