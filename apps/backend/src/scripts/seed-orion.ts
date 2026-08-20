import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

type OrionRecord = {
  id: number;
  sku: string;
  name: string;
  slug: string;
  price: string;
  category_names: string;
  brand: string;
  image_urls: string;
  short_description_text: string;
  description_text: string;
  description_html: string;
  make: string;
  model: string;
  year: string;
  part: string;
  trim_spec: string;
  engine_size: string;
  vin_code: string;
  condition: string;
  transmission_type: string;
  transmission_code: string;
  drive_type: string;
  mileage: string;
  warranty: string;
};

// Data source priority: explicit env var → full scraped dataset (not in git,
// ~52k products) → bundled 600-product sample so a fresh clone can demo.
const SEED_FILE_CANDIDATES = [
  process.env.SEED_FILE,
  path.resolve(__dirname, "../../../../../data/processed/products_orion.jsonl"),
  path.resolve(__dirname, "../../seed-data/products-sample.jsonl"),
].filter(Boolean) as string[];
const SEED_FILE =
  SEED_FILE_CANDIDATES.find((f) => fs.existsSync(f)) ?? SEED_FILE_CANDIDATES[0];
const RAW_LIMIT = process.env.SEED_LIMIT || "600";
const LIMIT = RAW_LIMIT === "all" ? Infinity : parseInt(RAW_LIMIT, 10);
const BATCH_SIZE = 50;

