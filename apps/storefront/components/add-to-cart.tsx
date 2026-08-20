"use client";

import { useState } from "react";
import { useCart } from "./cart-context";

export function AddToCartButton({
  variantId,
  className = "btn-primary lg",
  label = "Add to Cart",
  quantity = 1,
}: {
  variantId: string;
  className?: string;
  label?: string;
  quantity?: number;
}) {
  const { addItem, isPending } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending || added) return;

    try {
      await addItem(variantId, quantity);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
      }, 2000);
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  };

  return (
    <button
      type="button"
      className={className}
      disabled={isPending || added}
      onClick={handleAdd}
      style={{ cursor: isPending || added ? "not-allowed" : "pointer" }}
    >
      {isPending ? "ADDING..." : added ? "✓ ADDED" : label}
    </button>
  );
}
