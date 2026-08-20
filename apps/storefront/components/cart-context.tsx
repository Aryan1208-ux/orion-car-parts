"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { HttpTypes } from "@medusajs/types";
import { retrieveCart, addToCartClient, updateLineItemClient, removeLineItemClient } from "@/lib/cart";

function formatUSD(amount: number): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}


interface CartContextType {
  cart: HttpTypes.StoreCart | null;
  cartCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  isPending: boolean;
  error: string | null;
  toast: { message: string; show: boolean } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function CartProvider({
  children,
  initialCart,
}: {
  children: React.ReactNode;
  initialCart: HttpTypes.StoreCart | null;
}) {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(initialCart);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);
  const router = useRouter();

  // Load latest cart client-side on mount to ensure we are synced with backend cookies
  useEffect(() => {
    async function syncCart() {
      try {
        const latest = await retrieveCart();
        if (latest) setCart(latest);
      } catch (err) {
        console.error("Failed to sync Medusa cart:", err);
      }
    }
    syncCart();
  }, []);

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  const showToast = (message: string) => {
    setToast({ message, show: true });
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  };

  const addItem = async (variantId: string, quantity: number = 1) => {
    setError(null);
    startTransition(async () => {
      try {
        const updated = await addToCartClient(variantId, quantity);
        if (updated) {
          setCart(updated);
          setIsDrawerOpen(true);
          showToast("✓ Added to cart");
          router.refresh();
        } else {
          setError("Unable to add this item right now. Please try again.");
        }
      } catch (err) {
        console.error("Error adding to cart:", err);
        setError("Unable to add this item right now. Please try again.");
      }
    });
  };

  const updateItem = async (lineItemId: string, quantity: number) => {
    setError(null);
    startTransition(async () => {
      try {
        const updated = await updateLineItemClient(lineItemId, quantity);
        setCart(updated);
        router.refresh();
      } catch (err) {
        console.error("Error updating item:", err);
        setError("Failed to update quantity. Please try again.");
      }
    });
  };

  const removeItem = async (lineItemId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const updated = await removeLineItemClient(lineItemId);
        setCart(updated);
        router.refresh();
      } catch (err) {
        console.error("Error removing item:", err);
        setError("Failed to remove item. Please try again.");
      }
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isDrawerOpen,
        setIsDrawerOpen,
        addItem,
        updateItem,
        removeItem,
        isPending,
        error,
        toast,
      }}
    >
      {children}

      {/* Premium Notification Toast */}
      {toast?.show && (
        <div className="cart-toast-notification">
          <div className="cart-toast-content">
            <span className="toast-check">✓</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isDrawerOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="cart-drawer-header">
              <h2 className="cart-drawer-title">YOUR CART</h2>
              <button
                type="button"
                className="cart-drawer-close"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close cart drawer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Items Container */}
            <div className="cart-drawer-body">
              {error && <div className="cart-drawer-error">{error}</div>}

              {cartCount === 0 ? (
                <div className="cart-drawer-empty">
                  <div className="empty-icon">🛒</div>
                  <h3>YOUR CART IS EMPTY</h3>
                  <p>Explore our inventory and find the right parts for your vehicle.</p>
                  <Link
                    href="/parts"
                    className="btn-primary lg"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    SHOP PARTS
                  </Link>
                </div>
              ) : (
                <div className="cart-drawer-lines">
                  {cart?.items?.map((item) => {
                    const meta = (item.variant?.product?.metadata ?? {}) as Record<string, string>;
                    const image = item.thumbnail || item.variant?.product?.thumbnail;
                    const make = meta.brand || meta.make || "OEM Parts";

                    return (
                      <div key={item.id} className="cart-drawer-line">
                        <div className="cart-drawer-line-img">
                          {image ? (
                            <Image
                              src={image}
                              alt={item.title || ""}
                              width={80}
                              height={60}
                              style={{ objectFit: "contain" }}
                            />
                          ) : (
                            <div className="cart-line-placeholder">⚙️</div>
                          )}
                        </div>

                        <div className="cart-drawer-line-info">
                          <span className="line-make">{make}</span>
                          <h4 className="line-title">{item.product_title || item.title}</h4>
                          
                          <div className="qty-controls-row">
                            <div className="qty-row">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => updateItem(item.id, item.quantity - 1)}
                              >
                                −
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => updateItem(item.id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="line-remove-btn"
                              disabled={isPending}
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="cart-drawer-line-price">
                          {formatUSD(item.unit_price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cartCount > 0 && (
              <div className="cart-drawer-footer">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span className="footer-subtotal">
                    {formatUSD(cart?.item_subtotal ?? 0)}
                  </span>
                </div>
                <div className="drawer-perks">
                  ✓ Free freight to 48 states · 3-Yr Warranty
                </div>
                <div className="drawer-actions">
                  <Link
                    href="/cart"
                    className="btn-outline"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    VIEW CART
                  </Link>
                  <Link
                    href="/checkout"
                    className="btn-primary"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    CHECKOUT
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}
