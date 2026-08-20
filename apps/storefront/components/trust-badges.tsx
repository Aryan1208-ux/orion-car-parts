/* Inline SVG trust marks — payment methods and industry accreditations.
   Drawn in-house (no hotlinked brand assets) so they render offline. */

export function VisaMark() {
  return (
    <span className="pay-chip" aria-label="Visa">
      <svg width="34" height="12" viewBox="0 0 34 12">
        <text x="0" y="10.5" fontFamily="Helvetica, Arial, sans-serif" fontSize="12" fontWeight="800" fontStyle="italic" fill="#1A1F71" letterSpacing="0.5">VISA</text>
      </svg>
    </span>
  );
}

export function MastercardMark() {
  return (
    <span className="pay-chip" aria-label="Mastercard">
      <svg width="30" height="18" viewBox="0 0 30 18">
        <circle cx="11" cy="9" r="8" fill="#EB001B" />
        <circle cx="19" cy="9" r="8" fill="#F79E1B" fillOpacity="0.9" />
        <path d="M15 2.7a8 8 0 0 1 0 12.6 8 8 0 0 1 0-12.6z" fill="#FF5F00" />
      </svg>
    </span>
  );
}

export function AmexMark() {
  return (
    <span className="pay-chip" aria-label="American Express">
      <svg width="38" height="16" viewBox="0 0 38 16">
        <rect width="38" height="16" rx="2.5" fill="#2E77BC" />
        <text x="19" y="11.5" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="8.5" fontWeight="800" fill="#ffffff" letterSpacing="0.4">AMEX</text>
      </svg>
    </span>
  );
}

export function AffirmMark() {
  return (
    <span className="pay-chip" aria-label="Affirm">
      <svg width="42" height="16" viewBox="0 0 42 16">
        <path d="M6.5 2.2 A 6.4 6.4 0 0 1 12.4 6" fill="none" stroke="#4A4AF4" strokeWidth="1.9" strokeLinecap="round" />
        <text x="1" y="13" fontFamily="Helvetica, Arial, sans-serif" fontSize="11" fontWeight="700" fill="#101820">affirm</text>
      </svg>
    </span>
  );
}

export function AfterpayMark() {
  return (
    <span className="pay-chip pay-chip-mint" aria-label="Afterpay">
      <svg width="52" height="12" viewBox="0 0 52 12">
        <text x="1" y="10" fontFamily="Helvetica, Arial, sans-serif" fontSize="10.5" fontWeight="700" fill="#101820">afterpay</text>
      </svg>
    </span>
  );
}

export function PaymentMarks() {
  return (
    <span className="pay-row" aria-label="Accepted payment methods">
      <VisaMark />
      <MastercardMark />
      <AmexMark />
      <AffirmMark />
      <AfterpayMark />
    </span>
  );
}

/* ---------------- accreditations ---------------- */

export function BBBBadge() {
  return (
    <div className="accred" aria-label="BBB A+ accredited business">
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect width="30" height="30" rx="5" fill="#005A78" />
        {/* torch flame */}
        <path d="M15 3.5c1.5 1.8 2.3 3 .9 4.6-1 1.1-3 .9-3.4-.7-.3-1.5.9-2.4 2.5-3.9z" fill="#F4B223" />
        <text x="15" y="19.5" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9.5" fontWeight="800" fill="#ffffff">BBB</text>
        <text x="15" y="27" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="6.5" fontWeight="700" fill="#F4B223">A+</text>
      </svg>
      <div>
        <div className="accred-title">BBB Accredited</div>
        <div className="accred-sub">A+ rating</div>
      </div>
    </div>
  );
}

export function ARABadge() {
  return (
    <div className="accred" aria-label="Automotive Recyclers Association member">
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect width="30" height="30" rx="5" fill="#1C7C3A" />
        {/* recycling arrows */}
        <g stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M15 6.5 l-4.4 7.4" />
          <path d="M10.6 13.9 h4" />
          <path d="M19.4 13.9 L15 6.5" />
          <path d="M19.4 13.9 l-2 3.4" />
          <path d="M8.5 20.5 h8.8" />
          <path d="M8.5 20.5 l2-3.4" />
        </g>
        <text x="15" y="28" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="6.5" fontWeight="800" fill="#ffffff">ARA</text>
      </svg>
      <div>
        <div className="accred-title">ARA Member</div>
        <div className="accred-sub">Automotive Recyclers Assoc.</div>
      </div>
    </div>
  );
}

export function ASEBadge() {
  return (
    <div className="accred" aria-label="ASE certified technicians">
      <svg width="30" height="30" viewBox="0 0 30 30">
        {/* gear */}
        <g fill="#2456A6">
          <circle cx="15" cy="15" r="10.5" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            const x = 15 + Math.cos(a) * 12;
            const y = 15 + Math.sin(a) * 12;
            return <circle key={i} cx={x} cy={y} r="2.3" />;
          })}
        </g>
        <circle cx="15" cy="15" r="8.6" fill="#ffffff" />
        <text x="15" y="18.6" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontSize="8" fontWeight="800" fill="#2456A6">ASE</text>
      </svg>
      <div>
        <div className="accred-title">ASE Certified</div>
        <div className="accred-sub">Technician tested &amp; signed</div>
      </div>
    </div>
  );
}

export function AccreditationRow() {
  return (
    <div className="accred-row">
      <BBBBadge />
      <ARABadge />
      <ASEBadge />
    </div>
  );
}
