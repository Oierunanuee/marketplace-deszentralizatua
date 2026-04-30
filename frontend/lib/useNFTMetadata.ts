import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, ABIS } from "./contracts";
import { useEffect, useState } from "react";

const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return `${GATEWAY}/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

export function useNFTMetadata(tokenId: bigint | undefined) {
  const [metadata, setMetadata] = useState<{
    name: string;
    description: string;
    image: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: tokenURI } = useReadContract({
    address: CONTRACT_ADDRESSES.NFTFactory,
    abi: ABIS.NFTFactory,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  useEffect(() => {
    if (!tokenURI) return;

    async function fetchMetadata() {
      setLoading(true);
      try {
        const url = ipfsToHttp(tokenURI as string);
        const response = await fetch(url);
        const data = await response.json();
        setMetadata({
          name: data.name,
          description: data.description,
          image: ipfsToHttp(data.image),
        });
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [tokenURI]);

  return { metadata, loading };
}