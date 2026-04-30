"use client";

import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import { uploadImage, uploadMetadata } from "@/lib/pinata";
import { CONTRACT_ADDRESSES, ABIS } from "@/lib/contracts";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  }

  async function handleCreate() {
    if (!isConnected) { setStatus("Konektatu zure wallet-a lehenik"); setIsError(true); return; }
    if (!name || !description || !price || !file) { setStatus("Bete eremu guztiak"); setIsError(true); return; }
    if (parseFloat(price) <= 0) { setStatus("Prezioa 0 baino handiagoa izan behar da"); setIsError(true); return; }

    try {
      setLoading(true);
      setIsError(false);

      setStatus("Irudia IPFS-ra igotzen...");
      const imageCID = await uploadImage(file);

      setStatus("Metadatuak IPFS-ra igotzen...");
      const metadataCID = await uploadMetadata({ name, description, imageCID });

      setStatus("NFT sortzen blockchain-ean...");
      const { result: tokenId } = await publicClient!.simulateContract({
        address: CONTRACT_ADDRESSES.NFTFactory,
        abi: ABIS.NFTFactory,
        functionName: "mintNFT",
        args: [address!, `ipfs://${metadataCID}`],
        account: address!,
      });

      const mintHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.NFTFactory,
        abi: ABIS.NFTFactory,
        functionName: "mintNFT",
        args: [address!, `ipfs://${metadataCID}`],
      });

      await publicClient!.waitForTransactionReceipt({ hash: mintHash });

      setStatus("Marketplace-ari baimena ematen...");
      const approvalHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.NFTFactory,
        abi: ABIS.NFTFactory,
        functionName: "setApprovalForAll",
        args: [CONTRACT_ADDRESSES.MarketPlaceCore, true],
      });

      await publicClient!.waitForTransactionReceipt({ hash: approvalHash });

      setStatus("Marketplace-an zerrendatzen...");
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.MarketPlaceCore,
        abi: ABIS.MarketPlaceCore,
        functionName: "listItem",
        args: [tokenId as bigint, parseEther(price)],
      });

      setStatus("NFT ongi sortu eta zerrendatu da!");
      setTimeout(() => router.push("/marketplace"), 2000);

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
      <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#111827", marginBottom: "32px" }}>
        NFT berria sortu
      </h2>

      <div style={{ display: "flex", gap: "32px" }}>
        <div style={{ flex: 1 }}>

          <div style={{ background: "white", borderRadius: "24px", padding: "24px", marginBottom: "24px" }}>
            <label style={{
              display: "block", border: "3px dashed #e5e7eb", borderRadius: "16px",
              padding: "60px 40px", textAlign: "center", cursor: "pointer",
            }}>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
              {preview ? (
                <img src={preview} alt="preview" style={{ maxHeight: "200px", borderRadius: "12px" }} />
              ) : (
                <>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }}>📤</div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>Igo zure irudia</div>
                  <div style={{ color: "#9ca3af", marginTop: "8px" }}>JPG, PNG, GIF</div>
                </>
              )}
            </label>
          </div>

          <div style={{ background: "white", borderRadius: "24px", padding: "24px", marginBottom: "24px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: 600, color: "#111827" }}>NFTaren izena</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", border: "2px solid #e5e7eb", borderRadius: "16px", marginTop: "8px", boxSizing: "border-box", color: "#111827" }}
                placeholder="Adib: Kamiseta gorria - M tamaina"
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: 600, color: "#111827" }}>Deskribapena</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", border: "2px solid #e5e7eb", borderRadius: "16px", marginTop: "8px", minHeight: "100px", boxSizing: "border-box", color: "#111827" }}
                placeholder="Produktuaren deskribapen xehatua..."
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#111827" }}>Prezioa (ETH)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", border: "2px solid #e5e7eb", borderRadius: "16px", marginTop: "8px", boxSizing: "border-box", color: "#111827" }}
                placeholder="0.01"
                step="0.001"
                min="0"
              />
            </div>
          </div>

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

          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              width: "100%", padding: "18px",
              background: loading ? "#9ca3af" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white", border: "none", borderRadius: "16px",
              fontSize: "18px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            }}>
            {loading ? "Prozesatzen..." : "NFT sortu"}
          </button>
        </div>

        <div style={{ width: "350px" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", position: "sticky", top: "100px" }}>
            <div style={{ fontWeight: 600, marginBottom: "16px", color: "#111827" }}>Aurrebista</div>
            <div style={{
              width: "100%", aspectRatio: "1/1",
              background: preview ? "transparent" : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: "16px", marginBottom: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              {preview
                ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "48px" }}>🖼️</span>
              }
            </div>
            <div style={{ marginBottom: "8px", color: "#111827" }}><strong>Izena:</strong> {name || "—"}</div>
            <div style={{ marginBottom: "8px", color: "#111827" }}><strong>Deskribapena:</strong> {description || "—"}</div>
            <div style={{ color: "#111827" }}><strong>Prezioa:</strong> {price ? `${price} ETH` : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}