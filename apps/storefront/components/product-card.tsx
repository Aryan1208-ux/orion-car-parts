import Link from "next/link";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { formatUSD, productPrice } from "@/lib/data";
import { AddToCartButton } from "./add-to-cart";

export function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const meta = (product.metadata ?? {}) as Record<string, string>;
  const price = productPrice(product);
  const image = product.thumbnail || product.images?.[0]?.url;
  const isEngine = (meta.part || "").toLowerCase().includes("engine");
  const variant = product.variants?.[0];

  return (
    <Link href={`/parts/${product.handle}`} className="product-card">
      <div className="product-photo-wrap">
        <div className="product-photo-badges">
          <span className="badge-tested">✓ Compression Tested</span>
          <span className="badge-warranty">3-Yr Warranty</span>
        </div>

        <div className="product-photo">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width: 860px) 50vw, 360px"
              className="product-img"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", gap: 6 }}>
              <span style={{ fontSize: 32 }}>{isEngine ? "⚙️" : "🔄"}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>OEM Tested {meta.part || "Part"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="product-body">
        <div className="product-tag-row">
          <span className="product-tag">{meta.brand || meta.make || "OEM Parts"}</span>
          <span className="product-condition">{meta.condition || "Tested Used"}</span>
        </div>

        <h3 className="product-name">{product.title}</h3>

        <div className="product-specs-chips">
          {meta.year && <span className="spec-chip">{meta.year}</span>}
          {meta.engine_size && <span className="spec-chip">{meta.engine_size}</span>}
          {meta.mileage && <span className="spec-chip">{meta.mileage} mi</span>}
          {meta.vin_code && <span className="spec-chip">VIN: {meta.vin_code}</span>}
        </div>

        <div className="product-foot">
          <span className="product-price">
            {price !== null ? formatUSD(price) : "Call for price"}
          </span>
          {variant && price !== null ? (
            <AddToCartButton
              variantId={variant.id}
              label="Add to Cart"
              className="btn-card-add-to-cart"
            />
          ) : (
            <span className="btn-card-action">View Part →</span>
          )}
        </div>
      </div>
    </Link>
  );
}

