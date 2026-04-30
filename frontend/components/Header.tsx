"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <header style={{
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.1)",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "0 32px",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* LOGO ETA NABIGAZIOA */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: "bold",
            }}>⛓️</div>
            <span style={{
              fontSize: "20px", fontWeight: 700,
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>NFTMarket</span>
          </Link>
          <nav style={{ display: "flex", gap: "32px", marginLeft: "48px" }}>
            <Link href="/" style={{
              textDecoration: "none",
              color: pathname === "/" ? "#8b5cf6" : "#4b5563",
              fontWeight: pathname === "/" ? 600 : 500,
            }}>Hasiera</Link>
            <Link href="/marketplace" style={{
              textDecoration: "none",
              color: pathname === "/marketplace" ? "#8b5cf6" : "#4b5563",
              fontWeight: pathname === "/marketplace" ? 600 : 500,
            }}>Marketplace</Link>
            <Link href="/profile" style={{
              textDecoration: "none",
              color: pathname === "/profile" ? "#8b5cf6" : "#4b5563",
              fontWeight: pathname === "/profile" ? 600 : 500,
            }}>Profila</Link>
          </nav>
        </div>

        {/* ESKUINEKO BOTOIAK */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/create" style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            padding: "10px 24px",
            borderRadius: "30px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
          }}> Argitaratu</Link>

          {isConnected ? (
            <div
              onClick={() => disconnect()}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "6px 12px 6px 6px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                borderRadius: "40px",
                cursor: "pointer",
                color: "white",
              }}>
              <div style={{
                width: "40px", height: "40px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px",
              }}>🦊</div>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{shortAddress}</span>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "6px 20px 6px 6px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                borderRadius: "40px",
                cursor: "pointer",
                border: "none",
                fontWeight: 600,
                color: "white",
              }}>
              <div style={{
                width: "40px", height: "40px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px",
              }}>🦊</div>
              Konektatu
            </button>
          )}
        </div>
      </div>
    </header>
  );
}