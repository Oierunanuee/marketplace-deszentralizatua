import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("EscrowManager", async function () {
  it("Escrow bat sortu eta dirua askatu behar da", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    const escrowManager = await viem.deployContract("EscrowManager");

    const amount = parseEther("1");
    const orderId = 1n;
    
    // deployer-ak deitu behar du (onlyOwner)
    await escrowManager.write.createEscrow([orderId, seller.account.address, buyer.account.address], {
      value: amount,
      account: deployer.account,
    });
    
    const escrowId = await escrowManager.read.orderToEscrow([orderId]);
    const escrow = await escrowManager.read.escrows([escrowId]);
    
    assert.strictEqual(escrow[5], 0);
    
    // deployer-ak askatu behar du (onlyOwner)
    await escrowManager.write.releaseFunds([escrowId], { account: deployer.account });
    
    const updatedEscrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(updatedEscrow[5], 1);
  });

  it("Dirua itzuli behar dio erosleari", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    const escrowManager = await viem.deployContract("EscrowManager");

    const amount = parseEther("1");
    const orderId = 2n;
    
    await escrowManager.write.createEscrow([orderId, seller.account.address, buyer.account.address], {
      value: amount,
      account: deployer.account,
    });
    
    const escrowId = await escrowManager.read.orderToEscrow([orderId]);
    
    await escrowManager.write.refundBuyer([escrowId], { account: deployer.account });
    
    const escrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(escrow[5], 2);
  });
});