"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@/lib/sdk";
import { useQuote } from "./quote";

/*
 * Smart fitment lookup — "type it how you'd say it out loud".
 * Three ways in: free text (with voice input), VIN (typed, camera-scanned,
 * decoded free via the NHTSA vPIC API), or license plate (handed to a parts
 * expert — there is no free plate-decode API).
 * Results appear in a dismissible popover: what we understood, every row
 * tap-to-edit, live inventory count, one CTA into the catalog.
 */

type MakeOpt = { id: string; handle: string; title: string };
type CatOpt = { id: string; handle: string; name: string };

export type MatchedPart = {
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number | null;
  part: string | null;
  variantId: string | null;
};

type Fitment = {
  part: string | null; // "Engine" | "Transmission"
  year: string | null;
  make: string | null; // exact collection title
  model: string | null;
};

const PART_ALIASES: Record<string, string[]> = {
  Engine: ["engine", "motor", "engine assembly", "long block", "powerplant"],
  Transmission: ["transmission", "trans", "gearbox", "tranny", "transmision"],
};

const EXTRA_MAKE_ALIASES: Record<string, string> = {
  chevrolet: "Chevy",
  chev: "Chevy",
  beemer: "BMW",
  bimmer: "BMW",
  vw: "Volkswagen",
  volkswagon: "Volkswagen",
  benz: "Mercedes",
  "mercedes-benz": "Mercedes",
  mercedesbenz: "Mercedes",
  "land rover": "LandRover",
  landrover: "LandRover",
  rangerover: "LandRover",
  ram: "Dodge",
  vette: "Chevy",
  caddy: "Cadillac",
};

// common models → make, so "08 accord" infers Honda like a counter guy would
const MODEL_MAKES: Record<string, string> = {
  accord: "Honda", civic: "Honda", "cr-v": "Honda", crv: "Honda", pilot: "Honda", odyssey: "Honda",
  camry: "Toyota", corolla: "Toyota", tacoma: "Toyota", tundra: "Toyota", rav4: "Toyota", highlander: "Toyota", sienna: "Toyota",
  "f-150": "Ford", f150: "Ford", f250: "Ford", mustang: "Ford", explorer: "Ford", escape: "Ford", taurus: "Ford", ranger: "Ford", fusion: "Ford", focus: "Ford",
  silverado: "Chevy", tahoe: "Chevy", impala: "Chevy", malibu: "Chevy", equinox: "Chevy", suburban: "Chevy", camaro: "Chevy", cruze: "Chevy",
  durango: "Dodge", charger: "Dodge", challenger: "Dodge", caravan: "Dodge", dakota: "Dodge", promaster: "Dodge",
  altima: "Nissan", sentra: "Nissan", rogue: "Nissan", maxima: "Nissan", frontier: "Nissan", pathfinder: "Nissan",
  wrangler: "Jeep", cherokee: "Jeep", liberty: "Jeep",
  sierra: "GMC", yukon: "GMC", acadia: "GMC",
  jetta: "Volkswagen", passat: "Volkswagen", golf: "Volkswagen", beetle: "Volkswagen", tiguan: "Volkswagen",
  outback: "Subaru", forester: "Subaru", impreza: "Subaru", legacy: "Subaru",
  sonata: "Hyundai", elantra: "Hyundai", "santa fe": "Hyundai", tucson: "Hyundai",
  optima: "Kia", sorento: "Kia", sportage: "Kia", soul: "Kia",
};

const STOPWORDS = new Set([
  "for", "my", "a", "an", "the", "used", "oem", "assembly", "replacement",
  "need", "i", "want", "looking", "part", "parts", "unit", "complete", "of",
]);

