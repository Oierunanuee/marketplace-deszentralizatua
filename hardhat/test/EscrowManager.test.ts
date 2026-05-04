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

    await escrowManager.write.openDispute([escrowId], { account: deployer.account });

    const disputedEscrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(disputedEscrow[5], 3); // DISPUTED

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

    await escrowManager.write.openDispute([escrowId], { account: deployer.account });

    await escrowManager.write.refundBuyer([escrowId], { account: deployer.account });

    const refundedEscrow = await escrowManager.read.escrows([escrowId]);
    assert.strictEqual(refundedEscrow[5], 2); // REFUNDED
  });

  it("Ez du uzten escrow bat sortzen 0 ETH-rekin", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    if (!deployer.account || !buyer.account || !seller.account) throw new Error("No account");

    const escrowManager = await viem.deployContract("EscrowManager");

    await assert.rejects(
      async () => {
        await escrowManager.write.createEscrow(
          [1n, seller.account!.address, buyer.account!.address],
          { value: 0n, account: deployer.account! }
        );
      },
      /Zenbatekoa zero baino handiagoa izan behar da/
    );
  });

  it("Ez du uzten onlyOwner funtzioak baimenik gabe deitzerakoan", async function () {
    const { viem } = await network.create();
    const [deployer, buyer, seller] = await viem.getWalletClients();
    if (!deployer.account || !buyer.account || !seller.account) throw new Error("No account");

    const escrowManager = await viem.deployContract("EscrowManager");

    await escrowManager.write.createEscrow(
      [1n, seller.account.address, buyer.account.address],
      { value: parseEther("1"), account: deployer.account }
    );

    const escrowId = await escrowManager.read.orderToEscrow([1n]);

    await assert.rejects(
      async () => {
        await escrowManager.write.releaseFunds(
          [escrowId],
          { account: buyer.account! }
        );
      },
      /OwnableUnauthorizedAccount/
    );
  });
});