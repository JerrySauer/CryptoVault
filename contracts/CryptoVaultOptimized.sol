// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FHECore.sol";

/**
 * @title CryptoVaultOptimized
 * @dev Gas-optimized version of CryptoVault with reduced storage and computation costs
 */
contract CryptoVaultOptimized is ReentrancyGuard, Ownable {
    using FHECore for *;

    // Packed struct to minimize storage slots
    struct TradingVault {
        address creator;           // 20 bytes
        uint96 targetAmount;       // 12 bytes - fits in same slot as creator
        uint32 deadline;           // 4 bytes 
        uint16 id;                 // 2 bytes
        uint8 vaultType;           // 1 byte
        bool isActive;             // 1 byte - fits in same slot
        // Total: 2 storage slots instead of multiple
        uint128 totalRaised;       // 16 bytes - separate slot
        bytes32 encryptedTotalRaised;
        string name;               // Dynamic storage
        string description;        // Dynamic storage
        mapping(address => bytes32) encryptedContributions;
        mapping(address => bool) hasContributed;
        address[] contributors;
    }

    // Packed order struct
    struct SecretOrder {
        address trader;            // 20 bytes
        uint64 timestamp;          // 8 bytes - fits in same slot
        uint32 id;                 // 4 bytes - fits in same slot
        bool isBuyOrder;           // 1 byte
        bool isActive;             // 1 byte
        // Total: 1 storage slot
        bytes32 encryptedAmount;
        bytes32 encryptedPrice;
        address tokenA;
        address tokenB;
    }

    mapping(uint256 => TradingVault) public vaults;
    mapping(uint256 => SecretOrder) public orders;
    mapping(address => uint256[]) public userVaults;
    mapping(address => uint256[]) public userOrders;
    
    uint256 public nextVaultId = 1;
    uint256 public nextOrderId = 1;
    
    // Constants to save gas
    uint256 private constant MIN_VAULT_DURATION = 1 hours;
    uint256 private constant MAX_VAULT_DURATION = 365 days;
    uint256 private constant MAX_NAME_LENGTH = 100;
    uint256 private constant MAX_DESC_LENGTH = 1000;

    // Events with indexed parameters for efficient filtering
    event VaultCreated(uint256 indexed vaultId, address indexed creator, uint256 targetAmount);
    event SecretContribution(uint256 indexed vaultId, address indexed contributor);
    event OrderPlaced(uint256 indexed orderId, address indexed trader, bool isBuyOrder);
    event OrderExecuted(uint256 indexed orderId, address indexed executor);
    event VaultCompleted(uint256 indexed vaultId, uint256 totalRaised);

    constructor() Ownable(msg.sender) {}

    modifier validVault(uint256 vaultId) {
        require(vaultId != 0 && vaultId < nextVaultId, "Invalid vault");
        _;
    }

    modifier vaultActive(uint256 vaultId) {
        TradingVault storage vault = vaults[vaultId];
        require(vault.isActive && block.timestamp < vault.deadline, "Vault inactive");
        _;
    }

    /**
     * @dev Gas-optimized vault creation with packed parameters
     */
    function createTradingVault(
        string calldata name,
        string calldata description,
        uint96 targetAmount,
        uint32 duration,
        uint8 vaultType
    ) external returns (uint256) {
        // Gas-optimized validation
        require(bytes(name).length > 0 && bytes(name).length <= MAX_NAME_LENGTH, "Invalid name");
        require(bytes(description).length > 0 && bytes(description).length <= MAX_DESC_LENGTH, "Invalid desc");
        require(targetAmount > 0, "Invalid target");
        require(duration >= MIN_VAULT_DURATION && duration <= MAX_VAULT_DURATION, "Invalid duration");

        uint256 vaultId = nextVaultId++;
        TradingVault storage vault = vaults[vaultId];
        
        // Pack data efficiently
        vault.id = uint16(vaultId);
        vault.creator = msg.sender;
        vault.targetAmount = targetAmount;
        vault.deadline = uint32(block.timestamp + duration);
        vault.vaultType = vaultType;
        vault.isActive = true;
        vault.name = name;
        vault.description = description;
        vault.encryptedTotalRaised = FHECore.encrypt(0);

        userVaults[msg.sender].push(vaultId);

        emit VaultCreated(vaultId, msg.sender, targetAmount);
        return vaultId;
    }

    /**
     * @dev Gas-optimized contribution with minimal storage updates
     */
    function makeSecretContribution(
        uint256 vaultId,
        bytes32 encryptedAmount,
        bytes calldata proof
    ) external payable validVault(vaultId) vaultActive(vaultId) nonReentrant {
        require(msg.value > 0, "No contribution");
        require(FHECore.verifyEncryption(encryptedAmount, proof), "Invalid proof");

        TradingVault storage vault = vaults[vaultId];
        
        // Optimize storage updates
        if (!vault.hasContributed[msg.sender]) {
            vault.contributors.push(msg.sender);
            vault.hasContributed[msg.sender] = true;
        }

        vault.encryptedContributions[msg.sender] = FHECore.addEncrypted(
            vault.encryptedContributions[msg.sender],
            encryptedAmount
        );
        
        // Use unchecked for gas savings where overflow is impossible
        unchecked {
            vault.totalRaised += uint128(msg.value);
        }
        vault.encryptedTotalRaised = FHECore.addEncrypted(vault.encryptedTotalRaised, encryptedAmount);

        emit SecretContribution(vaultId, msg.sender);

        if (vault.totalRaised >= vault.targetAmount) {
            vault.isActive = false; // Mark complete by setting inactive
            emit VaultCompleted(vaultId, vault.totalRaised);
        }
    }

    /**
     * @dev Gas-optimized order placement with packed struct
     */
    function placeSecretOrder(
        bytes32 encryptedAmount,
        bytes32 encryptedPrice,
        address tokenA,
        address tokenB,
        bool isBuyOrder,
        bytes calldata amountProof,
        bytes calldata priceProof
    ) external returns (uint256) {
        require(tokenA != tokenB, "Same tokens");
        require(FHECore.verifyEncryption(encryptedAmount, amountProof), "Invalid amount proof");
        require(FHECore.verifyEncryption(encryptedPrice, priceProof), "Invalid price proof");

        uint256 orderId = nextOrderId++;
        SecretOrder storage order = orders[orderId];

        // Pack data efficiently
        order.id = uint32(orderId);
        order.trader = msg.sender;
        order.timestamp = uint64(block.timestamp);
        order.isBuyOrder = isBuyOrder;
        order.isActive = true;
        order.encryptedAmount = encryptedAmount;
        order.encryptedPrice = encryptedPrice;
        order.tokenA = tokenA;
        order.tokenB = tokenB;

        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, isBuyOrder);
        return orderId;
    }

    /**
     * @dev Gas-optimized order execution
     */
    function executeOrder(uint256 orderId, bytes calldata proof) external nonReentrant {
        require(orderId != 0 && orderId < nextOrderId, "Invalid order");
        SecretOrder storage order = orders[orderId];
        require(order.isActive && order.trader != msg.sender, "Cannot execute");

        order.isActive = false;
        emit OrderExecuted(orderId, msg.sender);
    }

    /**
     * @dev Batch withdrawal to reduce gas costs
     */
    function batchWithdrawFromVaults(uint256[] calldata vaultIds) external nonReentrant {
        uint256 length = vaultIds.length;
        for (uint256 i = 0; i < length;) {
            _withdrawFromVault(vaultIds[i]);
            unchecked { ++i; }
        }
    }

    function withdrawFromVault(uint256 vaultId) external nonReentrant {
        _withdrawFromVault(vaultId);
    }

    function _withdrawFromVault(uint256 vaultId) internal validVault(vaultId) {
        TradingVault storage vault = vaults[vaultId];
        require(vault.hasContributed[msg.sender], "No contribution");
        require(!vault.isActive || block.timestamp > vault.deadline, "Still active");

        vault.encryptedContributions[msg.sender] = bytes32(0);
        vault.hasContributed[msg.sender] = false;
    }

    /**
     * @dev Emergency withdrawal with gas optimization
     */
    function emergencyWithdrawFromVault(uint256 vaultId) external validVault(vaultId) nonReentrant {
        TradingVault storage vault = vaults[vaultId];
        require(vault.creator == msg.sender, "Not creator");
        require(vault.isActive, "Not active");

        vault.isActive = false;
        
        // Gas-optimized contributor reset
        address[] memory contributors = vault.contributors;
        uint256 length = contributors.length;
        
        for (uint256 i = 0; i < length;) {
            address contributor = contributors[i];
            vault.encryptedContributions[contributor] = bytes32(0);
            vault.hasContributed[contributor] = false;
            unchecked { ++i; }
        }

        emit VaultCompleted(vaultId, vault.totalRaised);
    }

    // View functions with gas optimization
    function getVaultDetails(uint256 vaultId) external view validVault(vaultId) returns (
        address creator,
        string memory name,
        string memory description,
        uint256 targetAmount,
        uint256 deadline,
        bool isActive,
        uint256 totalRaised,
        uint256 contributorsCount,
        uint256 vaultType
    ) {
        TradingVault storage vault = vaults[vaultId];
        return (
            vault.creator,
            vault.name,
            vault.description,
            vault.targetAmount,
            vault.deadline,
            vault.isActive,
            vault.totalRaised,
            vault.contributors.length,
            vault.vaultType
        );
    }

    function getUserEncryptedContribution(uint256 vaultId, address user) external view returns (bytes32) {
        return vaults[vaultId].encryptedContributions[user];
    }

    /**
     * @dev Gas-optimized active vaults retrieval with pagination
     */
    function getActiveVaults(uint256 offset, uint256 limit) external view returns (uint256[] memory activeVaults) {
        require(limit > 0 && limit <= 100, "Invalid limit"); // Prevent gas issues
        
        uint256 activeCount = 0;
        uint256 maxId = nextVaultId;
        
        // Count active vaults
        for (uint256 i = 1; i < maxId;) {
            if (vaults[i].isActive && block.timestamp < vaults[i].deadline) {
                activeCount++;
            }
            unchecked { ++i; }
        }
        
        if (activeCount == 0 || offset >= activeCount) {
            return new uint256[](0);
        }
        
        uint256 resultLength = activeCount - offset;
        if (resultLength > limit) {
            resultLength = limit;
        }
        
        activeVaults = new uint256[](resultLength);
        uint256 currentIndex = 0;
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i < maxId && resultIndex < resultLength;) {
            if (vaults[i].isActive && block.timestamp < vaults[i].deadline) {
                if (currentIndex >= offset) {
                    activeVaults[resultIndex] = i;
                    resultIndex++;
                }
                currentIndex++;
            }
            unchecked { ++i; }
        }
    }

    function getUserVaults(address user) external view returns (uint256[] memory) {
        return userVaults[user];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    receive() external payable {}
}