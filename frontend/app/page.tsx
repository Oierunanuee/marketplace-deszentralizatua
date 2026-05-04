"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
        borderRadius: "32px",
        padding: "60px 40px",
        color: "white",
        marginBottom: "48px",
      }}>
        <h1 style={{ fontSize: "56px", marginBottom: "24px" }}>
          Deskubritu, erosi eta saldu produktu bakarrak
        </h1>
        <p style={{ fontSize: "20px", marginBottom: "32px", opacity: 0.9 }}>
          Web3 merkatua deszentralizatuena. Konektatu zure wallet-a eta hasi saltzen.
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link href="/marketplace" style={{
            padding: "16px 32px",
            borderRadius: "40px",
            fontWeight: 600,
            background: "white",
            color: "#8b5cf6",
            textDecoration: "none",
          }}>Arakatu</Link>
          <Link href="/create" style={{
            padding: "16px 32px",
            borderRadius: "40px",
            fontWeight: 600,
            background: "rgba(255,255,255,0.2)",
            color: "white",
            textDecoration: "none",
          }}>Sortu NFT</Link>
        </div>
      </div>

      {/* AZKEN PRODUKTUAK */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
      }}>
        <h2 style={{ fontSize: "32px", fontWeight: 700, color: "white" }}>
           Azken produktuak
        </h2>
        <Link href="/marketplace" style={{
          padding: "12px 24px",
          borderRadius: "40px",
          background: "rgba(255,255,255,0.2)",
          color: "white",
          textDecoration: "none",
          fontWeight: 600,
        }}>Ikusi guztiak →</Link>
      </div>

      {/* NFT GRID - oraingoz hutsa */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "24px",
        marginBottom: "48px",
      }}>
        <div style={{
          background: "white",
          borderRadius: "24px",
          padding: "40px",
          textAlign: "center",
          color: "#9ca3af",
          gridColumn: "1 / -1",
        }}>
          Oraindik ez dago produkturik. Izan zaitez lehena! 
        </div>
      </div>
    </div>
  );
}