"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import Header from "@/components/Header";
import "./globals.css";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="eu">
      <body style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        margin: 0,
      }}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <Header />
            <main style={{
              maxWidth: "1440px",
              margin: "0 auto",
              padding: "40px 32px",
            }}>
              {children}
            </main>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}