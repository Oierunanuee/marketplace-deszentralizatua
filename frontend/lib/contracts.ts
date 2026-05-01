import NFTFactoryJson from "./contracts/NFTFactory.json";
import MarketPlaceCoreJson from "./contracts/MarketPlaceCore.json";
import EscrowManagerJson from "./contracts/EscrowManager.json";
import DisputeResolverJson from "./contracts/DisputeResolver.json";

export const CONTRACT_ADDRESSES = {
  NFTFactory: "0xd40c4111f656a6245b75b76eea3e2f33816c35d9",
  EscrowManager: "0x28df8daee3828ee2dda06bc7d1359071de5f588d",
  DisputeResolver: "0x5ea0168858b07da2ce26640a3b835220757c5ab2",
  MarketPlaceCore: "0x4ad41da27a2f49e1d3d40d170bc103a9fe2c7221",
} as const;

export const ABIS = {
  NFTFactory: NFTFactoryJson.abi,
  MarketPlaceCore: MarketPlaceCoreJson.abi,
  EscrowManager: EscrowManagerJson.abi,
  DisputeResolver: DisputeResolverJson.abi,
} as const;