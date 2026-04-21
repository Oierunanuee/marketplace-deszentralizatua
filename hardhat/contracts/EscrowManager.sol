// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowManager
 * @dev Transakzioen fondoak blokeatu eta askatzeko kontratua
 */
contract EscrowManager is Ownable, ReentrancyGuard {
    // Escrow baten egoera posibleak
    enum EscrowStatus {
        FUNDED,      // Fondoak blokeatuta
        RELEASED,    // Fondoak saltzaileari askatuta
        REFUNDED,    // Fondoak erosleari itzulita
        DISPUTED     // Desadostasuna irekita
    }

    // Escrow baten egitura
    struct Escrow {
        uint256 id;           // Identifikatzaile bakarra
        uint256 orderId;      // MarketPlaceCore-ko ordenaren IDa
        address buyer;        // Eroslearen helbidea
        address seller;       // Saltzailearen helbidea
        uint256 amount;       // Blokeatutako zenbatekoa
        EscrowStatus status;  // Egoera
        uint256 createdAt;    // Sorrera-data
        uint256 releasedAt;   // Askapen-data (0 bada, ez da askatu)
    }

    // Kontratuaren aldagaiak
    uint256 private _escrowCounter;
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => uint256) public orderToEscrow; // orderId -> escrowId

    // Event-ak
    event EscrowCreated(uint256 indexed escrowId, uint256 indexed orderId, address indexed buyer, address seller, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId, address indexed buyer);

    constructor() Ownable(msg.sender) {
        _escrowCounter = 0;
    }

    /**
     * @dev Escrow berri bat sortu (erosleak dirua blokeatzeko)
     * @param _orderId MarketPlaceCore-ko ordenaren IDa
     * @param _seller Saltzailearen helbidea
     * @param _buyer Eroslearen helbidea
     */
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

    /**
     * @dev Fondoak saltzaileari askatu (erosleak jaso baieztatu duenean)
     * @param _escrowId Escrow-aren identifikatzailea
     */
    function releaseFunds(uint256 _escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.FUNDED, "Escrow-a ez da FUNDED egoeran");
        require(escrow.amount > 0, "Ez dago dirurik blokeatuta");

        escrow.status = EscrowStatus.RELEASED;
        escrow.releasedAt = block.timestamp;

        // Transferitu dirua saltzaileari
        payable(escrow.seller).transfer(escrow.amount);

        emit EscrowReleased(_escrowId, escrow.seller, escrow.amount);
    }

    /**
     * @dev Fondoak erosleari itzuli (desadostasuna edo epe-muga)
     * @param _escrowId Escrow-aren identifikatzailea
     */
    function refundBuyer(uint256 _escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.FUNDED, "Escrow-a ez da FUNDED egoeran");
        require(escrow.amount > 0, "Ez dago dirurik blokeatuta");

        escrow.status = EscrowStatus.REFUNDED;

        // Transferitu dirua erosleari
        payable(escrow.buyer).transfer(escrow.amount);

        emit EscrowRefunded(_escrowId, escrow.buyer, escrow.amount);
    }

    /**
     * @dev Desadostasuna ireki (fondoak blokeatuta mantendu)
     * @param _escrowId Escrow-aren identifikatzailea
     */
    function openDispute(uint256 _escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.FUNDED, "Escrow-a ez da FUNDED egoeran");

        escrow.status = EscrowStatus.DISPUTED;

        emit EscrowDisputed(_escrowId, escrow.buyer);
    }

    /**
     * @dev Escrow baten informazioa lortu
     * @param _escrowId Escrow-aren identifikatzailea
     * @return Escrow
     */
    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }

    /**
     * @dev Orden bati dagokion escrow-a lortu
     * @param _orderId Ordenaren identifikatzailea
     * @return escrowId
     */
    function getEscrowByOrder(uint256 _orderId) external view returns (uint256) {
        return orderToEscrow[_orderId];
    }

    /**
     * @dev Escrow baten egoera lortu
     * @param _escrowId Escrow-aren identifikatzailea
     * @return EscrowStatus
     */
    function getEscrowStatus(uint256 _escrowId) external view returns (EscrowStatus) {
        return escrows[_escrowId].status;
    }
}