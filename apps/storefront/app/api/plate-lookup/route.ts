import { NextResponse } from "next/server";

// Proxies PlateToVIN so the API key never reaches the browser.
// Docs: https://plate2vin.readme.io/reference/convert-us-license-plate-to-vin
// Pricing note: successful lookups cost $0.05; 404s and 7-day cached repeats are free.

export async function POST(req: Request) {
  let body: { plate?: string; state?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const plate = String(body.plate ?? "").trim().toUpperCase();
  const state = String(body.state ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9 -]{2,9}$/.test(plate) || !/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ error: "invalid_plate_or_state" }, { status: 400 });
  }

  const key = process.env.PLATETOVIN_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const res = await fetch("https://platetovin.com/api/convert", {
      method: "POST",
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ plate, state }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
    } | null;

    if (res.ok && data?.success && data.message) {
      return NextResponse.json({ vin: data.message });
    }
    if (res.status === 404) {
      // no VIN found for this plate — free, expected for bad/old plates
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    // 402 = out of credit; anything else = provider trouble. Don't leak details.
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
