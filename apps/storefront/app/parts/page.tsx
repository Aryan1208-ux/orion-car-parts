import Link from "next/link";
import { listCategories, listCollections, listProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type SearchParams = Promise<{
  q?: string;
  part?: string;
  make?: string;
  year?: string;
  page?: string;
}>;

export default async function PartsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const [collections, categories] = await Promise.all([
    listCollections(),
    listCategories(),
  ]);

  const category = categories.find((c) => c.handle === params.part);
  const collection = collections.find((c) => c.handle === params.make);
  const q = [params.year, params.q].filter(Boolean).join(" ");

  let { products, count } = await listProducts({
    q: q || undefined,
    category_id: category ? [category.id] : undefined,
    collection_id: collection ? [collection.id] : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    order: "-created_at",
  });
  // catalog titles are inconsistent about hyphens ("F-150" vs "F150") —
  // retry a de-hyphenated query before declaring zero results
  if (count === 0 && q.includes("-")) {
    ({ products, count } = await listProducts({
      q: q.replace(/-/g, ""),
      category_id: category ? [category.id] : undefined,
      collection_id: collection ? [collection.id] : undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      order: "-created_at",
    }));
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.part) sp.set("part", params.part);
    if (params.make) sp.set("make", params.make);
    if (params.year) sp.set("year", params.year);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/parts${s ? `?${s}` : ""}`;
  };

  const heading = category
    ? category.name
    : collection
      ? `${collection.title} Parts`
      : "All Inventory";

  return (
    <main>
      <div className="page-head">
        <div className="container page-head-inner">
          <h1>{heading}</h1>
          <p>
            Tested used engines &amp; transmissions — VIN-matched, warrantied
            and shipped nationwide.
          </p>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <CatalogFilters
          categories={categories.map((c) => ({
            handle: c.handle,
            name: c.name,
          }))}
          makes={collections.map((c) => ({ handle: c.handle, title: c.title }))}
          current={{
            q: params.q || "",
            part: params.part || "",
            make: params.make || "",
            year: params.year || "",
          }}
        />
        <div className="inventory-status-bar">
          <div className="inventory-status-chip">
            <span className="status-pulse-dot" />
            <span className="inventory-count-num">{count.toLocaleString()}</span>
            <span className="inventory-count-lbl">VEHICLES / PARTS AVAILABLE</span>
            {q && <span className="inventory-query-tag">Matching “{q}”</span>}
          </div>
        </div>
        {products.length === 0 ? (
          <div className="empty-state">
            <h1 className="head">No matching parts</h1>
            <p>
              Try a different year or model — or request a quote and we&apos;ll
              locate the unit for you.
            </p>
            <Link href="/parts" className="btn-primary">
              Browse all inventory
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <nav className="pagination">
            <Link
              href={pageHref(page - 1)}
              className={page <= 1 ? "disabled" : ""}
            >
              ← Prev
            </Link>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(
                1,
                Math.min(page - 3, totalPages - 6)
              );
              const p = start + i;
              if (p > totalPages) return null;
              return p === page ? (
                <span key={p} className="current">
                  {p}
                </span>
              ) : (
                <Link key={p} href={pageHref(p)}>
                  {p}
                </Link>
              );
            })}
            <Link
              href={pageHref(page + 1)}
              className={page >= totalPages ? "disabled" : ""}
            >
              Next →
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}
