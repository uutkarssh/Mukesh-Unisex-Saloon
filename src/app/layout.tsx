import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Mukesh Unisex Salon | Where Style Meets Tradition",
  description:
    "Mukesh Unisex Salon — premium haircuts, colour, bridal, and grooming services for men and women. Book your appointment online in seconds.",
  keywords: [
    "Mukesh Unisex Salon",
    "salon",
    "haircut",
    "hair colour",
    "bridal package",
    "beard trim",
    "balayage",
    "keratin",
    "book salon appointment",
  ],
  authors: [{ name: "Mukesh Unisex Salon" }],
  openGraph: {
    title: "Mukesh Unisex Salon",
    description: "Where Style Meets Tradition. Book your appointment online.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Clash Display (headings) + General Sans (body) from Fontshare (Indian Type Foundry — free) */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=general-sans@400,500,600,700&display=swap"
        />
      </head>
      <body className="font-body antialiased bg-app-bg text-app-fg">
        {children}
        <Toaster />
        {/* Sonner toaster styled to match the salon design system:
            dark (#1A1A1A) surface, cream text, lime accent for success. */}
        <SonnerToaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#F4F1EA',
              border: '1px solid #2A2A2A',
              borderRadius: '16px',
              fontFamily: 'General Sans, Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
            },
            classNames: {
              success: '!bg-[#1A1A1A] !text-[#F4F1EA] !border-[#C5F82A]/30',
              error: '!bg-[#1A1A1A] !text-[#F4F1EA] !border-red-500/40',
              warning: '!bg-[#1A1A1A] !text-[#F4F1EA] !border-amber-500/40',
              info: '!bg-[#1A1A1A] !text-[#F4F1EA] !border-[#2A2A2A]',
            },
          }}
        />
      </body>
    </html>
  );
}
