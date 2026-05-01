"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const OWNER = "0x2dfebee0c186819005a284c158c5b13c0b8fc0c1";

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const isOwner = isConnected && address?.toLowerCase() === OWNER;

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
            {/* LOGO KARRATUA */}
            <div style={{
              width: "40px", height: "40px",
              background: "#6B21A5",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s ease",
            }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: "22px" }}>M</span>
            </div>
            {/* MINTEX IZENA */}
            <div style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "1px", color: "#1F1A2E" }}>
              MINT<span style={{ color: "#6B21A5" }}>EX</span>
            </div>
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
            {isOwner && (
              <Link href="/admin" style={{
                textDecoration: "none",
                color: pathname === "/admin" ? "#ef4444" : "#6b7280",
                fontWeight: pathname === "/admin" ? 600 : 500,
              }}>Admin</Link>
            )}
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
          }}>Argitaratu</Link>

          {isConnected ? (
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "6px 12px 6px 6px",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                  borderRadius: "40px",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <div style={{
                  width: "40px", height: "40px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px",
                }}>🦊</div>
                <span style={{ fontSize: "14px", fontWeight: 500 }}>{shortAddress}</span>
                <span style={{ fontSize: "12px", marginLeft: "4px" }}>{menuOpen ? "▲" : "▼"}</span>
              </div>

              {/* MENU DESPLEGABLE */}
              {menuOpen && (
                <>
                  <div
                    onClick={() => setMenuOpen(false)}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999,
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    overflow: "hidden",
                    minWidth: "180px",
                    zIndex: 1000,
                  }}>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "12px 20px",
                        textDecoration: "none",
                        color: "#111827",
                        fontSize: "14px",
                        fontWeight: 500,
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      Profila
                    </Link>
                    <button
                      onClick={() => {
                        disconnect();
                        setMenuOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 20px",
                        border: "none",
                        background: "white",
                        color: "#ef4444",
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      Deskonektatu
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={async () => {
                connect({ connector: connectors[0] });
                setTimeout(() => switchChain({ chainId: sepolia.id }), 1000);
              }}
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