"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLineItem, removeLineItem } from "@/lib/cart";
import { useCart } from "./cart-context";

export function CartLineControls({
  lineId,
  quantity,
}: {
  lineId: string;
  quantity: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const cart = useCart();

  const handleUpdate = (newQty: number) => {
    startTransition(async () => {
      if (newQty <= 0) {
        await removeLineItem(lineId);
      } else {
        await updateLineItem(lineId, newQty);
      }
      router.refresh();
    });
  };

  return (
    <div className="ck-line-controls" data-pending={isPending || undefined}>
      <div className="ck-qty-row">
        <button
          type="button"
          className="ck-qty-btn"
          disabled={isPending || quantity <= 1}
          onClick={() => handleUpdate(quantity - 1)}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="ck-qty-val">{quantity}</span>
        <button
          type="button"
          className="ck-qty-btn"
          disabled={isPending}
          onClick={() => handleUpdate(quantity + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        type="button"
        className="ck-remove-btn"
        disabled={isPending}
        onClick={() => handleUpdate(0)}
      >
        {isPending ? "Removing…" : "Remove"}
      </button>
    </div>
  );
}
