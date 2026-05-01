// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IEscrowManager {
    function createEscrow(uint256 _orderId, address _seller, address _buyer) external payable;
    function releaseFunds(uint256 _escrowId) external;
    function refundBuyer(uint256 _escrowId) external;
    function openDispute(uint256 _escrowId) external;
    function getEscrowByOrder(uint256 _orderId) external view returns (uint256);
}

interface IDisputeResolver {
    function openDispute(uint256 _orderId, string memory _reason, string memory _evidenceCID) external;
    function resolveDispute(uint256 _disputeId, uint8 _status) external;
    function getDisputeByOrder(uint256 _orderId) external view returns (uint256);
}

contract MarketPlaceCore is Ownable, ReentrancyGuard {
    struct Listing {
        uint256 id;
        address seller;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        uint256 createdAt;
    }

    struct Order {
        uint256 listingId;
        address buyer;
        uint256 amount;
        OrderStatus status;
        uint256 paidAt;
        uint256 completedAt;
        string disputeReason;
    }

    enum OrderStatus {
        CREATED,
        FUNDED,
        COMPLETED,
        DISPUTED,
        REFUNDED,
        RESOLVED
    }

    IERC721 public nftContract;
    IEscrowManager public escrowManager;
    IDisputeResolver public disputeResolver;
    uint256 private _listingCounter;
    uint256 private _orderCounter;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => uint256) public listingToOrder;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256[]) public userSales;

    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event OrderCreated(uint256 indexed orderId, uint256 indexed listingId, address indexed buyer, uint256 amount);
    event OrderConfirmed(uint256 indexed orderId, address indexed buyer);
    event OrderDisputed(uint256 indexed orderId, address indexed buyer, string reason);
    event DisputeResolved(uint256 indexed orderId, bool favorBuyer);
    event EscrowManagerSet(address indexed escrowManager);
    event DisputeResolverSet(address indexed disputeResolver);

    constructor(address _nftContract) Ownable(msg.sender) {
        nftContract = IERC721(_nftContract);
        _listingCounter = 0;
        _orderCounter = 0;
    }

    function setEscrowManager(address _escrowManager) external onlyOwner {
        require(_escrowManager != address(0), "Helbidea ezin da hutsa izan");
        escrowManager = IEscrowManager(_escrowManager);
        emit EscrowManagerSet(_escrowManager);
    }

    function setDisputeResolver(address _disputeResolver) external onlyOwner {
        require(_disputeResolver != address(0), "Helbidea ezin da hutsa izan");
        disputeResolver = IDisputeResolver(_disputeResolver);
        emit DisputeResolverSet(_disputeResolver);
    }

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

    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Zerrendaketa ez dago aktibo");
        require(listing.seller == msg.sender, "Ez zara saltzailea");
        listing.isActive = false;
        emit ListingCancelled(_listingId, msg.sender);
    }

    function purchaseItem(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Zerrendaketa ez dago aktibo");
        require(listing.seller != msg.sender, "Saltzaileak ezin du bere produktua erosi");
        require(msg.value == listing.price, "Zenbateko okerra bidali da");
        require(address(escrowManager) != address(0), "EscrowManager ez da ezarri");

        listing.isActive = false;
        nftContract.transferFrom(listing.seller, msg.sender, listing.tokenId);

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

        escrowManager.createEscrow{value: msg.value}(_orderCounter, listing.seller, msg.sender);

        emit OrderCreated(_orderCounter, _listingId, msg.sender, msg.value);
    }

    function confirmReceipt(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Soilik erosleak baiezta dezake jaso izana");
        require(order.status == OrderStatus.FUNDED, "Ordaina ez da ordaindutako egoeran");

        uint256 escrowId = escrowManager.getEscrowByOrder(_orderId);
        require(escrowId != 0, "Ez dago escrowrik orden honentzat");

        escrowManager.releaseFunds(escrowId);

        order.status = OrderStatus.COMPLETED;
        order.completedAt = block.timestamp;

        emit OrderConfirmed(_orderId, msg.sender);
    }

    function openDispute(uint256 _orderId, string memory _reason) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.buyer == msg.sender, "Soilik erosleak ireki dezake desadostasuna");
        require(order.status == OrderStatus.FUNDED, "Ordaina ez da ordaindutako egoeran");
        require(block.timestamp <= order.paidAt + 14 days, "Desadostasuna irekitzeko epea iraungi da");

        uint256 escrowId = escrowManager.getEscrowByOrder(_orderId);
        require(escrowId != 0, "Ez dago escrowrik orden honentzat");

        escrowManager.openDispute(escrowId);

        if (address(disputeResolver) != address(0)) {
            disputeResolver.openDispute(_orderId, _reason, "");
        }

        order.status = OrderStatus.DISPUTED;
        order.disputeReason = _reason;

        emit OrderDisputed(_orderId, msg.sender, _reason);
    }

    function resolveDisputeAsAdmin(uint256 _orderId, bool favorBuyer) external onlyOwner nonReentrant {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.DISPUTED, "Ordena ez dago desadostasunean");

        uint256 escrowId = escrowManager.getEscrowByOrder(_orderId);
        require(escrowId != 0, "Ez dago escrowrik");

        if (favorBuyer) {
            escrowManager.refundBuyer(escrowId);
            order.status = OrderStatus.REFUNDED;
        } else {
            escrowManager.releaseFunds(escrowId);
            order.status = OrderStatus.RESOLVED;
        }

        if (address(disputeResolver) != address(0)) {
            uint256 disputeId = disputeResolver.getDisputeByOrder(_orderId);
            if (disputeId != 0) {
                disputeResolver.resolveDispute(disputeId, favorBuyer ? 1 : 2);
            }
        }

        emit DisputeResolved(_orderId, favorBuyer);
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256[] memory activeListings = new uint256[](_listingCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= _listingCounter; i++) {
            if (listings[i].isActive) {
                activeListings[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeListings[i];
        }

        return result;
    }

    function getOrderCount() external view returns (uint256) {
        return _orderCounter;
    }

    function getListingsBySeller(address _seller) external view returns (uint256[] memory) {
        return userListings[_seller];
    }

    function getOrdersByBuyer(address _buyer) external view returns (uint256[] memory) {
        return userOrders[_buyer];
    }

    function getSalesBySeller(address _seller) external view returns (uint256[] memory) {
        return userSales[_seller];
    }

    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }

    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
}