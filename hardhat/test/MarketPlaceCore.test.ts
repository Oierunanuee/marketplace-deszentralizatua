// test/MarketPlaceCore.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("MarketPlaceCore", async function () {
  it("Produktu bat zerrendatu eta erosi behar da", async function () {
    const { viem } = await network.create();
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
    await nftFactory.write.setApprovalForAll([marketplace.address, true], {
      account: seller.account,
    });

    // Seller-ak mint egin dezake (onlyOwner kendu da)
    await nftFactory.write.mintNFT([sellerAddress, "ipfs://QmTest"], {
      account: seller.account,
    });

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });

    const listing = await marketplace.read.listings([1n]);
    assert.strictEqual(listing[1].toLowerCase(), sellerAddress.toLowerCase());
    assert.strictEqual(listing[3], price);
    assert.strictEqual(listing[4], true);

    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });

    const updatedListing = await marketplace.read.listings([1n]);
    assert.strictEqual(updatedListing[4], false);
  });

  it("Desadostasuna ireki eta admin-ak ebatzi behar du (eroslearen alde)", async function () {
    const { viem } = await network.create();
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
    await nftFactory.write.setApprovalForAll([marketplace.address, true], {
      account: seller.account,
    });

    await nftFactory.write.mintNFT([sellerAddress, "ipfs://QmTest"], {
      account: seller.account,
    });

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });
    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });

    // Desadostasuna ireki
    await marketplace.write.openDispute([1n, "Produktua ez da iritsi"], {
      account: buyer.account,
    });

    const disputedOrder = await marketplace.read.orders([1n]);
    assert.strictEqual(disputedOrder[3], 3); // DISPUTED

    // Admin-ak ebatzi eroslearen alde
    await marketplace.write.resolveDisputeAsAdmin([1n, true], {
      account: deployer.account,
    });

    const resolvedOrder = await marketplace.read.orders([1n]);
    assert.strictEqual(resolvedOrder[3], 4); // REFUNDED
  });

  it("Desadostasuna ireki eta admin-ak ebatzi behar du (saltzailearen alde)", async function () {
    const { viem } = await network.create();
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
    await nftFactory.write.setApprovalForAll([marketplace.address, true], {
      account: seller.account,
    });

    await nftFactory.write.mintNFT([sellerAddress, "ipfs://QmTest"], {
      account: seller.account,
    });

    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });
    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });

    // Desadostasuna ireki
    await marketplace.write.openDispute([1n, "Produktua bidali dut"], {
      account: buyer.account,
    });

    // Admin-ak ebatzi saltzailearen alde
    await marketplace.write.resolveDisputeAsAdmin([1n, false], {
      account: deployer.account,
    });

    const resolvedOrder = await marketplace.read.orders([1n]);
    assert.strictEqual(resolvedOrder[3], 5); // RESOLVED
  });
});