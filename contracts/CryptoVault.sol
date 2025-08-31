// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FHECore.sol";

contract CryptoVault is ReentrancyGuard, Ownable {
    using FHECore for *;

    struct TradingVault {
        uint256 id;
        address creator;
        string name;
        string description;
        uint256 targetAmount;
        uint256 deadline;
        bool isActive;
        bool isComplete;
        mapping(address => bytes32) encryptedContributions;
        mapping(address => bool) hasContributed;
        address[] contributors;
        uint256 totalRaised;
        VaultType vaultType;
        bytes32 encryptedTotalRaised;
    }

    enum VaultType { TRADING, FUNDING, DEX_POOL }

    struct SecretOrder {
        uint256 id;
        address trader;
        bytes32 encryptedAmount;
        bytes32 encryptedPrice;
        address tokenA;
        address tokenB;
        bool isBuyOrder;
        bool isActive;
        uint256 timestamp;
    }

    mapping(uint256 => TradingVault) public vaults;
    mapping(uint256 => SecretOrder) public orders;
    mapping(address => uint256[]) public userVaults;
    mapping(address => uint256[]) public userOrders;
    
    uint256 public nextVaultId = 1;
    uint256 public nextOrderId = 1;
    uint256 public constant MIN_VAULT_DURATION = 1 hours;
    uint256 public constant MAX_VAULT_DURATION = 365 days;

    event VaultCreated(uint256 indexed vaultId, address indexed creator, string name, uint256 targetAmount);
    event SecretContribution(uint256 indexed vaultId, address indexed contributor, bytes32 encryptedAmount);
    event OrderPlaced(uint256 indexed orderId, address indexed trader, bool isBuyOrder);
    event OrderExecuted(uint256 indexed orderId, address indexed executor);
    event VaultCompleted(uint256 indexed vaultId, uint256 totalRaised);
    event EmergencyWithdrawal(uint256 indexed vaultId, address indexed contributor, uint256 amount);

    constructor() Ownable(msg.sender) {}

    modifier validVault(uint256 vaultId) {
        require(vaultId > 0 && vaultId < nextVaultId, "Invalid vault ID");
        _;
    }

    modifier vaultActive(uint256 vaultId) {
        require(vaults[vaultId].isActive, "Vault not active");
        require(block.timestamp < vaults[vaultId].deadline, "Vault deadline passed");
        _;
    }

    function createTradingVault(
        string memory name,
        string memory description,
        uint256 targetAmount,
        uint256 duration,
        VaultType vaultType
    ) external returns (uint256) {
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid name length");
        require(bytes(description).length > 0 && bytes(description).length <= 1000, "Invalid description length");
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(duration >= MIN_VAULT_DURATION && duration <= MAX_VAULT_DURATION, "Invalid duration");

        uint256 vaultId = nextVaultId++;
        TradingVault storage vault = vaults[vaultId];
        
        vault.id = vaultId;
        vault.creator = msg.sender;
        vault.name = name;
        vault.description = description;
        vault.targetAmount = targetAmount;
        vault.deadline = block.timestamp + duration;
        vault.isActive = true;
        vault.isComplete = false;
        vault.vaultType = vaultType;
        vault.encryptedTotalRaised = FHECore.encrypt(0);

        userVaults[msg.sender].push(vaultId);

        emit VaultCreated(vaultId, msg.sender, name, targetAmount);
        return vaultId;
    }

    function makeSecretContribution(
        uint256 vaultId,
        bytes32 encryptedAmount,
        bytes calldata proof
    ) external payable validVault(vaultId) vaultActive(vaultId) nonReentrant {
        require(msg.value > 0, "Contribution must be greater than 0");
        require(FHECore.verifyEncryption(encryptedAmount, proof), "Invalid encryption proof");

        TradingVault storage vault = vaults[vaultId];
        
        if (!vault.hasContributed[msg.sender]) {
            vault.contributors.push(msg.sender);
            vault.hasContributed[msg.sender] = true;
        }

        vault.encryptedContributions[msg.sender] = FHECore.addEncrypted(
            vault.encryptedContributions[msg.sender],
            encryptedAmount
        );
        vault.totalRaised += msg.value;
        vault.encryptedTotalRaised = FHECore.addEncrypted(vault.encryptedTotalRaised, encryptedAmount);

        emit SecretContribution(vaultId, msg.sender, encryptedAmount);

        if (vault.totalRaised >= vault.targetAmount) {
            vault.isComplete = true;
            emit VaultCompleted(vaultId, vault.totalRaised);
        }
    }

    function placeSecretOrder(
        bytes32 encryptedAmount,
        bytes32 encryptedPrice,
        address tokenA,
        address tokenB,
        bool isBuyOrder,
        bytes calldata amountProof,
        bytes calldata priceProof
    ) external returns (uint256) {
        require(tokenA != tokenB, "Tokens must be different");
        require(FHECore.verifyEncryption(encryptedAmount, amountProof), "Invalid amount proof");
        require(FHECore.verifyEncryption(encryptedPrice, priceProof), "Invalid price proof");

        uint256 orderId = nextOrderId++;
        SecretOrder storage order = orders[orderId];

        order.id = orderId;
        order.trader = msg.sender;
        order.encryptedAmount = encryptedAmount;
        order.encryptedPrice = encryptedPrice;
        order.tokenA = tokenA;
        order.tokenB = tokenB;
        order.isBuyOrder = isBuyOrder;
        order.isActive = true;
        order.timestamp = block.timestamp;

        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, isBuyOrder);
        return orderId;
    }

    function executeOrder(uint256 orderId, bytes calldata proof) external nonReentrant {
        require(orderId > 0 && orderId < nextOrderId, "Invalid order ID");
        SecretOrder storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(order.trader != msg.sender, "Cannot execute own order");

        order.isActive = false;
        emit OrderExecuted(orderId, msg.sender);
    }

    function withdrawFromVault(uint256 vaultId) external validVault(vaultId) nonReentrant {
        TradingVault storage vault = vaults[vaultId];
        require(vault.hasContributed[msg.sender], "No contribution found");
        require(!vault.isActive || block.timestamp > vault.deadline, "Vault still active");

        bytes32 userContribution = vault.encryptedContributions[msg.sender];
        require(userContribution != 0, "No encrypted contribution found");

        vault.encryptedContributions[msg.sender] = bytes32(0);
        vault.hasContributed[msg.sender] = false;
    }

    function emergencyWithdrawFromVault(uint256 vaultId) external validVault(vaultId) nonReentrant {
        TradingVault storage vault = vaults[vaultId];
        require(vault.creator == msg.sender, "Only vault creator can emergency withdraw");
        require(vault.isActive, "Vault not active");

        vault.isActive = false;
        
        for (uint256 i = 0; i < vault.contributors.length; i++) {
            address contributor = vault.contributors[i];
            if (vault.hasContributed[contributor]) {
                vault.encryptedContributions[contributor] = bytes32(0);
                vault.hasContributed[contributor] = false;
            }
        }

        emit EmergencyWithdrawal(vaultId, msg.sender, vault.totalRaised);
    }

    function getVaultDetails(uint256 vaultId) external view validVault(vaultId) returns (
        address creator,
        string memory name,
        string memory description,
        uint256 targetAmount,
        uint256 deadline,
        bool isActive,
        bool isComplete,
        uint256 totalRaised,
        uint256 contributorsCount,
        VaultType vaultType
    ) {
        TradingVault storage vault = vaults[vaultId];
        return (
            vault.creator,
            vault.name,
            vault.description,
            vault.targetAmount,
            vault.deadline,
            vault.isActive,
            vault.isComplete,
            vault.totalRaised,
            vault.contributors.length,
            vault.vaultType
        );
    }

    function getUserEncryptedContribution(uint256 vaultId, address user) external view validVault(vaultId) returns (bytes32) {
        return vaults[vaultId].encryptedContributions[user];
    }

    function getActiveVaults() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextVaultId; i++) {
            if (vaults[i].isActive && block.timestamp < vaults[i].deadline) {
                activeCount++;
            }
        }

        uint256[] memory activeVaults = new uint256[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i < nextVaultId; i++) {
            if (vaults[i].isActive && block.timestamp < vaults[i].deadline) {
                activeVaults[currentIndex] = i;
                currentIndex++;
            }
        }

        return activeVaults;
    }

    function getUserVaults(address user) external view returns (uint256[] memory) {
        return userVaults[user];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    receive() external payable {}
}