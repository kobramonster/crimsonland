import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";
import "../style.css";

export async function generateMetadata(): Promise<Metadata> {
  const { miniapp } = minikitConfig;
  const appUrl = miniapp.homeUrl || "http://localhost:3000";
  const ogImage = miniapp.ogImageUrl || `${appUrl}/screenshot.png`;
  return {
    metadataBase: new URL(appUrl),
    title: miniapp.name,
    description: miniapp.description,
    themeColor: miniapp.splashBackgroundColor || "#05070a",
    icons: {
      icon: "/icon.png",
      apple: "/icon.png",
    },
    openGraph: {
      title: miniapp.ogTitle || miniapp.name,
      description: miniapp.ogDescription || miniapp.description,
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: miniapp.ogTitle || miniapp.name,
      description: miniapp.ogDescription || miniapp.description,
      images: [ogImage],
    },
    other: {
      "base:app_id": "69771d0a3a92926b661fd627",
      "fc:frame": JSON.stringify({
        version: miniapp.version,
        imageUrl: miniapp.heroImageUrl,
        button: {
          title: `Join the ${miniapp.name} Waitlist`,
          action: {
            name: `Launch ${miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
