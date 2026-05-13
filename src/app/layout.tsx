import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeRegistry } from "@/theme/ThemeRegistry";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Vanworks Admin",
  description: "Vanworks admin panel — manage van models, orders, and users.",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <ThemeRegistry>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ className: "font-sans" }}
          />
        </ThemeRegistry>
      </body>
    </html>
  );
}
