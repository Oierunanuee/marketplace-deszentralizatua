// test/EscrowManager.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther } from "viem";

describe("EscrowManager", async function () {
  it("Escrow bat sortu eta dirua askatu behar da (FUNDED egoeratik)", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    if (!deployer.account || !buyer.account || !seller.account) throw new Error("No account");

    const escrowManager = await viem.deployContract("EscrowManager");

    const amount = parseEther("1");
    const orderId = 1n;

    await escrowManager.write.createEscrow(
      [orderId, seller.account.address, buyer.account.address],
      { value: amount, account: deployer.account }
    );

    const escrowId = await escrowManager.read.orderToEscrow([orderId]);
    const escrow = await escrowManager.read.escrows([escrowId]);

    assert.strictEqual(escrow[5], 0); // FUNDED

    await escrowManager.write.releaseFunds([escrowId], { account: deployer.account });

    const updatedEscrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(updatedEscrow[5], 1); // RELEASED
  });

  it("Dirua itzuli behar dio erosleari (FUNDED egoeratik)", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    if (!deployer.account || !buyer.account || !seller.account) throw new Error("No account");

    const escrowManager = await viem.deployContract("EscrowManager");

    const amount = parseEther("1");
    const orderId = 2n;

    await escrowManager.write.createEscrow(
      [orderId, seller.account.address, buyer.account.address],
      { value: amount, account: deployer.account }
    );

    const escrowId = await escrowManager.read.orderToEscrow([orderId]);

    await escrowManager.write.refundBuyer([escrowId], { account: deployer.account });

    const escrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(escrow[5], 2); // REFUNDED
  });

  it("Dirua askatu behar da DISPUTED egoeratik ere", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    if (!deployer.account || !buyer.account || !seller.account) throw new Error("No account");

    const escrowManager = await viem.deployContract("EscrowManager");

    const amount = parseEther("1");
    const orderId = 3n;

    await escrowManager.write.createEscrow(
      [orderId, seller.account.address, buyer.account.address],
      { value: amount, account: deployer.account }
    );

    const escrowId = await escrowManager.read.orderToEscrow([orderId]);

    // Desadostasuna ireki
    await escrowManager.write.openDispute([escrowId], { account: deployer.account });

    const disputedEscrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(disputedEscrow[5], 3); // DISPUTED

    // DISPUTED egoeratik dirua askatu
    await escrowManager.write.releaseFunds([escrowId], { account: deployer.account });

    const releasedEscrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(releasedEscrow[5], 1); // RELEASED
  });

  it("Dirua itzuli behar da DISPUTED egoeratik ere", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    if (!deployer.account || !buyer.account || !seller.account) throw new Error("No account");

    const escrowManager = await viem.deployContract("EscrowManager");

    const amount = parseEther("1");
    const orderId = 4n;

    await escrowManager.write.createEscrow(
      [orderId, seller.account.address, buyer.account.address],
      { value: amount, account: deployer.account }
    );

    const escrowId = await escrowManager.read.orderToEscrow([orderId]);

    // Desadostasuna ireki
    await escrowManager.write.openDispute([escrowId], { account: deployer.account });

    // DISPUTED egoeratik dirua itzuli
    await escrowManager.write.refundBuyer([escrowId], { account: deployer.account });

    const refundedEscrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(refundedEscrow[5], 2); // REFUNDED
  });
});