// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DisputeResolver
 * @dev Desadostasunak kudeatzeko kontratua
 */
contract DisputeResolver is Ownable, ReentrancyGuard {
    // Desadostasunaren egoera posibleak
    enum DisputeStatus {
        OPEN,                 // Irekita, oraindik ebazteke
        RESOLVED_FOR_BUYER,   // Arbitroak eroslearen alde ebatzi du
        RESOLVED_FOR_SELLER   // Arbitroak saltzailearen alde ebatzi du
    }

    // Desadostasunaren egitura
    struct Dispute {
        uint256 id;              // Identifikatzaile bakarra
        uint256 orderId;        // Zein ordenei dagokion
        address initiator;      // Nork ireki duen (eroslea)
        string reason;          // Arrazoiaren deskribapena
        string evidenceCID;     // Froga-fitxategien IPFS CID
        DisputeStatus status;   // Egoera
        uint256 createdAt;      // Irekiera-data
        uint256 resolvedAt;     // Ebazpen-data
    }

    // Kontratuaren aldagaiak
    uint256 private _disputeCounter;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256) public orderToDispute; // orderId -> disputeId

    // Event-ak
    event DisputeCreated(uint256 indexed disputeId, uint256 indexed orderId, address indexed initiator, string reason);
    event DisputeResolved(uint256 indexed disputeId, DisputeStatus status, address resolvedBy);

    constructor() Ownable(msg.sender) {
        _disputeCounter = 0;
    }

    /**
     * @dev Desadostasuna ireki
     * @param _orderId Ordenaren identifikatzailea
     * @param _reason Arrazoia
     * @param _evidenceCID Froga-fitxategien IPFS CID
     */
    function openDispute(uint256 _orderId, string memory _reason, string memory _evidenceCID) external onlyOwner nonReentrant {
        require(bytes(_reason).length > 0, "Arrazoia ezin da hutsa izan");
        require(orderToDispute[_orderId] == 0, "Desadostasuna dagoeneko irekita dago orden honentzat");

        _disputeCounter++;
        
        Dispute memory newDispute = Dispute({
            id: _disputeCounter,
            orderId: _orderId,
            initiator: msg.sender,
            reason: _reason,
            evidenceCID: _evidenceCID,
            status: DisputeStatus.OPEN,
            createdAt: block.timestamp,
            resolvedAt: 0
        });

        disputes[_disputeCounter] = newDispute;
        orderToDispute[_orderId] = _disputeCounter;

        emit DisputeCreated(_disputeCounter, _orderId, msg.sender, _reason);
    }

    /**
     * @dev Desadostasuna ebazten du arbitroak
     * @param _disputeId Desadostasunaren identifikatzailea
     * @param _status Ebazpenaren egoera (RESOLVED_FOR_BUYER edo RESOLVED_FOR_SELLER)
     */
    function resolveDispute(uint256 _disputeId, DisputeStatus _status) external onlyOwner nonReentrant {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.status == DisputeStatus.OPEN, "Desadostasuna ez dago irekita");
        require(_status == DisputeStatus.RESOLVED_FOR_BUYER || _status == DisputeStatus.RESOLVED_FOR_SELLER, "Egoera baliogabea");

        dispute.status = _status;
        dispute.resolvedAt = block.timestamp;

        emit DisputeResolved(_disputeId, _status, msg.sender);
    }

    /**
     * @dev Desadostasun baten informazioa lortu
     * @param _disputeId Desadostasunaren identifikatzailea
     * @return Dispute
     */
    function getDispute(uint256 _disputeId) external view returns (Dispute memory) {
        return disputes[_disputeId];
    }

    /**
     * @dev Orden bati dagokion desadostasuna lortu
     * @param _orderId Ordenaren identifikatzailea
     * @return disputeId
     */
    function getDisputeByOrder(uint256 _orderId) external view returns (uint256) {
        return orderToDispute[_orderId];
    }

    /**
     * @dev Desadostasunaren egoera lortu
     * @param _disputeId Desadostasunaren identifikatzailea
     * @return DisputeStatus
     */
    function getDisputeStatus(uint256 _disputeId) external view returns (DisputeStatus) {
        return disputes[_disputeId].status;
    }
}