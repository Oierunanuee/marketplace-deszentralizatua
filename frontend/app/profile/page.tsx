"use client";

import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts";
import { formatEther } from "viem";
import { useState } from "react";
import { useNFTMetadata } from "@/lib/useNFTMetadata";
import Link from "next/link";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"erosketak" | "salmentak" | "listings">("listings");

  if (!isConnected) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center">
        <div className="text-7xl mb-6">🦊</div>
        <h2 className="text-gray-800 text-2xl font-bold mb-4">Konektatu zure wallet-a</h2>
        <p className="text-gray-500">Zure erosketak eta salmentak ikusteko wallet-a konektatu behar duzu</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-3xl overflow-hidden mb-8 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-purple-500 to-indigo-600 relative">
          <div className="w-20 h-20 bg-white rounded-full absolute -bottom-10 left-8 p-1 shadow-md">
            <div className="w-full h-full bg-gradient-to-r from-pink-400 to-red-500 rounded-full flex items-center justify-center text-3xl">
              🦊
            </div>
          </div>
        </div>
        <div className="pt-12 pb-5 px-8">
          <h2 className="text-gray-800 text-lg font-bold">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </h2>
          <p className="text-gray-400 text-xs mt-1 break-all">{address}</p>
        </div>

        <div className="flex gap-2 px-8 pb-4 border-t border-gray-100 pt-3">
          <button
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-1.5 rounded-full font-semibold transition text-xs ${
              activeTab === "listings"
                ? "bg-purple-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Nire produktuak
          </button>
          <button
            onClick={() => setActiveTab("erosketak")}
            className={`px-4 py-1.5 rounded-full font-semibold transition text-xs ${
              activeTab === "erosketak"
                ? "bg-purple-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Nire erosketak
          </button>
          <button
            onClick={() => setActiveTab("salmentak")}
            className={`px-4 py-1.5 rounded-full font-semibold transition text-xs ${
              activeTab === "salmentak"
                ? "bg-purple-600 text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Nire salmentak
          </button>
        </div>
      </div>

      {activeTab === "listings" && <ListingsTab address={address!} />}
      {activeTab === "erosketak" && <ErosketakTab address={address!} />}
      {activeTab === "salmentak" && <SalmentakTab address={address!} />}
    </div>
  );
}

// ============= LISTINGS TAB =============

function ListingsTab({ address }: { address: string }) {
  const { data: listingIds } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getListingsBySeller",
    args: [address as `0x${string}`],
  });

  const listings = (listingIds as bigint[]) || [];

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
        Ez duzu produkturik salgai oraindik
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {listings.map((listingId) => (
        <ListingCard key={listingId.toString()} listingId={listingId} />
      ))}
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

  const l = listing as {
    id: bigint;
    seller: string;
    tokenId: bigint;
    price: bigint;
    isActive: boolean;
    createdAt: bigint;
  } | undefined;

  const { metadata } = useNFTMetadata(l?.tokenId);

  if (!l) return null;

  return (
    <Link href={`/listing/${l.id}`} className="block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
        <div className="aspect-square bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center overflow-hidden">
          {metadata?.image ? (
            <img src={metadata.image} alt={metadata.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">🖼️</span>
          )}
        </div>
        <div className="p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="text-purple-600 text-xs font-semibold">#{l.tokenId.toString()}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${l.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {l.isActive ? "AKTIBO" : "SALDU"}
            </span>
          </div>
          <div className="font-semibold text-gray-800 text-sm truncate">
            {metadata?.name || `Produktua #${l.id.toString()}`}
          </div>
          <div className="text-gray-500 text-xs mt-1">{formatEther(l.price)} ETH</div>
        </div>
      </div>
    </Link>
  );
}

// ============= EROSKETAK TAB =============

function ErosketakTab({ address }: { address: string }) {
  const { data: orderIds } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getOrdersByBuyer",
    args: [address as `0x${string}`],
  });

  const orders = (orderIds as bigint[]) || [];

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
        Ez duzu erosketarik egin oraindik
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {orders.map((orderId) => (
        <OrderCard key={orderId.toString()} orderId={orderId} role="buyer" />
      ))}
    </div>
  );
}

// ============= SALMENTAK TAB =============

function SalmentakTab({ address }: { address: string }) {
  const { data: orderIds } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getSalesBySeller",
    args: [address as `0x${string}`],
  });

  const orders = (orderIds as bigint[]) || [];

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
        Ez duzu salmentarik egin oraindik
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {orders.map((orderId) => (
        <OrderCard key={orderId.toString()} orderId={orderId} role="seller" />
      ))}
    </div>
  );
}

// ============= ORDER CARD =============

const STATUS_MAP: Record<number, string> = {
  0: "SORTUA",
  1: "ORDAINDUTA",
  2: "OSATUA",
  3: "DESADOSTASUNA",
  4: "ITZULIA",
  5: "EBATZITA",
};

function OrderCard({ orderId, role }: { orderId: bigint; role: "buyer" | "seller" }) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const { data: order, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.MarketPlaceCore,
    abi: ABIS.MarketPlaceCore,
    functionName: "getOrder",
    args: [orderId],
  });

  const o = order as {
    listingId: bigint;
    buyer: string;
    amount: bigint;
    status: number;
    paidAt: bigint;
    completedAt: bigint;
    disputeReason: string;
  } | undefined;

  if (!o) return null;

  const isPendingBuyer = role === "buyer" && o.status === 1;

  async function handleConfirmReceipt() {
    try {
      setLoading(true);
      setStatusMsg("Prozesatzen...");
      setIsError(false);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MarketPlaceCore,
        abi: ABIS.MarketPlaceCore,
        functionName: "confirmReceipt",
        args: [orderId],
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      setStatusMsg("Jasotze baieztatuta!");
      refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      const err = error as Error;
      setStatusMsg(`Errorea: ${err.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDispute() {
    const reason = prompt("Desadostasunaren arrazoia:");
    if (!reason) return;
    try {
      setLoading(true);
      setStatusMsg("Prozesatzen...");
      setIsError(false);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MarketPlaceCore,
        abi: ABIS.MarketPlaceCore,
        functionName: "openDispute",
        args: [orderId, reason],
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      setStatusMsg("Desadostasuna irekita!");
      refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      const err = error as Error;
      setStatusMsg(`Errorea: ${err.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm p-3">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-gray-400">Ordena #{orderId.toString()}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            o.status === 1
              ? "bg-yellow-100 text-yellow-700"
              : o.status === 2
              ? "bg-green-100 text-green-700"
              : o.status === 3
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_MAP[o.status] || "DESKONOZITUA"}
        </span>
      </div>
      <div className="font-semibold text-gray-800 text-sm">{formatEther(o.amount)} ETH</div>
      <div className="text-gray-400 text-xs mt-1">Listing #{o.listingId.toString()}</div>

      {statusMsg && (
        <p className={`text-xs mt-2 ${isError ? "text-red-600" : "text-green-600"}`}>
          {statusMsg}
        </p>
      )}

      {isPendingBuyer && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleConfirmReceipt}
            disabled={loading}
            className="bg-green-600 text-white text-xs px-3 py-1 rounded-full hover:bg-green-700 disabled:opacity-50"
          >
            Jaso dut
          </button>
          <button
            onClick={handleOpenDispute}
            disabled={loading}
            className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full border border-red-200 hover:bg-red-100 disabled:opacity-50"
          >
            Arazo bat dut
          </button>
        </div>
      )}
    </div>
  );
}