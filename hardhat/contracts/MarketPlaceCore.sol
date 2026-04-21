// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IEscrowManager
 * @dev EscrowManager kontratuaren interfazea
 */
interface IEscrowManager {
    function createEscrow(uint256 _orderId, address _seller, address _buyer) external payable;
    function releaseFunds(uint256 _escrowId) external;
    function refundBuyer(uint256 _escrowId) external;
    function openDispute(uint256 _escrowId) external;
    function getEscrowByOrder(uint256 _orderId) external view returns (uint256);
}

/**
 * @title MarketPlaceCore
 * @dev Produktuen zerrendaketa eta erosketa orkestratzeko kontratu nagusia
 */
contract MarketPlaceCore is Ownable, ReentrancyGuard {
    // Produktu bat zerrendatzeko egitura
    struct Listing {
        uint256 id;           // Identifikatzaile bakarra
        address seller;       // Saltzailearen helbidea
        uint256 tokenId;      // NFT-aren identifikatzailea
        uint256 price;        // Prezioa (ETH wei-tan)
        bool isActive;        // Zerrendatuta dagoen ala ez
        uint256 createdAt;    // Unix timestamp (sorrera-data)
    }

    // Erosketa baten jarraipena egiteko egitura
    struct Order {
        uint256 listingId;    // Zein produktu erosi den
        address buyer;        // Eroslearen helbidea
        uint256 amount;       // Ordaindutako zenbatekoa
        OrderStatus status;   // Egoera
        uint256 paidAt;       // Ordainketa-data
        uint256 completedAt;  // Burutze-data (jaso baieztatuta)
        string disputeReason; // Arrazoia (desadostasuna badago)
    }

    // Erosketaren egoera posibleak
    enum OrderStatus {
        CREATED,      // Sortu berria, oraindik ordaindu gabe
        FUNDED,       // Ordainduta, fondoak escrow-ean blokeatuta
        COMPLETED,    // Erosleak jaso baieztatu, fondoak askatuta
        DISPUTED,     // Desadostasuna irekita, ebazpenaren zain
        REFUNDED,     // Dirua itzuli zaio erosleari
        RESOLVED      // Arbitroak ebatzi du (alde baten alde)
    }

    // Kontratuaren aldagaiak
    IERC721 public nftContract;
    IEscrowManager public escrowManager;
    uint256 private _listingCounter;
    uint256 private _orderCounter;

    // Mapping-ak
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => uint256) public listingToOrder; // listingId -> orderId
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256[]) public userSales;

    // Event-ak
    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event OrderCreated(uint256 indexed orderId, uint256 indexed listingId, address indexed buyer, uint256 amount);
    event OrderConfirmed(uint256 indexed orderId, address indexed buyer);
    event OrderDisputed(uint256 indexed orderId, address indexed buyer, string reason);
    event EscrowManagerSet(address indexed escrowManager);

    constructor(address _nftContract) Ownable(msg.sender) {
        nftContract = IERC721(_nftContract);
        _listingCounter = 0;
        _orderCounter = 0;
    }

    /**
     * @dev EscrowManager kontratua ezarri (soilik jabeak)
     * @param _escrowManager EscrowManager kontratuaren helbidea
     */
    function setEscrowManager(address _escrowManager) external onlyOwner {
        require(_escrowManager != address(0), "Helbidea ezin da hutsa izan");
        escrowManager = IEscrowManager(_escrowManager);
        emit EscrowManagerSet(_escrowManager);
    }

    /**
     * @dev Produktu bat zerrendatu saltzeko
     * @param _tokenId NFT-aren identifikatzailea
     * @param _price Salneurria (wei-tan)
     */
    function listItem(uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Prezioa zero baino handiagoa izan behar da");
        require(nftContract.ownerOf(_tokenId) == msg.sender, "Ez duzu NFT honen jabetza");
        require(nftContract.isApprovedForAll(msg.sender, address(this)), "Kontratuak ez du NFTa transferitzeko baimenik");

        _listingCounter++;
        
        Listing memory newListing = Listing({
            id: _listingCounter,
            seller: msg.sender,
            tokenId: _tokenId,
            price: _price,
            isActive: true,
            createdAt: block.timestamp
        });

        listings[_listingCounter] = newListing;
        userListings[msg.sender].push(_listingCounter);

        emit ListingCreated(_listingCounter, msg.sender, _tokenId, _price);
    }

    /**
     * @dev Zerrendaketa bat ezeztatu
     * @param _listingId Zerrendaketaren identifikatzailea
     */
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Zerrendaketa ez dago aktibo");
        require(listing.seller == msg.sender, "Ez zara saltzailea");

        listing.isActive = false;

        emit ListingCancelled(_listingId, msg.sender);
    }

    /**
     * @dev Produktu bat erosi
     * @param _listingId Zerrendaketaren identifikatzailea
     */
    function purchaseItem(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Zerrendaketa ez dago aktibo");
        require(listing.seller != msg.sender, "Saltzaileak ezin du bere produktua erosi");
        require(msg.value == listing.price, "Zenbateko okerra bidali da");
        require(address(escrowManager) != address(0), "EscrowManager ez da ezarri");

        // Egoera eguneratu
        listing.isActive = false;

        // Transferitu NFT-a erosleari
        nftContract.transferFrom(listing.seller, msg.sender, listing.tokenId);

        // Sortu ordaina
        _orderCounter++;
        
        Order memory newOrder = Order({
            listingId: _listingId,
            buyer: msg.sender,
            amount: msg.value,
            status: OrderStatus.FUNDED,
            paidAt: block.timestamp,
            completedAt: 0,
            disputeReason: ""
        });

        orders[_orderCounter] = newOrder;
        listingToOrder[_listingId] = _orderCounter;
        userOrders[msg.sender].push(_orderCounter);
        userSales[listing.seller].push(_orderCounter);

        // EscrowManager-en dirua blokeatu
        escrowManager.createEscrow{value: msg.value}(_orderCounter, listing.seller, msg.sender);

        emit OrderCreated(_orderCounter, _listingId, msg.sender, msg.value);
    }

    /**
     * @dev Erosketa baieztatu (produktua jaso dela)
     * @param _orderId Ordenaren identifikatzailea
     */
    function confirmReceipt(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Soilik erosleak baiezta dezake jaso izana");
        require(order.status == OrderStatus.FUNDED, "Ordaina ez da ordaindutako egoeran");

        // Lortu escrow ID-a ordenatik
        uint256 escrowId = escrowManager.getEscrowByOrder(_orderId);
        require(escrowId != 0, "Ez dago escrowrik orden honentzat");

        // Askatu fondoak saltzaileari
        escrowManager.releaseFunds(escrowId);

        order.status = OrderStatus.COMPLETED;
        order.completedAt = block.timestamp;

        emit OrderConfirmed(_orderId, msg.sender);
    }

    /**
     * @dev Desadostasuna ireki
     * @param _orderId Ordenaren identifikatzailea
     * @param _reason Arrazoia
     */
    function openDispute(uint256 _orderId, string memory _reason) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Soilik erosleak ireki dezake desadostasuna");
        require(order.status == OrderStatus.FUNDED, "Ordaina ez da ordaindutako egoeran");
        require(block.timestamp <= order.paidAt + 14 days, "Desadostasuna irekitzeko epea iraungi da");

        // Lortu escrow ID-a ordenatik
        uint256 escrowId = escrowManager.getEscrowByOrder(_orderId);
        require(escrowId != 0, "Ez dago escrowrik orden honentzat");

        // Ireki desadostasuna EscrowManager-en
        escrowManager.openDispute(escrowId);

        order.status = OrderStatus.DISPUTED;
        order.disputeReason = _reason;

        emit OrderDisputed(_orderId, msg.sender, _reason);
    }

    /**
     * @dev Zerrendaketa aktibo guztiak lortu
     * @return listingIds aktibo dauden listing-en ID-ak
     */
    function getActiveListings() external view returns (uint256[] memory) {
        uint256[] memory activeListings = new uint256[](_listingCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _listingCounter; i++) {
            if (listings[i].isActive) {
                activeListings[count] = i;
                count++;
            }
        }
        
        // Array tamaina doitzea
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeListings[i];
        }
        
        return result;
    }

    /**
     * @dev Erabiltzaile baten zerrendaketak lortu
     * @param _seller Saltzailearen helbidea
     * @return listingIds
     */
    function getListingsBySeller(address _seller) external view returns (uint256[] memory) {
        return userListings[_seller];
    }

    /**
     * @dev Erabiltzaile baten erosketak lortu
     * @param _buyer Eroslearen helbidea
     * @return orderIds
     */
    function getOrdersByBuyer(address _buyer) external view returns (uint256[] memory) {
        return userOrders[_buyer];
    }

    /**
     * @dev Saltzaile baten salmentak lortu
     * @param _seller Saltzailearen helbidea
     * @return orderIds
     */
    function getSalesBySeller(address _seller) external view returns (uint256[] memory) {
        return userSales[_seller];
    }

    /**
     * @dev Zerrendaketa baten informazioa lortu
     * @param _listingId Zerrendaketaren identifikatzailea
     * @return Listing
     */
    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }

    /**
     * @dev Orden baten informazioa lortu
     * @param _orderId Ordenaren identifikatzailea
     * @return Order
     */
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
}