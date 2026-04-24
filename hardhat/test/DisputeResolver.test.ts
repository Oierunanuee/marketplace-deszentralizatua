import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

describe("DisputeResolver", async function () {
  const { viem } = await network.create();

  it("Desadostasuna ireki eta ebatzi behar da", async function () {
    const [deployer] = await viem.getWalletClients();
    const disputeResolver = await viem.deployContract("DisputeResolver");

    const reason = "Produktua ez da iritsi";
    const evidenceCID = "ipfs://QmEvidence";
    const orderId = 1n;
    
    await disputeResolver.write.openDispute([orderId, reason, evidenceCID]);
    
    const disputeId = await disputeResolver.read.orderToDispute([orderId]);
    const dispute = await disputeResolver.read.disputes([disputeId]);
    
    // Tuple: [0]id, [1]orderId, [2]initiator, [3]reason, [4]evidenceCID, [5]status, [6]createdAt, [7]resolvedAt
    assert.equal(dispute[5], 0);  // status = 0 = OPEN
    assert.equal(dispute[3], reason);
    
    // Ebatzi (eroslearen alde = 1)
    await disputeResolver.write.resolveDispute([disputeId, 1]);
    
    const updatedDispute = await disputeResolver.read.disputes([disputeId]);
    assert.equal(updatedDispute[5], 1);  // status = 1 = RESOLVED_FOR_BUYER
  });
});