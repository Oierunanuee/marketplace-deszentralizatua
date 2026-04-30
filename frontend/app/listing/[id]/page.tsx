"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts";
import { formatEther } from "viem";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ListingPage() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  const listingId = BigInt(id as string);

  const { data: listing } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getListing",
    args: [listingId],
  });

  if (!listing) return (
    <div style={{ color: "white", textAlign: "center", padding: "60px" }}>
      Kargatzen...
    </div>
  );

  const l = listing as { id: bigint; seller: string; tokenId: bigint; price: bigint; isActive: boolean; createdAt: bigint };
  const seller = l.seller;
  const tokenId = l.tokenId;
  const price = l.price;
  const isActive = l.isActive;

  const isSeller = address?.toLowerCase() === seller.toLowerCase();

  async function handlePurchase() {
    if (!isConnected) { setStatus("Konektatu zure wallet-a lehenik"); setIsError(true); return; }
    if (isSeller) { setStatus("Ezin duzu zure produktua erosi"); setIsError(true); return; }

    try {
      setLoading(true);
      setIsError(false);
      setStatus("Transakzioa prozesatzen...");

      await writeContractAsync({
        address: CONTRACT_ADDRESSES.MarketPlaceCore,
        abi: ABIS.MarketPlaceCore,
        functionName: "purchaseItem",
        args: [listingId],
        value: price,
      });

      setStatus("Erosketa ongi burutua! Produktua jasotzeko zain.");
      setTimeout(() => router.push("/profile"), 2000);

    } catch (error) {
      const err = error as Error;
      setStatus(`Errorea: ${err.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{
        background: "white",
        borderRadius: "32px",
        overflow: "hidden",
        display: "flex",
      }}>
        {/* EZKERREKO IRUDIA */}
        <div style={{
          flex: 1,
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: "100%", aspectRatio: "1/1",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "24px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "80px", marginBottom: "24px",
          }}>
            🖼️
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "white" }}>
            Produktua #{id}
          </div>
          <div style={{ color: "rgba(255,255,255,0.8)", marginTop: "8px" }}>
            Token #{tokenId.toString()}
          </div>
        </div>

        {/* ESKUINEKO XEHETASUNAK */}
        <div style={{ flex: 1, padding: "40px" }}>
          <div style={{ color: "#6b7280", fontSize: "14px", textTransform: "uppercase", marginBottom: "8px" }}>
            SALMENTA PREZIOA
          </div>
          <div style={{ fontSize: "48px", fontWeight: 700, color: "#111827", marginBottom: "32px" }}>
            {formatEther(price)} ETH
          </div>

          {/* SALTZAILEAREN INFORMAZIOA */}
          <div style={{
            background: "#f9fafb", borderRadius: "16px",
            padding: "20px", marginBottom: "24px",
          }}>
            <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "8px" }}>Saltzailea</div>
            <div style={{ fontWeight: 600, color: "#111827" }}>
              {seller.slice(0, 6)}...{seller.slice(-4)}
            </div>
          </div>

          {/* TRANSAKZIO XEHETASUNAK */}
          <div style={{
            background: "#f9fafb", borderRadius: "16px",
            padding: "20px", marginBottom: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ color: "#6b7280" }}>NFT prezioa</span>
              <span style={{ color: "#111827" }}>{formatEther(price)} ETH</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              paddingTop: "12px", borderTop: "2px dashed #e5e7eb",
              fontWeight: 700,
            }}>
              <span style={{ color: "#111827" }}>GUZTIRA</span>
              <span style={{ color: "#111827" }}>{formatEther(price)} ETH</span>
            </div>
          </div>

          {/* EGOERA MEZUA */}
          {status && (
            <div style={{
              background: isError ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
              borderRadius: "16px", padding: "16px", marginBottom: "24px",
              color: "#111827",
            }}>
              {status}
            </div>
          )}

          {/* EROSI BOTOIA */}
          {isActive ? (
            <button
              onClick={handlePurchase}
              disabled={loading || isSeller}
              style={{
                width: "100%", padding: "18px",
                background: isSeller ? "#e5e7eb" : loading ? "#9ca3af" : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                color: isSeller ? "#9ca3af" : "white",
                border: "none", borderRadius: "16px",
                fontSize: "18px", fontWeight: 600,
                cursor: isSeller || loading ? "not-allowed" : "pointer",
              }}>
              {isSeller ? "Zure produktua da" : loading ? "Prozesatzen..." : "Erosi orain"}
            </button>
          ) : (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "16px", padding: "16px", textAlign: "center", color: "#ef4444",
            }}>
              Produktu hau ez dago eskuragarri
            </div>
          )}

          <div style={{
            background: "#fef3c7", borderRadius: "12px",
            padding: "16px", marginTop: "16px", color: "#92400e",
          }}>
            Ordainketa blokeatuta geratuko da produktua jaso arte
          </div>
        </div>
      </div>
    </div>
  );
}