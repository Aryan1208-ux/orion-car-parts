"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const QuoteContext = createContext<{ open: () => void }>({ open: () => {} });

export function useQuote() {
  return useContext(QuoteContext);
}

export function QuoteButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useQuote();
  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    setSent(false);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <QuoteContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="modal-success">
                <div className="modal-success-icon">✓</div>
                <h3>Quote request received</h3>
                <p>
                  A parts expert will call or email you within one business
                  hour with a matched quote.
                </p>
                <button type="button" className="btn-navy" onClick={close}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="modal-head">
                  <h3>Request a free quote</h3>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={close}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <p className="modal-sub">
                  No obligation. We reply within one business hour.
                </p>
                <form
                  className="modal-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                >
                  <input placeholder="Full name" required />
                  <div className="modal-2col">
                    <input placeholder="Phone" />
                    <input placeholder="Email" type="email" required />
                  </div>
                  <input placeholder="Vehicle (year, make, model) or VIN" />
                  <textarea placeholder="What part do you need?" rows={3} />
                  <button type="submit" className="btn-primary lg">
                    Send Quote Request
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </QuoteContext.Provider>
  );
}