const YEARS = Array.from({ length: 2023 - 1990 + 1 }, (_, i) =>
  String(2023 - i)
);

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function lev(a: string, b: string): number {
  const m: number[][] = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] =
        b[i - 1] === a[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
  return m[b.length][a.length];
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* minimal typings for browser APIs TS doesn't ship */
type SpeechResult = { 0: { transcript: string }; isFinal: boolean };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult:
    | ((e: { results: { length: number; [i: number]: SpeechResult } }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

export function SmartFinder({
  makes,
  categories,
  regionId,
  onMatch,
  onChecking,
}: {
  makes: MakeOpt[];
  categories: CatOpt[];
  regionId?: string;
  onMatch?: (match: MatchedPart | null) => void;
  onChecking?: (checking: boolean) => void;
}) {
  const router = useRouter();
  const { open: openQuote } = useQuote();
  const [tab, setTab] = useState<"say" | "vin" | "plate">("say");
  const [query, setQuery] = useState("");
  const [vin, setVin] = useState("");
  const [plate, setPlate] = useState("");
  const [plateState, setPlateState] = useState("TX");
  const [plateBusy, setPlateBusy] = useState(false);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateFallback, setPlateFallback] = useState(false);
  const [vinPart, setVinPart] = useState("Engine");
  const [vinBusy, setVinBusy] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [fit, setFit] = useState<Fitment | null>(null);
  const [source, setSource] = useState("From what you typed");
  const [editing, setEditing] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [garage, setGarage] = useState<Fitment[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // the model spelling that actually returned inventory (hyphen normalization)
  const effectiveModelRef = useRef<string | null>(null);
  // monotonically increasing request id — discard stale fetch results
  const requestSeqRef = useRef(0);

  const makeAliases = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of makes) map[m.title.toLowerCase()] = m.title;
    for (const [alias, title] of Object.entries(EXTRA_MAKE_ALIASES)) {
      if (makes.some((m) => m.title === title)) map[alias] = title;
    }
    return map;
  }, [makes]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("orion_garage") || "[]");
      if (Array.isArray(stored)) setGarage(stored.slice(0, 3));
    } catch {
      // ignore bad localStorage payloads
    }
  }, []);

  /* ---------------- parsing ---------------- */

  const parse = useCallback(
    (text: string): Fitment => {
      const raw = text
        .toLowerCase()
        .replace(/[^\w\s'’.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const out: Fitment = { part: null, year: null, make: null, model: null };
      const consumed = new Set<string>();

      const ym = raw.match(/\b(19[9]\d|20[0-2]\d)\b/);
      if (ym) {
        out.year = ym[1];
        consumed.add(ym[1]);
      } else {
        const t = raw.match(/['’](\d{2})\b/) || raw.match(/\b(\d{2})\b/);
        if (t) {
          const n = +t[1];
          if (n <= 23) out.year = String(2000 + n);
          else if (n >= 90) out.year = String(1900 + n);
          if (out.year) consumed.add(t[1]);
        }
      }

      const toks = raw.split(" ");

      for (const t of toks) {
        if (makeAliases[t]) {
          out.make = makeAliases[t];
          consumed.add(t);
          break;
        }
      }
      if (!out.make) {
        outer: for (const t of toks) {
          if (t.length <= 3) continue;
          for (const k of Object.keys(makeAliases)) {
            if (lev(t, k) <= 1) {
              out.make = makeAliases[k];
              consumed.add(t);
              break outer;
            }
          }
        }
      }

      let best = 0;
      for (const p of Object.keys(PART_ALIASES)) {
        for (const a of PART_ALIASES[p]) {
          if (raw.includes(a) && a.length > best) {
            out.part = p;
            best = a.length;
          }
        }
      }
      if (out.part) {
        for (const a of PART_ALIASES[out.part]) {
          for (const w of a.split(" ")) consumed.add(w);
        }
      } else {
        outer: for (const t of toks) {
          if (t.length < 4) continue;
          for (const p of Object.keys(PART_ALIASES)) {
            for (const a of PART_ALIASES[p]) {
              if (lev(t, a) <= 1) {
                out.part = p;
                consumed.add(t);
                break outer;
              }
            }
          }
        }
      }

      const rest = toks.filter(
        (t) => t && !consumed.has(t) && !STOPWORDS.has(t) && !/^\d+$/.test(t)
      );
      if (rest.length) out.model = titleCase(rest.join(" "));

      if (!out.make && out.model) {
        const modelKey = out.model.toLowerCase();
        for (const [model, make] of Object.entries(MODEL_MAKES)) {
          if (
            (modelKey.includes(model) || lev(modelKey, model) <= 1) &&
            makes.some((m) => m.title === make)
          ) {
            out.make = make;
            break;
          }
        }
      }
      return out;
    },
    [makeAliases, makes]
  );

  /* ---------------- live inventory count + top match ---------------- */

  useEffect(() => {
    if (!fit) {
      // keep the last matched part on the spotlight — closing the popover or
      // clearing the box should not reset it; only a new search replaces it
      onChecking?.(false);
      return;
    }
    clearTimeout(debounceRef.current);
    setCount(null);
    onChecking?.(true);
    const seq = ++requestSeqRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const catHandle =
          fit.part === "Transmission" ? "used-transmissions" : "used-engines";
        const category = fit.part
          ? categories.find((c) => c.handle === catHandle)
          : undefined;
        const make = makes.find((m) => m.title === fit.make);
        // catalog titles are inconsistent about hyphens ("F-150" vs "F150"),
        // so retry with a de-hyphenated model when the literal query is empty
        const modelVariants = [
          fit.model,
          fit.model?.includes("-") ? fit.model.replace(/-/g, "") : null,
        ].filter((m, i, a) => m !== undefined && a.indexOf(m) === i) as
          (string | null)[];

        let products: Awaited<
          ReturnType<typeof sdk.store.product.list>
        >["products"] = [];
        let count = 0;
        effectiveModelRef.current = null;
        for (const model of modelVariants) {
          const q = [fit.year, model].filter(Boolean).join(" ");
          const res = await sdk.store.product.list({
            limit: 8,
            fields:
              "id,title,handle,thumbnail,metadata,*variants.calculated_price",
            ...(regionId ? { region_id: regionId } : {}),
            ...(q ? { q } : {}),
            ...(category ? { category_id: [category.id] } : {}),
            ...(make ? { collection_id: [make.id] } : {}),
          });
          products = res.products;
          count = res.count;
          if (count > 0) {
            effectiveModelRef.current = model;
            break;
          }
        }
        if (seq !== requestSeqRef.current) return; // a newer search superseded us
        setCount(count);
        // surface the best match (prefer one with a real part photo)
        const best = products.find((p) => p.thumbnail) || products[0];
        if (best) {
          const variant = best.variants?.[0] as
            | {
                id?: string;
                calculated_price?: { calculated_amount?: number | null } | null;
              }
            | undefined;
          const amount = variant?.calculated_price?.calculated_amount;
          onMatch?.({
            handle: best.handle,
            title: best.title,
            thumbnail: best.thumbnail ?? null,
            price: typeof amount === "number" ? amount : null,
            part:
              (best.metadata as Record<string, string>)?.part ??
              fit.part,
            variantId: variant?.id ?? null,
          });
        } else {
          onMatch?.(null);
        }
      } catch {
        setCount(null);
      } finally {
        onChecking?.(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [fit, categories, makes, regionId, onMatch, onChecking]);

  /* ---------------- popover dismissal ---------------- */

  const dismiss = useCallback(() => {
    setFit(null);
    setEditing(null);
  }, []);

  // auto-clear when the search box is emptied
  useEffect(() => {
    if (tab === "say" && query.trim() === "") dismiss();
  }, [query, tab, dismiss]);

  // Esc + outside click
  useEffect(() => {
    if (!fit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        dismiss();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [fit, dismiss]);

  /* ---------------- voice input ---------------- */

  const toggleMic = () => {
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setQuery("");
      setScanError(null);
      alert("Voice input needs Chrome, Edge or Safari.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true; // stream words into the box as they're spoken
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let transcript = "";
      let isFinal = false;
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      setQuery(transcript);
      if (isFinal && transcript.trim()) {
        setFit(parse(transcript));
        setSource("From what you said");
        setEditing(null);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recogRef.current = rec;
    setListening(true);
    rec.start();
  };

  /* ---------------- VIN: decode + camera scan ---------------- */

  const decodeVin = async (value?: string, sourceLabel?: string) => {
    const v = (value ?? vin).trim().toUpperCase();
    setVinError(null);
    if (v.length < 11) {
      setVinError("A VIN is 17 characters — check the door jamb sticker.");
      return false;
    }
    setVinBusy(true);
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(v)}?format=json`
      );
      const data = await res.json();
      const r = data?.Results?.[0] ?? {};
      const rawMake = String(r.Make || "").toLowerCase();
      const make =
        makeAliases[rawMake] ||
        makeAliases[rawMake.replace(/\s+/g, "")] ||
        (rawMake ? titleCase(rawMake) : null);
      const year = r.ModelYear ? String(r.ModelYear) : null;
      const model = r.Model ? titleCase(String(r.Model)) : null;
      if (!make && !year && !model) {
        setVinError("Couldn't decode that VIN — double-check it, or request a manual match.");
        return false;
      }
      setFit({ part: vinPart, year, make, model });
      setSource(sourceLabel ?? "Decoded from VIN");
      setEditing(null);
      return true;
    } catch {
      setVinError("VIN decoder unreachable — try again, or request a manual match.");
      return false;
    } finally {
      setVinBusy(false);
    }
  };

  /* ---------------- license plate lookup (PlateToVIN via our proxy) ---------------- */

  const lookupPlate = async () => {
    const p = plate.trim().toUpperCase();
    if (!p) return;
    setPlateError(null);
    setPlateFallback(false);
    setPlateBusy(true);
    try {
      const res = await fetch("/api/plate-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: p, state: plateState }),
      });
      const data = (await res.json().catch(() => null)) as {
        vin?: string;
        error?: string;
      } | null;
      if (res.ok && data?.vin) {
        setVin(data.vin);
        const ok = await decodeVin(data.vin, `From plate ${plateState} · ${p}`);
        if (!ok) setPlateFallback(true);
      } else if (res.status === 404) {
        setPlateError(
          `No vehicle record found for ${plateState} · ${p} — check the plate and state.`
        );
        setPlateFallback(true);
      } else {
        setPlateError(
          "Plate lookup is unavailable right now — a parts expert can run it manually."
        );
        setPlateFallback(true);
      }
    } catch {
      setPlateError(
        "Plate lookup is unavailable right now — a parts expert can run it manually."
      );
      setPlateFallback(true);
    } finally {
      setPlateBusy(false);
    }
  };

  const stopScan = useCallback(() => {
    clearInterval(scanTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startScan = async () => {
    setScanError(null);
    const w = window as unknown as {
      BarcodeDetector?: new (opts?: { formats: string[] }) => BarcodeDetectorLike;
    };
    if (!w.BarcodeDetector) {
      setScanError("Barcode scanning needs Chrome or Edge — type the VIN instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      // wait a tick for the <video> to mount
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
      const detector = new w.BarcodeDetector({
        formats: ["code_39", "code_128", "data_matrix", "qr_code"],
      });
      scanTimerRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;
        try {
          const codes = await detector.detect(video);
          const hit = codes.find((c) =>
            /^[A-HJ-NPR-Z0-9]{11,17}$/i.test(c.rawValue.trim())
          );
          if (hit) {
            const v = hit.rawValue.trim().toUpperCase();
            setVin(v);
            stopScan();
            decodeVin(v);
          }
        } catch {
          // detector hiccup — keep polling
        }
      }, 350);
    } catch {
      setScanError("Camera unavailable — allow camera access, or type the VIN.");
    }
  };

  useEffect(() => stopScan, [stopScan]);

  /* ---------------- actions ---------------- */

  const applyText = () => {
    if (!query.trim()) return;
    setFit(parse(query));
    setSource("From what you typed");
    setEditing(null);
  };

  const applyGarage = (g: Fitment) => {
    setFit({ ...g });
    setSource("From your garage");
    setEditing(null);
  };

  const update = (field: keyof Fitment, value: string | null) => {
    setFit((f) => ({
      ...(f ?? { part: null, year: null, make: null, model: null }),
      [field]: value,
    }));
    setEditing(null);
  };

  const goToResults = () => {
    if (!fit) return;
    const params = new URLSearchParams();
    if (fit.part)
      params.set(
        "part",
        fit.part === "Transmission" ? "used-transmissions" : "used-engines"
      );
    const make = makes.find((m) => m.title === fit.make);
    if (make) params.set("make", make.handle);
    if (fit.year) params.set("year", fit.year);
    const model = effectiveModelRef.current ?? fit.model;
    if (model) params.set("q", model);

    const next = [
      fit,
      ...garage.filter(
        (g) =>
          !(g.year === fit.year && g.make === fit.make && g.model === fit.model)
      ),
    ].slice(0, 3);
    setGarage(next);
    try {
      localStorage.setItem("orion_garage", JSON.stringify(next));
    } catch {
      // storage unavailable — skip persisting the garage
    }
    router.push(`/parts?${params.toString()}`);
  };

  /* ---------------- render ---------------- */

  const rows: { k: string; f: keyof Fitment; v: string | null }[] = fit
    ? [
        { k: "Part", f: "part", v: fit.part },
        { k: "Year", f: "year", v: fit.year },
        { k: "Make", f: "make", v: fit.make },
        { k: "Model", f: "model", v: fit.model },
      ]
    : [];
  const missing = rows.filter((r) => !r.v).map((r) => r.k.toLowerCase());
  const ready = fit !== null && missing.length <= 1 && !!fit.part;
  const vehicleLabel = fit
    ? [fit.year, fit.make, fit.model].filter(Boolean).join(" ")
    : "";

  const popover = fit ? (
    <div className="sf-pop" role="dialog" aria-label="What we understood">
      <div className="sf-pop-head">
        <span className="sf-pop-ttl">What we understood</span>
        <span className="sf-pop-src">{source}</span>
        <button
          type="button"
          className="sf-pop-close"
          aria-label="Close"
          onClick={dismiss}
        >
          ×
        </button>
      </div>
      <div className="sf-rows">
        {rows.map((r) => (
          <div key={r.f}>
            <button
              type="button"
              className="sf-editrow"
              onClick={() => setEditing(editing === r.f ? null : r.f)}
            >
              <span className="sf-k">{r.k}</span>
              <span className={`sf-v ${r.v ? "" : "empty"}`}>
                {r.v || "Not sure yet — tap to pick"}
              </span>
              <span className="sf-pen">EDIT</span>
            </button>
            {editing === r.f && (
              <div className="sf-editor">
                {r.f === "model" ? (
                  <input
                    className="sf-model-input"
                    defaultValue={fit.model ?? ""}
                    placeholder="Model, e.g. F-150"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        update(
                          "model",
                          titleCase(e.currentTarget.value.trim()) || null
                        );
                    }}
                    onBlur={(e) =>
                      update("model", titleCase(e.target.value.trim()) || null)
                    }
                  />
                ) : (
                  <div className="sf-chips">
                    {(r.f === "part"
                      ? ["Engine", "Transmission"]
                      : r.f === "year"
                        ? YEARS
                        : makes.map((m) => m.title)
                    ).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="sf-chip"
                        aria-pressed={fit[r.f] === opt}
                        onClick={() => update(r.f, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="sf-confirm">
        <div className={`sf-fit ${ready ? "" : "wait"}`}>
          <span className="sf-tick">{ready ? "✓" : "?"}</span>
          {ready
            ? count === null
              ? `Checking inventory for your ${vehicleLabel}…`
              : count > 0
                ? `${count.toLocaleString()} tested unit${count === 1 ? "" : "s"} match your ${vehicleLabel}`
                : `No exact match in stock — we can source it`
            : `Still need: ${missing.join(", ")}`}
        </div>
        {ready && count === 0 ? (
          <button type="button" className="sf-cta" onClick={openQuote}>
            Get a Sourcing Quote
          </button>
        ) : (
          <button
            type="button"
            className="sf-cta"
            disabled={!ready}
            onClick={goToResults}
          >
            {fit.part ? `Show ${fit.part}s that fit` : "Show matching parts"}
            {ready && count !== null && count > 0 && (
              <span className="sf-n">{count.toLocaleString()}</span>
            )}
          </button>
        )}
      </div>
    </div>
  ) : null;

  const partChips = (
    <div className="sf-partpick" role="radiogroup" aria-label="Which part do you need?">
      <span className="sf-lbl">I need</span>
      {["Engine", "Transmission"].map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={vinPart === p}
          className="sf-chip"
          onClick={() => setVinPart(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );

  return (
    <div className="sf" ref={rootRef}>
      <div className="sf-tabs" role="tablist">
        {(
          [
            ["say", "Describe it"],
            ["vin", "VIN"],
            ["plate", "License plate"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className="sf-tab"
            onClick={() => {
              setTab(key);
              setEditing(null);
              setPlateFallback(false);
              setPlateError(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "say" && (
        <>
          <div className="sf-anchor">
          <div className="sf-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyText()}
              placeholder="e.g. engine for my 15 accord"
              autoComplete="off"
              spellCheck={false}
              aria-label="Describe the part and vehicle"
            />
            {query && (
              <button
                type="button"
                className="sf-clear"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}
            <button
              type="button"
              className={`sf-scan ${listening ? "live" : ""}`}
              title="Say it instead"
              aria-label="Voice input"
              onClick={toggleMic}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
              </svg>
            </button>
            <button type="button" className="sf-go" onClick={applyText}>
              Find
            </button>
          </div>
          {popover}
          </div>
          {listening && (
            <div className="sf-listening">● Listening — say it like “transmission for my 08 accord”</div>
          )}
          <div className="sf-hints">
            <span className="sf-lbl">Try</span>
            {[
              "2015 ford f-150 engine",
              "transmission for my 08 accord",
              "2017 dodge durango 3.6 engine",
            ].map((h) => (
              <button
                key={h}
                type="button"
                className="sf-hint"
                onClick={() => {
                  setQuery(h);
                  setFit(parse(h));
                  setSource("From what you typed");
                  setEditing(null);
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </>
      )}

      {tab === "vin" && (
        <>
          {partChips}
          <div className="sf-anchor">
          <div className="sf-field sf-mono">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5v14M7 5v14M11 5v10M15 5v14M19 5v10" />
            </svg>
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && decodeVin()}
              placeholder="17-CHARACTER VIN"
              maxLength={17}
              autoComplete="off"
              spellCheck={false}
              aria-label="Vehicle identification number"
            />
            <button
              type="button"
              className="sf-scan"
              title="Scan the door-jamb barcode with your camera"
              aria-label="Scan VIN barcode"
              onClick={startScan}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                <path d="M4 12h16" />
              </svg>
            </button>
            <button
              type="button"
              className="sf-go"
              disabled={vinBusy}
              onClick={() => decodeVin()}
            >
              {vinBusy ? "Decoding…" : "Decode"}
            </button>
          </div>
          {popover}
          </div>
          {(vinError || scanError) && (
            <div className="sf-error">{vinError || scanError}</div>
          )}
          <div className="sf-hints">
            <span style={{ fontSize: 13.5, color: "var(--faint)" }}>
              Driver&apos;s door jamb, or bottom-left of the windshield. Decoded
              free via the NHTSA database — no VIN is stored.
            </span>
          </div>
        </>
      )}

      {tab === "plate" && (
        <>
          {partChips}
          <div className="sf-anchor">
          <div className="sf-row2">
            <div className="sf-field sf-mono">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h2M11 12h2M16 12h2" />
              </svg>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && lookupPlate()}
                placeholder="PLATE NUMBER"
                maxLength={9}
                autoComplete="off"
                spellCheck={false}
                aria-label="License plate number"
              />
            </div>
            <select
              className="sf-state"
              value={plateState}
              onChange={(e) => setPlateState(e.target.value)}
              aria-label="Plate state"
            >
              {US_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              className="sf-go"
              disabled={plateBusy}
              onClick={lookupPlate}
            >
              {plateBusy ? "Looking up…" : "Look up"}
            </button>
          </div>
          {popover}
          </div>
          {plateError && <div className="sf-error">{plateError}</div>}
          {plateFallback ? (
            <div className="sf-plate-note">
              <strong>
                {plateState} · {plate}
              </strong>{" "}
              — a parts expert can run this lookup manually and call you back
              with the exact {vinPart.toLowerCase()} match, usually within the
              hour.
              <button type="button" className="sf-cta" onClick={openQuote}>
                Send to a Parts Expert
              </button>
            </div>
          ) : (
            <div className="sf-hints">
              <span style={{ fontSize: 13.5, color: "var(--faint)" }}>
                Just the plate and state — we find the VIN and match the exact
                spec. No owner information is ever shown.
              </span>
            </div>
          )}
        </>
      )}

      {/* camera scan overlay */}
      {scanning && (
        <div className="sf-scan-overlay" onClick={stopScan}>
          <div className="sf-scan-box" onClick={(e) => e.stopPropagation()}>
            <video ref={videoRef} muted playsInline />
            <div className="sf-scan-target" />
            <p>Point the camera at the VIN barcode (door jamb)</p>
            <button type="button" className="btn-navy" onClick={stopScan}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {garage.length > 0 && (
        <div className="sf-garage">
          <span className="sf-lbl">My garage</span>
          {garage.map((g, i) => (
            <button
              key={i}
              type="button"
              className="sf-car"
              onClick={() => applyGarage(g)}
            >
              {[g.year, g.make, g.model].filter(Boolean).join(" ")}
              <small>{g.part || "Any part"}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
