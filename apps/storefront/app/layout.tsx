import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Topbar } from "@/components/topbar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { QuoteProvider } from "@/components/quote";
import { CartProvider } from "@/components/cart-context";
import { retrieveCart } from "@/lib/cart";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-outfit",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Orion Car Parts — Quality Used Engines & Transmissions",
  description:
    "Low-mileage OEM used engines and transmissions, tested by ASE-certified technicians, VIN-matched and shipped nationwide with a written warranty.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cart = await retrieveCart();
  const cartCount =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <body>
        <CartProvider initialCart={cart}>
          <QuoteProvider>
            <Header cartCount={cartCount} />
            {children}
            <Footer />
          </QuoteProvider>
        </CartProvider>
      </body>
    </html>
  );
}

