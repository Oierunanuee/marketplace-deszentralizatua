import NFTFactoryJson from "./contracts/NFTFactory.json";
import MarketPlaceCoreJson from "./contracts/MarketPlaceCore.json";
import EscrowManagerJson from "./contracts/EscrowManager.json";
import DisputeResolverJson from "./contracts/DisputeResolver.json";

export const CONTRACT_ADDRESSES = {
  NFTFactory: "0x31b4a01b3fc85accb7f65344570a800e8c329a94",
  EscrowManager: "0xf19798d9047b8ff3633d441031eb54efa3b29d3f",
  DisputeResolver: "0x9278099dfa896403555c791c56ac4de321a8bde0",
  MarketPlaceCore: "0x8e10bcb6bbdec8ad4c1f8c5782498fcd70486f45",
} as const;

export const ABIS = {
  NFTFactory: NFTFactoryJson.abi,
  MarketPlaceCore: MarketPlaceCoreJson.abi,
  EscrowManager: EscrowManagerJson.abi,
  DisputeResolver: DisputeResolverJson.abi,
} as const;