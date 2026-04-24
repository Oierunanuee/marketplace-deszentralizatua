import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("NFTFactory", async function () {
  it("NFT bat sortu behar du", async function () {
    const { viem } = await network.create();
    const [deployer] = await viem.getWalletClients();

    const nftFactory = await viem.deployContract("NFTFactory", [deployer.account.address]);

    const tokenUri = "ipfs://QmTest";
    const tokenId = 0n;
    
    // deployer-ak deitu behar du (jabea da)
    await nftFactory.write.mintNFT([deployer.account.address, tokenUri], {
      account: deployer.account,
    });
    
    const owner = await nftFactory.read.ownerOf([tokenId]);
    assert.strictEqual(owner.toLowerCase(), deployer.account.address.toLowerCase());
    
    const uri = await nftFactory.read.tokenURI([tokenId]);
    assert.strictEqual(uri, tokenUri);
  });
});