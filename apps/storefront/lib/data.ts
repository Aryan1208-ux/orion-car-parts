import "server-only";
import { cache } from "react";
import { HttpTypes } from "@medusajs/types";
import { sdk } from "./sdk";

export const PRODUCT_FIELDS =
  "id,title,subtitle,handle,description,thumbnail,metadata,*images,*variants,*variants.calculated_price,*categories,*collection";

export const getRegion = cache(async (): Promise<HttpTypes.StoreRegion> => {
  const { regions } = await sdk.store.region.list();
  const us = regions.find((r) => r.currency_code === "usd") || regions[0];
  if (!us) throw new Error("No region configured — run the backend seed first.");
  return us;
});

export type ProductListParams = {
  q?: string;
  category_id?: string[];
  collection_id?: string[];
  limit?: number;
  offset?: number;
  order?: string;
};

export async function listProducts(params: ProductListParams = {}) {
  const region = await getRegion();
  const { products, count } = await sdk.store.product.list({
    region_id: region.id,
    fields: PRODUCT_FIELDS,
    limit: params.limit ?? 24,
    offset: params.offset ?? 0,
    ...(params.q ? { q: params.q } : {}),
    ...(params.category_id?.length ? { category_id: params.category_id } : {}),
    ...(params.collection_id?.length
      ? { collection_id: params.collection_id }
      : {}),
    ...(params.order ? { order: params.order } : {}),
  });
  return { products, count };
}

export async function getProductByHandle(handle: string) {
  const region = await getRegion();
  const { products } = await sdk.store.product.list({
    handle,
    region_id: region.id,
    fields: PRODUCT_FIELDS,
    limit: 1,
  });
  return products[0] ?? null;
}

export const listCollections = cache(async () => {
  const { collections } = await sdk.store.collection.list({ limit: 100 });
  return collections.sort((a, b) => a.title.localeCompare(b.title));
});

export const listCategories = cache(async () => {
  const { product_categories } = await sdk.store.category.list({ limit: 20 });
  return product_categories;
});

export function productPrice(product: HttpTypes.StoreProduct): number | null {
  const v = product.variants?.[0] as
    | (HttpTypes.StoreProductVariant & {
        calculated_price?: { calculated_amount?: number | null } | null;
      })
    | undefined;
  const amount = v?.calculated_price?.calculated_amount;
  return typeof amount === "number" ? amount : null;
}

export function formatUSD(amount: number): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}
