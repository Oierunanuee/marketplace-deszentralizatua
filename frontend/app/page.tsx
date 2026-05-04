"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts";
import Link from "next/link";
import { formatEther } from "viem";
import { useNFTMetadata } from "@/lib/useNFTMetadata";

export default function Home() {
  const { data: listingIds } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getActiveListings",
  });

  const listings = (listingIds as bigint[]) || [];
  const latestListings = listings.slice(0, 4); // Azken 4 produktu

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

      {latestListings.length === 0 ? (
        <div style={{
          background: "white",
          borderRadius: "24px",
          padding: "60px",
          textAlign: "center",
          color: "#9ca3af",
        }}>
          Oraindik ez dago produkturik. <Link href="/create" style={{ color: "#8b5cf6" }}>Izan zaitez lehena!</Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
        }}>
          {latestListings.map((id) => (
            <HomeListingCard key={id.toString()} listingId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function HomeListingCard({ listingId }: { listingId: bigint }) {
  const { data: listing } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getListing",
    args: [listingId],
  });

  const l = listing as {
    id: bigint;
    seller: string;
    tokenId: bigint;
    price: bigint;
    isActive: boolean;
    createdAt: bigint;
  } | undefined;

  const { metadata } = useNFTMetadata(l?.tokenId);

  if (!l || !l.isActive) return null;

  return (
    <Link href={`/listing/${l.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "white",
        borderRadius: "24px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-8px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
        <div style={{
          width: "100%", aspectRatio: "1/1",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {metadata?.image ? (
            <img src={metadata.image} alt={metadata.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "48px" }}>🖼️</span>
          )}
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
            TOKEN #{l.tokenId.toString()}
          </div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
            {metadata?.name || `Produktua #${l.id.toString()}`}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            borderTop: "1px solid #e5e7eb", paddingTop: "16px",
          }}>
            <span style={{ color: "#6b7280" }}>Prezioa</span>
            <span style={{ fontWeight: 700, color: "#111827" }}>{formatEther(l.price)} ETH</span>
          </div>
        </div>
      </div>
    </Link>
  );
}