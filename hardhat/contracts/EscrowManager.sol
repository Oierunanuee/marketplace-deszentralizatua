// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowManager
 * @dev Transakzioen fondoak blokeatu eta askatzeko kontratua
 */
contract EscrowManager is Ownable, ReentrancyGuard {
    enum EscrowStatus {
        FUNDED,
        RELEASED,
        REFUNDED,
        DISPUTED
    }

    struct Escrow {
        uint256 id;
        uint256 orderId;
        address buyer;
        address seller;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
        uint256 releasedAt;
    }

    uint256 private _escrowCounter;
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => uint256) public orderToEscrow;

    event EscrowCreated(uint256 indexed escrowId, uint256 indexed orderId, address indexed buyer, address seller, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId, address indexed buyer);

    constructor() Ownable(msg.sender) {
        _escrowCounter = 0;
    }

    function createEscrow(uint256 _orderId, address _seller, address _buyer) external payable onlyOwner nonReentrant {
        require(msg.value > 0, "Zenbatekoa zero baino handiagoa izan behar da");
        require(_seller != address(0), "Saltzailearen helbidea ezin da hutsa izan");
        require(_buyer != address(0), "Eroslearen helbidea ezin da hutsa izan");

        _escrowCounter++;

        Escrow memory newEscrow = Escrow({
            id: _escrowCounter,
            orderId: _orderId,
            buyer: _buyer,
            seller: _seller,
            amount: msg.value,
            status: EscrowStatus.FUNDED,
            createdAt: block.timestamp,
            releasedAt: 0
        });

        escrows[_escrowCounter] = newEscrow;
        orderToEscrow[_orderId] = _escrowCounter;

        emit EscrowCreated(_escrowCounter, _orderId, _buyer, _seller, msg.value);
    }

    function releaseFunds(uint256 _escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.FUNDED || escrow.status == EscrowStatus.DISPUTED,
            "Escrow-a ez da egoera egokian"
        );
        require(escrow.amount > 0, "Ez dago dirurik blokeatuta");

        escrow.status = EscrowStatus.RELEASED;
        escrow.releasedAt = block.timestamp;

        payable(escrow.seller).transfer(escrow.amount);

        emit EscrowReleased(_escrowId, escrow.seller, escrow.amount);
    }

    function refundBuyer(uint256 _escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(
            escrow.status == EscrowStatus.FUNDED || escrow.status == EscrowStatus.DISPUTED,
            "Escrow-a ez da egoera egokian"
        );
        require(escrow.amount > 0, "Ez dago dirurik blokeatuta");

        escrow.status = EscrowStatus.REFUNDED;

        payable(escrow.buyer).transfer(escrow.amount);

        emit EscrowRefunded(_escrowId, escrow.buyer, escrow.amount);
    }

    function openDispute(uint256 _escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.FUNDED, "Escrow-a ez da FUNDED egoeran");

        escrow.status = EscrowStatus.DISPUTED;

        emit EscrowDisputed(_escrowId, escrow.buyer);
    }

    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }

    function getEscrowByOrder(uint256 _orderId) external view returns (uint256) {
        return orderToEscrow[_orderId];
    }

    function getEscrowStatus(uint256 _escrowId) external view returns (EscrowStatus) {
        return escrows[_escrowId].status;
    }
}