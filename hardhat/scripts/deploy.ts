import { network } from "hardhat";

async function main() {
  const { viem } = await network.create();
  const [deployer] = await viem.getWalletClients();
  if (!deployer.account) throw new Error("No account");

  console.log(`Hedapena egiten ari den kontua: ${deployer.account.address}`);

  // 1. NFTFactory hedatu
  const nftFactory = await viem.deployContract("NFTFactory", [deployer.account.address]);
  console.log(`NFTFactory helbidea: ${nftFactory.address}`);

  // 2. EscrowManager hedatu
  const escrowManager = await viem.deployContract("EscrowManager");
  console.log(`EscrowManager helbidea: ${escrowManager.address}`);

  // 3. DisputeResolver hedatu
  const disputeResolver = await viem.deployContract("DisputeResolver");
  console.log(`DisputeResolver helbidea: ${disputeResolver.address}`);

  // 4. MarketPlaceCore hedatu
  const marketplace = await viem.deployContract("MarketPlaceCore", [nftFactory.address]);
  console.log(`MarketPlaceCore helbidea: ${marketplace.address}`);

  // --- LOTURAK ETA BAIMENAK ---
  await marketplace.write.setEscrowManager([escrowManager.address]);
  console.log("EscrowManager helbidea ezarrita.");

  await escrowManager.write.transferOwnership([marketplace.address]);
  console.log("EscrowManager jabetza transferituta.");

  await disputeResolver.write.transferOwnership([marketplace.address]);
  console.log("DisputeResolver jabetza transferituta.");

  console.log("\n--- SISTEMA OSOA PREST DAGO ---");
  console.log(`NFTFactory:      ${nftFactory.address}`);
  console.log(`EscrowManager:   ${escrowManager.address}`);
  console.log(`DisputeResolver: ${disputeResolver.address}`);
  console.log(`MarketPlaceCore: ${marketplace.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});