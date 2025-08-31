// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FHECore.sol";

contract VaultManager is ReentrancyGuard, Ownable {
    using FHECore for *;

    struct VaultMetadata {
        uint256 vaultId;
        address creator;
        string title;
        string description;
        string category;
        string websiteUrl;
        string logoUrl;
        uint256 creationTime;
        VaultStatus status;
        uint256 reputationScore;
        bool isVerified;
        VerificationLevel verificationLevel;
    }

    struct VaultAnalytics {
        bytes32 encryptedContributionCount;
        bytes32 encryptedAverageContribution;
        bytes32 encryptedMaxContribution;
        bytes32 encryptedMinContribution;
        uint256 totalTransactions;
        uint256 lastActivityTime;
    }

    struct Contributor {
        address wallet;
        bytes32 encryptedTotalContribution;
        uint256 firstContributionTime;
        uint256 lastContributionTime;
        uint256 contributionCount;
        bool isAnonymous;
    }

    enum VaultStatus { DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED }
    enum VerificationLevel { NONE, BASIC, STANDARD, PREMIUM, ENTERPRISE }

    mapping(uint256 => VaultMetadata) public vaultMetadata;
    mapping(uint256 => VaultAnalytics) public vaultAnalytics;
    mapping(uint256 => mapping(address => Contributor)) public contributors;
    mapping(uint256 => address[]) public vaultContributors;
    mapping(address => uint256[]) public userCreatedVaults;
    mapping(address => uint256[]) public userContributedVaults;
    mapping(string => uint256[]) public categoryVaults;
    
    uint256[] public featuredVaults;
    string[] public availableCategories;

    event VaultMetadataUpdated(uint256 indexed vaultId, address indexed creator);
    event VaultStatusChanged(uint256 indexed vaultId, VaultStatus oldStatus, VaultStatus newStatus);
    event VaultVerified(uint256 indexed vaultId, VerificationLevel level);
    event ContributorAdded(uint256 indexed vaultId, address indexed contributor);
    event AnalyticsUpdated(uint256 indexed vaultId);

    constructor() Ownable(msg.sender) {
        _initializeCategories();
    }

    function registerVault(
        uint256 vaultId,
        string memory title,
        string memory description,
        string memory category,
        string memory websiteUrl,
        string memory logoUrl
    ) external {
        require(bytes(title).length > 0 && bytes(title).length <= 200, "Invalid title length");
        require(bytes(description).length > 0 && bytes(description).length <= 2000, "Invalid description length");
        require(_isValidCategory(category), "Invalid category");

        VaultMetadata storage metadata = vaultMetadata[vaultId];
        require(metadata.creator == address(0), "Vault already registered");

        metadata.vaultId = vaultId;
        metadata.creator = msg.sender;
        metadata.title = title;
        metadata.description = description;
        metadata.category = category;
        metadata.websiteUrl = websiteUrl;
        metadata.logoUrl = logoUrl;
        metadata.creationTime = block.timestamp;
        metadata.status = VaultStatus.DRAFT;
        metadata.verificationLevel = VerificationLevel.NONE;

        VaultAnalytics storage analytics = vaultAnalytics[vaultId];
        analytics.encryptedContributionCount = FHECore.encrypt(0);
        analytics.encryptedAverageContribution = FHECore.encrypt(0);
        analytics.encryptedMaxContribution = FHECore.encrypt(0);
        analytics.encryptedMinContribution = FHECore.encrypt(type(uint256).max);

        userCreatedVaults[msg.sender].push(vaultId);
        categoryVaults[category].push(vaultId);

        emit VaultMetadataUpdated(vaultId, msg.sender);
    }

    function updateVaultMetadata(
        uint256 vaultId,
        string memory title,
        string memory description,
        string memory websiteUrl,
        string memory logoUrl
    ) external {
        VaultMetadata storage metadata = vaultMetadata[vaultId];
        require(metadata.creator == msg.sender, "Not vault creator");
        require(metadata.status != VaultStatus.COMPLETED, "Cannot update completed vault");

        if (bytes(title).length > 0) {
            require(bytes(title).length <= 200, "Title too long");
            metadata.title = title;
        }
        if (bytes(description).length > 0) {
            require(bytes(description).length <= 2000, "Description too long");
            metadata.description = description;
        }
        if (bytes(websiteUrl).length > 0) {
            metadata.websiteUrl = websiteUrl;
        }
        if (bytes(logoUrl).length > 0) {
            metadata.logoUrl = logoUrl;
        }

        emit VaultMetadataUpdated(vaultId, msg.sender);
    }

    function updateVaultStatus(uint256 vaultId, VaultStatus newStatus) external {
        VaultMetadata storage metadata = vaultMetadata[vaultId];
        require(metadata.creator == msg.sender, "Not vault creator");
        
        VaultStatus oldStatus = metadata.status;
        require(oldStatus != newStatus, "Status unchanged");
        require(_isValidStatusTransition(oldStatus, newStatus), "Invalid status transition");

        metadata.status = newStatus;
        emit VaultStatusChanged(vaultId, oldStatus, newStatus);
    }

    function recordContribution(
        uint256 vaultId,
        address contributor,
        bytes32 encryptedAmount,
        bool isAnonymous
    ) external {
        VaultMetadata storage metadata = vaultMetadata[vaultId];
        require(metadata.status == VaultStatus.ACTIVE, "Vault not active");

        Contributor storage contributorData = contributors[vaultId][contributor];
        
        if (contributorData.wallet == address(0)) {
            contributorData.wallet = contributor;
            contributorData.firstContributionTime = block.timestamp;
            contributorData.isAnonymous = isAnonymous;
            vaultContributors[vaultId].push(contributor);
            
            if (!_hasContributedBefore(contributor, vaultId)) {
                userContributedVaults[contributor].push(vaultId);
            }
            
            emit ContributorAdded(vaultId, contributor);
        }

        contributorData.encryptedTotalContribution = FHECore.addEncrypted(
            contributorData.encryptedTotalContribution,
            encryptedAmount
        );
        contributorData.lastContributionTime = block.timestamp;
        contributorData.contributionCount++;

        _updateAnalytics(vaultId, encryptedAmount);
    }

    function verifyVault(uint256 vaultId, VerificationLevel level) external onlyOwner {
        VaultMetadata storage metadata = vaultMetadata[vaultId];
        require(metadata.creator != address(0), "Vault not found");
        require(level > metadata.verificationLevel, "Cannot downgrade verification");

        metadata.verificationLevel = level;
        metadata.isVerified = true;
        
        uint256 bonusScore = uint256(level) * 20;
        metadata.reputationScore += bonusScore;

        emit VaultVerified(vaultId, level);
    }

    function updateReputationScore(uint256 vaultId, uint256 scoreChange, bool isIncrease) external onlyOwner {
        VaultMetadata storage metadata = vaultMetadata[vaultId];
        require(metadata.creator != address(0), "Vault not found");

        if (isIncrease) {
            metadata.reputationScore += scoreChange;
        } else {
            if (metadata.reputationScore >= scoreChange) {
                metadata.reputationScore -= scoreChange;
            } else {
                metadata.reputationScore = 0;
            }
        }
    }

    function addToFeatured(uint256 vaultId) external onlyOwner {
        VaultMetadata storage metadata = vaultMetadata[vaultId];
        require(metadata.creator != address(0), "Vault not found");
        require(metadata.isVerified, "Vault not verified");

        for (uint i = 0; i < featuredVaults.length; i++) {
            require(featuredVaults[i] != vaultId, "Already featured");
        }

        featuredVaults.push(vaultId);
    }

    function removeFromFeatured(uint256 vaultId) external onlyOwner {
        for (uint i = 0; i < featuredVaults.length; i++) {
            if (featuredVaults[i] == vaultId) {
                featuredVaults[i] = featuredVaults[featuredVaults.length - 1];
                featuredVaults.pop();
                break;
            }
        }
    }

    function getVaultMetadata(uint256 vaultId) external view returns (
        address creator,
        string memory title,
        string memory description,
        string memory category,
        string memory websiteUrl,
        string memory logoUrl,
        uint256 creationTime,
        VaultStatus status,
        uint256 reputationScore,
        bool isVerified,
        VerificationLevel verificationLevel
    ) {
        VaultMetadata storage metadata = vaultMetadata[vaultId];
        return (
            metadata.creator,
            metadata.title,
            metadata.description,
            metadata.category,
            metadata.websiteUrl,
            metadata.logoUrl,
            metadata.creationTime,
            metadata.status,
            metadata.reputationScore,
            metadata.isVerified,
            metadata.verificationLevel
        );
    }

    function getVaultAnalytics(uint256 vaultId) external view returns (
        bytes32 encryptedContributionCount,
        bytes32 encryptedAverageContribution,
        bytes32 encryptedMaxContribution,
        bytes32 encryptedMinContribution,
        uint256 totalTransactions,
        uint256 lastActivityTime
    ) {
        VaultAnalytics storage analytics = vaultAnalytics[vaultId];
        return (
            analytics.encryptedContributionCount,
            analytics.encryptedAverageContribution,
            analytics.encryptedMaxContribution,
            analytics.encryptedMinContribution,
            analytics.totalTransactions,
            analytics.lastActivityTime
        );
    }

    function getContributor(uint256 vaultId, address contributor) external view returns (
        bytes32 encryptedTotalContribution,
        uint256 firstContributionTime,
        uint256 lastContributionTime,
        uint256 contributionCount,
        bool isAnonymous
    ) {
        Contributor storage contributorData = contributors[vaultId][contributor];
        return (
            contributorData.encryptedTotalContribution,
            contributorData.firstContributionTime,
            contributorData.lastContributionTime,
            contributorData.contributionCount,
            contributorData.isAnonymous
        );
    }

    function getVaultsByCategory(string memory category) external view returns (uint256[] memory) {
        return categoryVaults[category];
    }

    function getUserCreatedVaults(address user) external view returns (uint256[] memory) {
        return userCreatedVaults[user];
    }

    function getUserContributedVaults(address user) external view returns (uint256[] memory) {
        return userContributedVaults[user];
    }

    function getFeaturedVaults() external view returns (uint256[] memory) {
        return featuredVaults;
    }

    function getAvailableCategories() external view returns (string[] memory) {
        return availableCategories;
    }

    function _updateAnalytics(uint256 vaultId, bytes32 encryptedAmount) internal {
        VaultAnalytics storage analytics = vaultAnalytics[vaultId];
        
        analytics.encryptedContributionCount = FHECore.addEncrypted(
            analytics.encryptedContributionCount,
            FHECore.encrypt(1)
        );
        
        analytics.totalTransactions++;
        analytics.lastActivityTime = block.timestamp;

        emit AnalyticsUpdated(vaultId);
    }

    function _isValidCategory(string memory category) internal view returns (bool) {
        for (uint i = 0; i < availableCategories.length; i++) {
            if (keccak256(abi.encodePacked(availableCategories[i])) == keccak256(abi.encodePacked(category))) {
                return true;
            }
        }
        return false;
    }

    function _isValidStatusTransition(VaultStatus from, VaultStatus to) internal pure returns (bool) {
        if (from == VaultStatus.DRAFT) {
            return to == VaultStatus.ACTIVE;
        }
        if (from == VaultStatus.ACTIVE) {
            return to == VaultStatus.PAUSED || to == VaultStatus.COMPLETED || to == VaultStatus.CANCELLED;
        }
        if (from == VaultStatus.PAUSED) {
            return to == VaultStatus.ACTIVE || to == VaultStatus.CANCELLED;
        }
        return false;
    }

    function _hasContributedBefore(address contributor, uint256 vaultId) internal view returns (bool) {
        uint256[] memory contributedVaults = userContributedVaults[contributor];
        for (uint i = 0; i < contributedVaults.length; i++) {
            if (contributedVaults[i] == vaultId) {
                return true;
            }
        }
        return false;
    }

    function _initializeCategories() internal {
        availableCategories.push("Technology");
        availableCategories.push("Healthcare");
        availableCategories.push("Finance");
        availableCategories.push("Education");
        availableCategories.push("Gaming");
        availableCategories.push("Art & Media");
        availableCategories.push("Environment");
        availableCategories.push("Social Impact");
        availableCategories.push("Research");
        availableCategories.push("Infrastructure");
    }
}