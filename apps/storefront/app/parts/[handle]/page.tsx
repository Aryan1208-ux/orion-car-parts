import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatUSD, getProductByHandle, productPrice } from "@/lib/data";
import { PdpBuyBlock } from "@/components/pdp-buy-block";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const SPEC_LABELS: [string, string][] = [
  ["make", "Make"],
  ["model", "Model"],
  ["year", "Year"],
  ["part", "Part"],
  ["trim_spec", "Trim / Spec"],
  ["engine_size", "Engine Size"],
  ["vin_code", "VIN Code"],
  ["transmission_type", "Transmission Type"],
  ["transmission_code", "Transmission Code"],
  ["drive_type", "Drive Type"],
  ["mileage", "Mileage"],
  ["condition", "Condition"],
  ["warranty", "Warranty"],
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const meta = (product.metadata ?? {}) as Record<string, string>;
  const price = productPrice(product);
  const image = product.thumbnail || product.images?.[0]?.url;
  const variants = product.variants ?? [];
  const specs = SPEC_LABELS.filter(([key]) => meta[key]);

  return (
    <main>
      <div className="container breadcrumbs">
        <Link href="/">Home</Link> /{" "}
        <Link href="/parts">All Inventory</Link>
        {product.categories?.[0] && (
          <>
            {" "}
            /{" "}
            <Link href={`/parts?part=${product.categories[0].handle}`}>
              {product.categories[0].name}
            </Link>
          </>
        )}
      </div>
      <div className="container pdp-grid">
        <div className="pdp-photo">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width: 980px) 100vw, 600px"
              priority
            />
          ) : (
            <span className="photo-placeholder">
              {(meta.part || "part").toLowerCase()} photo
            </span>
          )}
        </div>
        <div>
          <span className="product-tag">{meta.part || "Part"}</span>
          <h1 className="pdp-title">{product.title}</h1>
          <p className="pdp-sub">
            {[
              meta.condition || "Used",
              "OEM replacement",
              variants[0]?.sku ? `SKU ${variants[0].sku}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="pdp-price">
            {price !== null ? formatUSD(price) : "Call for price"}
          </p>
          <p className="pdp-price-note">
            Free freight shipping to the 48 contiguous states · Financing
            available
          </p>
          <div className="pdp-buy">
            <PdpBuyBlock variants={variants} price={price} />
          </div>
          <div className="pdp-perks">

            <div className="pdp-perk">
              <b>✓</b> Written warranty included
            </div>
            <div className="pdp-perk">
              <b>✓</b> VIN-matched before shipping
            </div>
            <div className="pdp-perk">
              <b>✓</b> Compression &amp; leak-down tested
            </div>
            <div className="pdp-perk">
              <b>✓</b> 30-day money-back guarantee
            </div>
          </div>
          {specs.length > 0 && (
            <table className="spec-table">
              <tbody>
                {specs.map(([key, label]) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>{meta[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="container pdp-desc">
        <h2 className="head">About this part</h2>
        {meta.description_html ? (
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(meta.description_html),
            }}
          />
        ) : (
          <p>{product.description}</p>
        )}
      </div>
    </main>
  );
}
