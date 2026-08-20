"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HttpTypes } from "@medusajs/types";
import { sdk } from "./sdk";

const CART_COOKIE = "_orion_cart_id";

const CART_FIELDS =
  "*items,*items.variant,*items.variant.product,*region,*shipping_methods";

async function getCartId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

export async function retrieveCart(): Promise<HttpTypes.StoreCart | null> {
  const cartId = await getCartId();
  if (!cartId) return null;
  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: CART_FIELDS,
    });
    return cart;
  } catch {
    return null;
  }
}

async function getOrCreateCartId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) {
    try {
      await sdk.store.cart.retrieve(existing, { fields: "id" });
      return existing;
    } catch {
      // stale cart (e.g. completed or DB reset) — create a new one
    }
  }
  const { regions } = await sdk.store.region.list();
  const region = regions.find((r) => r.currency_code === "usd") || regions[0];
  const { cart } = await sdk.store.cart.create({ region_id: region.id });
  store.set(CART_COOKIE, cart.id, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
  });
  return cart.id;
}

export async function addToCart(variantId: string) {
  const cartId = await getOrCreateCartId();
  await sdk.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity: 1,
  });
  revalidatePath("/cart");
  redirect("/cart");
}

export async function addToCartClient(variantId: string, quantity: number = 1): Promise<HttpTypes.StoreCart | null> {
  const cartId = await getOrCreateCartId();
  await sdk.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  });
  revalidatePath("/");
  return retrieveCart();
}

export async function updateLineItem(lineId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId) return;
  if (quantity <= 0) {
    await sdk.store.cart.deleteLineItem(cartId, lineId);
  } else {
    await sdk.store.cart.updateLineItem(cartId, lineId, { quantity });
  }
  revalidatePath("/cart");
}

export async function updateLineItemClient(lineId: string, quantity: number): Promise<HttpTypes.StoreCart | null> {
  const cartId = await getCartId();
  if (!cartId) return null;
  if (quantity <= 0) {
    await sdk.store.cart.deleteLineItem(cartId, lineId);
  } else {
    await sdk.store.cart.updateLineItem(cartId, lineId, { quantity });
  }
  revalidatePath("/");
  return retrieveCart();
}

export async function removeLineItem(lineId: string) {
  const cartId = await getCartId();
  if (!cartId) return;
  await sdk.store.cart.deleteLineItem(cartId, lineId);
  revalidatePath("/cart");
}

export async function removeLineItemClient(lineId: string): Promise<HttpTypes.StoreCart | null> {
  const cartId = await getCartId();
  if (!cartId) return null;
  await sdk.store.cart.deleteLineItem(cartId, lineId);
  revalidatePath("/");
  return retrieveCart();
}


export type CheckoutResult = { error: string } | void;

export async function placeOrder(
  _prev: CheckoutResult,
  formData: FormData
): Promise<CheckoutResult> {
  const cartId = await getCartId();
  if (!cartId) return { error: "Your cart is empty." };

  const val = (k: string) => String(formData.get(k) ?? "").trim();
  const email = val("email");
  const firstName = val("first_name");
  const lastName = val("last_name");
  const address = val("address_1");
  const city = val("city");
  const province = val("province");
  const postal = val("postal_code");
  const phone = val("phone");
  const shippingChoice = val("shipping_option");

  if (!email || !firstName || !lastName || !address || !city || !postal) {
    return { error: "Please fill in all required fields." };
  }

  let orderId: string;
  try {
    const shippingAddress = {
      first_name: firstName,
      last_name: lastName,
      address_1: address,
      city,
      province,
      postal_code: postal,
      country_code: "us",
      phone,
    };

    await sdk.store.cart.update(cartId, {
      email,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
    });

    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
      cart_id: cartId,
    });
    if (!shipping_options?.length) {
      return { error: "No shipping options available for your address." };
    }
    const wanted =
      shipping_options.find((o) =>
        shippingChoice === "liftgate"
          ? o.name.toLowerCase().includes("liftgate")
          : !o.name.toLowerCase().includes("liftgate")
      ) || shipping_options[0];

    await sdk.store.cart.addShippingMethod(cartId, { option_id: wanted.id });

    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "*payment_collection,*payment_collection.payment_sessions",
    });
    await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: "pp_system_default",
    });

    const result = await sdk.store.cart.complete(cartId);
    if (result.type !== "order") {
      return { error: result.error?.message || "Could not complete the order." };
    }
    orderId = result.order.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Checkout failed." };
  }

  const store = await cookies();
  store.delete(CART_COOKIE);
  redirect(`/order/confirmed/${orderId}`);
}