function cleanTitle(name: string): string {
  let t = name.split("|")[0].trim();
  // the source data doubles the part word: "... Engine Engine", "... Transmission Transmission"
  t = t.replace(/\b(Engine|Transmission)(\s+\1)+\b/gi, "$1");
  return t;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function seedOrion({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const regionModuleService = container.resolve(Modules.REGION);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);

  if (!fs.existsSync(SEED_FILE)) {
    throw new Error(`Seed file not found: ${SEED_FILE} (set SEED_FILE env var)`);
  }

  // ---------------------------------------------------------------- store
  logger.info("Seeding Orion store configuration...");
  const [store] = await storeModuleService.listStores();

  let [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels(
    { name: "Orion Storefront" }
  );
  if (!defaultSalesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Orion Storefront" }] },
    });
    defaultSalesChannel = result[0];
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [{ currency_code: "usd", is_default: true }],
        default_sales_channel_id: defaultSalesChannel.id,
      },
    },
  });

  // ---------------------------------------------------------------- region
  let [region] = await regionModuleService.listRegions({
    name: "United States",
  });
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = result[0];
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "us", provider_id: "tp_system" }],
    });
  }
  logger.info("Region ready.");

  // ---------------------------------------------------------------- stock location + fulfillment
  let [stockLocation] = await stockLocationModuleService.listStockLocations({
    name: "Houston Warehouse",
  });
  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Houston Warehouse",
            address: {
              address_1: "1240 Industrial Pkwy",
              city: "Houston",
              province: "TX",
              postal_code: "77041",
              country_code: "US",
            },
          },
        ],
      },
    });
    stockLocation = result[0];

    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: { default_location_id: stockLocation.id },
      },
    });

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });

    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [defaultSalesChannel.id] },
    });
  }

  let [shippingProfile] = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
    });
    shippingProfile = result[0];
  }

  const existingSets = await fulfillmentModuleService.listFulfillmentSets({
    name: "US Freight Delivery",
  });
  let fulfillmentSet = existingSets[0];
  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "US Freight Delivery",
      type: "shipping",
      service_zones: [
        {
          name: "United States",
          geo_zones: [{ country_code: "us", type: "country" }],
        },
      ],
    });

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Freight (Free)",
          price_type: "flat" as const,
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard Freight",
            description: "Palletized freight, 3-7 business days. Free to the 48 contiguous states.",
            code: "standard-freight",
          },
          prices: [
            { currency_code: "usd", amount: 0 },
            { region_id: region.id, amount: 0 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
            { attribute: "is_return", value: "false", operator: "eq" as const },
          ],
        },
        {
          name: "Liftgate + Residential Delivery",
          price_type: "flat" as const,
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Liftgate Delivery",
            description: "Freight with liftgate service for residential addresses.",
            code: "liftgate-freight",
          },
          prices: [
            { currency_code: "usd", amount: 75 },
            { region_id: region.id, amount: 75 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
            { attribute: "is_return", value: "false", operator: "eq" as const },
          ],
        },
      ],
    });
  }
  logger.info("Fulfillment ready.");

  // ---------------------------------------------------------------- publishable key
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { type: "publishable" },
  });
  let publishableApiKey = existingKeys?.[0];
  if (!publishableApiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Orion Storefront", type: "publishable", created_by: "" },
        ],
      },
    });
    publishableApiKey = result[0] as any;
  }
  // keep the key linked ONLY to the Orion channel — a key with multiple
  // channels forces carts to pass sales_channel_id explicitly
  const { data: linkedChannels } = await query.graph({
    entity: "api_key",
    fields: ["sales_channels.id"],
    filters: { id: publishableApiKey.id },
  });
  const toRemove = (linkedChannels?.[0]?.sales_channels ?? [])
    .map((sc: { id: string }) => sc.id)
    .filter((id: string) => id !== defaultSalesChannel.id);
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
      remove: toRemove,
    },
  });
  logger.info(`Publishable API key: ${publishableApiKey.token}`);

  // ---------------------------------------------------------------- categories
  const CATEGORY_NAMES = ["Used Engines", "Used Transmissions", "Used Auto Parts"];
  const categoryIdByName = new Map<string, string>();
  const existingCategories = await productModuleService.listProductCategories(
    { name: CATEGORY_NAMES },
    { select: ["id", "name"] }
  );
  for (const c of existingCategories) categoryIdByName.set(c.name, c.id);
  const missingCategories = CATEGORY_NAMES.filter((n) => !categoryIdByName.has(n));
  if (missingCategories.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((name) => ({
          name,
          is_active: true,
        })),
      },
    });
    for (const c of result) categoryIdByName.set(c.name, c.id);
  }

  // ---------------------------------------------------------------- read records
  logger.info(`Reading products from ${SEED_FILE} (limit: ${RAW_LIMIT})...`);
  const records: OrionRecord[] = [];
  const seenHandles = new Set<string>();
  const seenSkus = new Set<string>();
  let skippedNoPrice = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(SEED_FILE),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (records.length >= LIMIT) break;
    if (!line.trim()) continue;
    const r: OrionRecord = JSON.parse(line);
    const price = parseFloat(r.price);
    if (!price || price <= 0) {
      skippedNoPrice++;
      continue;
    }
    if (seenHandles.has(r.slug) || seenSkus.has(r.sku)) continue;
    seenHandles.add(r.slug);
    seenSkus.add(r.sku);
    records.push(r);
  }
  rl.close();
  logger.info(
    `Selected ${records.length} products (skipped ${skippedNoPrice} without a price).`
  );

  // ---------------------------------------------------------------- collections (one per make)
  const makes = [...new Set(records.map((r) => r.brand).filter(Boolean))];
  const collectionIdByMake = new Map<string, string>();
  const existingCollections = await productModuleService.listProductCollections(
    {},
    { select: ["id", "title"], take: 1000 }
  );
  for (const c of existingCollections) collectionIdByMake.set(c.title, c.id);
  const missingMakes = makes.filter((m) => !collectionIdByMake.has(m));
  if (missingMakes.length) {
    const { result } = await createCollectionsWorkflow(container).run({
      input: {
        collections: missingMakes.map((make) => ({
          title: make,
          handle: slugify(make),
        })),
      },
    });
    for (const c of result) collectionIdByMake.set(c.title, c.id);
    logger.info(`Created ${missingMakes.length} make collections.`);
  }

  // ---------------------------------------------------------------- products
  let created = 0;
  let alreadyExisted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    // resumability: skip products whose handle already exists
    const existing = await productModuleService.listProducts(
      { handle: batch.map((r) => r.slug) },
      { select: ["handle"], take: BATCH_SIZE }
    );
    const existingHandles = new Set(existing.map((p) => p.handle));
    const toCreate = batch.filter((r) => !existingHandles.has(r.slug));
    alreadyExisted += batch.length - toCreate.length;

    if (toCreate.length) {
      await createProductsWorkflow(container).run({
        input: {
          products: toCreate.map((r) => {
            const categoryName = (r.category_names || "").split("|")[0].trim();
            const categoryId = categoryIdByName.get(categoryName);
            const collectionId = collectionIdByMake.get(r.brand);
            // only SKU-tagged part photos (ENG-*/TRN-*) — everything else in the
            // dataset is a donor-vehicle photo, which we don't want on the store
            const images = (r.image_urls || "")
              .split("|")
              .map((u) => u.trim())
              .filter((u) => /\/(ENG|TRN)-[^/]+$/i.test(u))
              .map((url) => ({ url }));
            const price = parseFloat(r.price);

            return {
              title: cleanTitle(r.name),
              subtitle: "Used OEM Replacement",
              handle: r.slug,
              description: r.description_text,
              status: ProductStatus.PUBLISHED,
              category_ids: categoryId ? [categoryId] : [],
              collection_id: collectionId,
              shipping_profile_id: shippingProfile.id,
              images: images.length ? images : undefined,
              weight: r.part === "Engine" ? 180000 : 90000,
              metadata: {
                source_id: r.id,
                make: r.make,
                model: r.model,
                year: r.year,
                part: r.part,
                trim_spec: r.trim_spec,
                engine_size: r.engine_size,
                vin_code: r.vin_code,
                condition: r.condition || "Used",
                transmission_type: r.transmission_type,
                transmission_code: r.transmission_code,
                drive_type: r.drive_type,
                mileage: r.mileage,
                warranty: r.warranty,
                short_description: r.short_description_text,
                description_html: r.description_html,
              },
              options: [{ title: "Condition", values: ["Used"] }],
              variants: [
                {
                  title: cleanTitle(r.name),
                  sku: r.sku,
                  options: { Condition: "Used" },
                  manage_inventory: false,
                  prices: [{ currency_code: "usd", amount: price }],
                },
              ],
              sales_channels: [{ id: defaultSalesChannel.id }],
            };
          }),
        },
      });
      created += toCreate.length;
    }

    if ((i / BATCH_SIZE) % 4 === 0 || i + BATCH_SIZE >= records.length) {
      logger.info(
        `Products: ${Math.min(i + BATCH_SIZE, records.length)}/${records.length} processed (${created} created, ${alreadyExisted} already existed)`
      );
    }
  }

  logger.info(
    `Done. ${created} products created, ${alreadyExisted} already existed.`
  );
  logger.info(`Storefront env -> NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${publishableApiKey.token}`);
}
