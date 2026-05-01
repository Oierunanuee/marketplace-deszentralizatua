// test/DisputeResolver.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("DisputeResolver", async function () {
  it("Desadostasuna ireki eta ebatzi behar da (eroslearen alde)", async function () {
    const { viem } = await network.create();
    const [deployer] = await viem.getWalletClients();
    if (!deployer.account) throw new Error("No account");

    const disputeResolver = await viem.deployContract("DisputeResolver");

    const reason = "Produktua ez da iritsi";
    const evidenceCID = "ipfs://QmEvidence";
    const orderId = 1n;

    await disputeResolver.write.openDispute([orderId, reason, evidenceCID]);

    const disputeId = await disputeResolver.read.orderToDispute([orderId]);
    const dispute = await disputeResolver.read.disputes([disputeId]);

    assert.strictEqual(dispute[5], 0); // OPEN
    assert.strictEqual(dispute[3], reason);

    await disputeResolver.write.resolveDispute([disputeId, 1]); // RESOLVED_FOR_BUYER

    const updatedDispute = await disputeResolver.read.disputes([disputeId]);
    assert.strictEqual(updatedDispute[5], 1); // RESOLVED_FOR_BUYER
  });

  it("Desadostasuna ireki eta ebatzi behar da (saltzailearen alde)", async function () {
    const { viem } = await network.create();
    const [deployer] = await viem.getWalletClients();
    if (!deployer.account) throw new Error("No account");

    const disputeResolver = await viem.deployContract("DisputeResolver");

    const reason = "Produktua bidali da";
    const evidenceCID = "ipfs://QmEvidence2";
    const orderId = 2n;

    await disputeResolver.write.openDispute([orderId, reason, evidenceCID]);

    const disputeId = await disputeResolver.read.orderToDispute([orderId]);

    await disputeResolver.write.resolveDispute([disputeId, 2]); // RESOLVED_FOR_SELLER

    const updatedDispute = await disputeResolver.read.disputes([disputeId]);
    assert.strictEqual(updatedDispute[5], 2); // RESOLVED_FOR_SELLER
  });
});