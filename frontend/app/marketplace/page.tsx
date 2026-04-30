"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts";
import Link from "next/link";
import { formatEther } from "viem";
import { useNFTMetadata } from "@/lib/useNFTMetadata";

export default function MarketplacePage() {
  const { data: listingIds, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getActiveListings",
  });

  return (
    <div>
      <h2 style={{ fontSize: "32px", fontWeight: 700, color: "white", marginBottom: "32px" }}>
        Marketplace
      </h2>

      <div style={{ display: "flex", gap: "32px" }}>
        {/* IRAGAZKIAK */}
        <div style={{
          width: "280px",
          background: "white",
          borderRadius: "24px",
          padding: "24px",
          height: "fit-content",
        }}>
          <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Prezio tartea</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="number"
                placeholder="Min ETH"
                style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#111827" }}
              />
              <input
                type="number"
                placeholder="Max ETH"
                style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#111827" }}
              />
            </div>
          </div>
          <button style={{
            width: "100%", padding: "14px",
            background: "#8b5cf6", color: "white",
            border: "none", borderRadius: "16px",
            fontWeight: 600, cursor: "pointer",
          }}>
            Aplikatu iragazkiak
          </button>
        </div>

        {/* PRODUKTUAK */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "24px",
          }}>
            <div style={{ color: "white" }}>
              {isLoading ? "Kargatzen..." : `${(listingIds as bigint[] | undefined)?.length ?? 0} produktu eskuragarri`}
            </div>
          </div>

          {isLoading ? (
            <div style={{
              background: "white", borderRadius: "24px",
              padding: "60px", textAlign: "center", color: "#9ca3af",
            }}>
              Kargatzen...
            </div>
          ) : !listingIds || (listingIds as bigint[]).length === 0 ? (
            <div style={{
              background: "white", borderRadius: "24px",
              padding: "60px", textAlign: "center", color: "#9ca3af",
            }}>
              Oraindik ez dago produkturik. <Link href="/create" style={{ color: "#8b5cf6" }}>Izan zaitez lehena!</Link>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
            }}>
              {(listingIds as bigint[]).map((id) => (
                <ListingCard key={id.toString()} listingId={id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listingId }: { listingId: bigint }) {
  const { data: listing } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getListing",
    args: [listingId],
  });

  const l = listing as { id: bigint; seller: string; tokenId: bigint; price: bigint; isActive: boolean; createdAt: bigint } | undefined;
  const { metadata } = useNFTMetadata(l?.tokenId);

  if (!l) return null;
  if (!l.isActive) return null;

  const shortSeller = `${l.seller.slice(0, 6)}...${l.seller.slice(-4)}`;

  return (
    <Link href={`/listing/${l.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "white",
        borderRadius: "24px",
        overflow: "hidden",
        cursor: "pointer",
      }}
        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-8px)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <div style={{
          width: "100%", aspectRatio: "1/1",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {metadata?.image ? (
            <img
              src={metadata.image}
              alt={metadata.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
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
          <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>
            {shortSeller}
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