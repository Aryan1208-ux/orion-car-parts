/* Authentic manufacturer brand logo component loading verified vector SVG assets. */

import Image from "next/image";

const MAKE_FILE_MAP: Record<string, string> = {
  ford: "ford.svg",
  chevy: "chevy.svg",
  bmw: "bmw.svg",
  toyota: "toyota.svg",
  honda: "honda.svg",
  mercedes: "mercedes.svg",
  audi: "audi.svg",
  dodge: "dodge.svg",
  porsche: "porsche.svg",
  jeep: "jeep.svg",
  nissan: "nissan.svg",
  lexus: "lexus.svg",
  cadillac: "cadillac.svg",
  volkswagen: "volkswagen.svg",
  subaru: "subaru.svg",
  hyundai: "hyundai.svg",
  kia: "kia.svg",
  gmc: "gmc.svg",
  volvo: "volvo.svg",
  mazda: "mazda.svg",
  jaguar: "jaguar.svg",
  acura: "acura.svg",
  infiniti: "infiniti.svg",
  chrysler: "chrysler.svg",
  buick: "buick.svg",
  hummer: "hummer.svg",
  isuzu: "isuzu.svg",
  landrover: "landrover.svg",
  lincoln: "lincoln.svg",
  mercury: "mercury.svg",
  mini: "mini.svg",
  mitsubishi: "mitsubishi.svg",
  oldsmobile: "oldsmobile.svg",
  pontiac: "pontiac.svg",
  saab: "saab.svg",
  saturn: "saturn.svg",
  scion: "scion.svg",
};

export function BrandLogo({ make, size = 110 }: { make: string; size?: number }) {
  const normalizedKey = make.toLowerCase().replace(/[^a-z]/g, "");
  const filename = MAKE_FILE_MAP[normalizedKey] || `${normalizedKey}.svg`;
  const logoUrl = `/images/logos/${filename}`;

  return (
    <div className="brand-logo-official-wrap" style={{ width: size, height: size * 0.55 }}>
      <Image
        src={logoUrl}
        alt={`${make} official logo`}
        width={size}
        height={Math.round(size * 0.55)}
        style={{ objectFit: "contain", width: "100%", height: "100%" }}
        priority={["bmw", "mercedes", "audi", "ford", "toyota", "chevy"].includes(normalizedKey)}
      />
    </div>
  );
}
