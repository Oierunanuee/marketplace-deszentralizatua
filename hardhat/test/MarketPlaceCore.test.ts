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

    const nftFactory = await viem.deployContract("NFTFactory", [sellerAddress]);
    const escrowManager = await viem.deployContract("EscrowManager");
    const marketplace = await viem.deployContract("MarketPlaceCore", [nftFactory.address]);

    // Setup
    await marketplace.write.setEscrowManager([escrowManager.address]);
    await escrowManager.write.transferOwnership([marketplace.address]);
    await nftFactory.write.setApprovalForAll([marketplace.address, true], {
      account: seller.account,
    });

    // NFT mint
    const tokenUri = "ipfs://QmTest";
    await nftFactory.write.mintNFT([sellerAddress, tokenUri], {
      account: seller.account,
    });

    // Zerrendatu
    const price = parseEther("0.1");
    await marketplace.write.listItem([0n, price], { account: seller.account });

    const listing = await marketplace.read.listings([1n]);
    assert.strictEqual(listing[1].toLowerCase(), sellerAddress.toLowerCase());
    assert.strictEqual(listing[3], price);
    assert.strictEqual(listing[4], true);

    // Erosi
    await marketplace.write.purchaseItem([1n], { value: price, account: buyer.account });

    const updatedListing = await marketplace.read.listings([1n]);
    assert.strictEqual(updatedListing[4], false);
  });
});