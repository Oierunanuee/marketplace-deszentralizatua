"use client";

import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts";
import { formatEther } from "viem";
import { useState } from "react";

const OWNER = "0x2dfebee0c186819005a284c158c5b13c0b8fc0c1";

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div style={{ background: "white", borderRadius: "32px", padding: "60px", textAlign: "center" }}>
        <h2 style={{ color: "#111827" }}>Konektatu zure wallet-a</h2>
      </div>
    );
  }

  if (address?.toLowerCase() !== OWNER.toLowerCase()) {
    return (
      <div style={{ background: "white", borderRadius: "32px", padding: "60px", textAlign: "center" }}>
        <h2 style={{ color: "#ef4444" }}>Sarbidea ukatuta</h2>
        <p style={{ color: "#6b7280", marginTop: "16px" }}>Orrialde hau soilik administratzaileentzat da</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "32px", fontWeight: 700, color: "white", marginBottom: "32px" }}>
        Panel de administración
      </h2>
      <DisputesList />
    </div>
  );
}

function DisputesList() {
  const { data: orderCount } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getOrderCount",
  });

  const count = orderCount ? Number(orderCount) : 0;
  const orderIds = Array.from({ length: count }, (_, i) => BigInt(i + 1));

  return (
    <div style={{ background: "white", borderRadius: "24px", padding: "24px" }}>
      <h3 style={{ color: "#111827", marginBottom: "16px" }}>Desadostasunak</h3>
      {count === 0 ? (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>
          Ez dago desadostasunik
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {orderIds.map(orderId => (
            <DisputeOrderCard key={orderId.toString()} orderId={orderId} />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeOrderCard({ orderId }: { orderId: bigint }) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  const { data: order, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getOrder",
    args: [orderId],
  });

  if (!order) return null;

  const o = order as {
    listingId: bigint;
    buyer: string;
    amount: bigint;
    status: number;
    paidAt: bigint;
    completedAt: bigint;
    disputeReason: string;
  };

  if (o.status !== 3) return null;

  async function handleResolve(favorBuyer: boolean) {
    try {
      setLoading(true);
      setIsError(false);
      setStatus("Prozesatzen...");

      // Simulatu errorea ikusteko
      await publicClient!.simulateContract({
        address: CONTRACT_ADDRESSES.MarketPlaceCore,
        abi: ABIS.MarketPlaceCore,
        functionName: "resolveDisputeAsAdmin",
        args: [orderId, favorBuyer],
        account: OWNER as `0x${string}`,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MarketPlaceCore,
        abi: ABIS.MarketPlaceCore,
        functionName: "resolveDisputeAsAdmin",
        args: [orderId, favorBuyer],
      });

      await publicClient!.waitForTransactionReceipt({ hash });
      setStatus(favorBuyer ? "Ebatzita: eroslearen alde" : "Ebatzita: saltzailearen alde");
      refetch();
    } catch (error) {
      const err = error as Error;
      console.error("Error completo:", error);
      setStatus(`Error: ${err.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca",
      borderRadius: "16px", padding: "24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
            Ordena #{orderId.toString()}
          </div>
          <div style={{ color: "#6b7280", marginBottom: "4px" }}>
            Eroslea: {o.buyer.slice(0, 6)}...{o.buyer.slice(-4)}
          </div>
          <div style={{ color: "#6b7280", marginBottom: "4px" }}>
            Zenbatekoa: {formatEther(o.amount)} ETH
          </div>
          {o.disputeReason && (
            <div style={{
              background: "white", borderRadius: "8px",
              padding: "12px", marginTop: "12px", color: "#111827",
            }}>
              <strong>Arrazoia:</strong> {o.disputeReason}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => handleResolve(true)}
            disabled={loading}
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white", border: "none", borderRadius: "12px",
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            }}>
            Eroslearen alde
          </button>
          <button
            onClick={() => handleResolve(false)}
            disabled={loading}
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              color: "white", border: "none", borderRadius: "12px",
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            }}>
            Saltzailearen alde
          </button>
        </div>
      </div>

      {status && (
        <div style={{
          marginTop: "16px", padding: "12px", borderRadius: "8px",
          background: isError ? "#fef2f2" : "#f0fdf4",
          color: isError ? "#ef4444" : "#10b981",
        }}>
          {status}
        </div>
      )}
    </div>
  );
}