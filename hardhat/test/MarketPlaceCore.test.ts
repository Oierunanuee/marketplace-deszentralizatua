// test/MarketPlaceCore.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

async function setupMarketplace(viem: any) {
  const [deployer, seller, buyer] = await viem.getWalletClients();
  if (!deployer.account || !seller.account || !buyer.account) throw new Error("No account");

  const sellerAddress = seller.account.address as `0x${string}`;

  const nftFactory = await viem.deployContract("NFTFactory", [deployer.account.address]);
  const escrowManager = await viem.deployContract("EscrowManager");
  const disputeResolver = await viem.deployContract("DisputeResolver");
  const marketplace = await viem.deployContract("MarketPlaceCore", [nftFactory.address]);

  await marketplace.write.setEscrowManager([escrowManager.address]);
  await marketplace.write.setDisputeResolver([disputeResolver.address]);
  await escrowManager.write.transferOwnership([marketplace.address]);
  await disputeResolver.write.transferOwnership([marketplace.address]);
  await nftFactory.write.setApprovalForAll([marketplace.address, true], { account: seller.account });
  await nftFactory.write.mintNFT([sellerAddress, "ipfs://QmTest"], { account: seller.account });

  return { deployer, seller, buyer, nftFactory, escrowManager, disputeResolver, marketplace };
}

describe("MarketPlaceCore", async function () {
  it("Produktu bat zerrendatu eta erosi behar da", async function () {
    const { viem } = await network.create();
    const { seller, buyer, marketplace } = await setupMarketplace(viem);

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });

    const listing = await marketplace.read.listings([1n]);
    assert.strictEqual(listing[1].toLowerCase(), seller.account.address.toLowerCase());
    assert.strictEqual(listing[3], price);
    assert.strictEqual(listing[4], true);

    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });

    const updatedListing = await marketplace.read.listings([1n]);
    assert.strictEqual(updatedListing[4], false);
  });

  it("Desadostasuna ireki eta admin-ak ebatzi behar du (eroslearen alde)", async function () {
    const { viem } = await network.create();
    const { deployer, seller, buyer, marketplace } = await setupMarketplace(viem);

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });
    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });
    await marketplace.write.openDispute([1n, "Produktua ez da iritsi"], { account: buyer.account });

    const disputedOrder = await marketplace.read.orders([1n]);
    assert.strictEqual(disputedOrder[3], 3); // DISPUTED

    await marketplace.write.resolveDisputeAsAdmin([1n, true], { account: deployer.account });

    const resolvedOrder = await marketplace.read.orders([1n]);
    assert.strictEqual(resolvedOrder[3], 4); // REFUNDED
  });

  it("Desadostasuna ireki eta admin-ak ebatzi behar du (saltzailearen alde)", async function () {
    const { viem } = await network.create();
    const { deployer, seller, buyer, marketplace } = await setupMarketplace(viem);

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });
    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });
    await marketplace.write.openDispute([1n, "Produktua bidali dut"], { account: buyer.account });

    await marketplace.write.resolveDisputeAsAdmin([1n, false], { account: deployer.account });

    const resolvedOrder = await marketplace.read.orders([1n]);
    assert.strictEqual(resolvedOrder[3], 5); // RESOLVED
  });

  it("Ez du uzten saltzaileak bere produktua erosten", async function () {
    const { viem } = await network.create();
    const { seller, marketplace } = await setupMarketplace(viem);

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });

    await assert.rejects(
      async () => {
        await marketplace.write.purchaseItem([1n], { value: price, account: seller.account! });
      },
      /Saltzaileak ezin du bere produktua erosi/
    );
  });

  it("Ez du uzten prezio okerrarekin erosten", async function () {
    const { viem } = await network.create();
    const { seller, buyer, marketplace } = await setupMarketplace(viem);

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });

    await assert.rejects(
      async () => {
        await marketplace.write.purchaseItem(
          [1n],
          { value: parseEther("0.05"), account: buyer.account! }
        );
      },
      /Zenbateko okerra bidali da/
    );
  });

  it("Ez du uzten listing inaktibo bat erosten", async function () {
    const { viem } = await network.create();
    const { seller, buyer, marketplace } = await setupMarketplace(viem);

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });
    await marketplace.write.cancelListing([1n], { account: seller.account });

    await assert.rejects(
      async () => {
        await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account! });
      },
      /Zerrendaketa ez dago aktibo/
    );
  });

  it("Ez du uzten admin ez den kontuak disputa ebazten", async function () {
    const { viem } = await network.create();
    const { seller, buyer, marketplace } = await setupMarketplace(viem);

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });
    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });
    await marketplace.write.openDispute([1n, "Arrazoia"], { account: buyer.account });

    await assert.rejects(
      async () => {
        await marketplace.write.resolveDisputeAsAdmin([1n, true], { account: buyer.account! });
      },
      /OwnableUnauthorizedAccount/
    );
  });

  it("Ez du uzten 0 prezioko listing bat sortzen", async function () {
    const { viem } = await network.create();
    const { seller, marketplace } = await setupMarketplace(viem);

    await assert.rejects(
      async () => {
        await marketplace.write.listItem([0n, 0n], { account: seller.account! });
      },
      /Prezioa zero baino handiagoa izan behar da/
    );
  });
});