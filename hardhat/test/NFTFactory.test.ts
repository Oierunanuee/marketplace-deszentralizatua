// test/NFTFactory.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("NFTFactory", async function () {
  it("NFT bat sortu behar du (edozein kontuak)", async function () {
    const { viem } = await network.create();
    const [deployer, user] = await viem.getWalletClients();
    if (!deployer.account || !user.account) throw new Error("No account");

    const nftFactory = await viem.deployContract("NFTFactory", [deployer.account.address]);

    const tokenUri = "ipfs://QmTest";
    const tokenId = 0n;

    await nftFactory.write.mintNFT([user.account.address, tokenUri], {
      account: user.account,
    });

    const owner = await nftFactory.read.ownerOf([tokenId]);
    assert.strictEqual(owner.toLowerCase(), user.account.address.toLowerCase());

    const uri = await nftFactory.read.tokenURI([tokenId]);
    assert.strictEqual(uri, tokenUri);
  });

  it("Deployer ez den kontu batek ere mint egin dezake", async function () {
    const { viem } = await network.create();
    const [deployer, user1, user2] = await viem.getWalletClients();
    if (!deployer.account || !user1.account || !user2.account) throw new Error("No account");

    const nftFactory = await viem.deployContract("NFTFactory", [deployer.account.address]);

    await nftFactory.write.mintNFT([user1.account.address, "ipfs://QmTest1"], {
      account: user1.account,
    });

    await nftFactory.write.mintNFT([user2.account.address, "ipfs://QmTest2"], {
      account: user2.account,
    });

    const owner1 = await nftFactory.read.ownerOf([0n]);
    const owner2 = await nftFactory.read.ownerOf([1n]);

    assert.strictEqual(owner1.toLowerCase(), user1.account.address.toLowerCase());
    assert.strictEqual(owner2.toLowerCase(), user2.account.address.toLowerCase());
  });

  it("Ez du uzten token existitzen ez dena kontsultatzen", async function () {
    const { viem } = await network.create();
    const [deployer] = await viem.getWalletClients();
    if (!deployer.account) throw new Error("No account");

    const nftFactory = await viem.deployContract("NFTFactory", [deployer.account.address]);

    await assert.rejects(
      async () => {
        await nftFactory.read.ownerOf([999n]);
      },
      /ERC721NonexistentToken/
    );
  });
});