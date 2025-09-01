const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("CryptoVault", function () {
  async function deployCryptoVaultFixture() {
    const [owner, creator, investor1, investor2, investor3] = await ethers.getSigners();

    const CryptoVault = await ethers.getContractFactory("CryptoVault");
    const cryptoVault = await CryptoVault.deploy();

    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy("Test Token", "TEST", 18, 1000000);

    return { cryptoVault, mockToken, owner, creator, investor1, investor2, investor3 };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { cryptoVault, owner } = await loadFixture(deployCryptoVaultFixture);
      
      expect(await cryptoVault.owner()).to.equal(owner.address);
      expect(await cryptoVault.nextVaultId()).to.equal(1);
      expect(await cryptoVault.nextOrderId()).to.equal(1);
    });

    it("Should have correct constants", async function () {
      const { cryptoVault } = await loadFixture(deployCryptoVaultFixture);
      
      expect(await cryptoVault.MIN_VAULT_DURATION()).to.equal(3600); // 1 hour
      expect(await cryptoVault.MAX_VAULT_DURATION()).to.equal(31536000); // 365 days
    });
  });

  describe("Trading Vault Creation", function () {
    it("Should create a trading vault successfully", async function () {
      const { cryptoVault, creator } = await loadFixture(deployCryptoVaultFixture);
      
      const name = "AI Privacy Protocol";
      const description = "Revolutionary AI system with privacy preservation";
      const targetAmount = ethers.parseEther("100");
      const duration = 86400 * 30; // 30 days
      const vaultType = 0; // TRADING

      await expect(
        cryptoVault.connect(creator).createTradingVault(
          name,
          description,
          targetAmount,
          duration,
          vaultType
        )
      ).to.emit(cryptoVault, "VaultCreated")
        .withArgs(1, creator.address, name, targetAmount);

      const vaultDetails = await cryptoVault.getVaultDetails(1);
      expect(vaultDetails.creator).to.equal(creator.address);
      expect(vaultDetails.name).to.equal(name);
      expect(vaultDetails.description).to.equal(description);
      expect(vaultDetails.targetAmount).to.equal(targetAmount);
      expect(vaultDetails.isActive).to.be.true;
    });

    it("Should reject invalid vault parameters", async function () {
      const { cryptoVault, creator } = await loadFixture(deployCryptoVaultFixture);
      
      // Empty name
      await expect(
        cryptoVault.connect(creator).createTradingVault(
          "",
          "Description",
          ethers.parseEther("100"),
          86400,
          0
        )
      ).to.be.revertedWith("Invalid name length");

      // Zero target amount
      await expect(
        cryptoVault.connect(creator).createTradingVault(
          "Valid Name",
          "Description", 
          0,
          86400,
          0
        )
      ).to.be.revertedWith("Target amount must be greater than 0");

      // Duration too short
      await expect(
        cryptoVault.connect(creator).createTradingVault(
          "Valid Name",
          "Description",
          ethers.parseEther("100"),
          1800, // 30 minutes
          0
        )
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should track user vaults", async function () {
      const { cryptoVault, creator } = await loadFixture(deployCryptoVaultFixture);
      
      await cryptoVault.connect(creator).createTradingVault(
        "Vault 1",
        "Description 1",
        ethers.parseEther("100"),
        86400,
        0
      );

      await cryptoVault.connect(creator).createTradingVault(
        "Vault 2", 
        "Description 2",
        ethers.parseEther("200"),
        86400 * 2,
        1
      );

      const userVaults = await cryptoVault.getUserVaults(creator.address);
      expect(userVaults.length).to.equal(2);
      expect(userVaults[0]).to.equal(1);
      expect(userVaults[1]).to.equal(2);
    });
  });

  describe("Secret Contributions", function () {
    it("Should accept secret contributions", async function () {
      const { cryptoVault, creator, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      // Create vault
      await cryptoVault.connect(creator).createTradingVault(
        "Test Vault",
        "Test Description",
        ethers.parseEther("100"),
        86400,
        0
      );

      const contributionAmount = ethers.parseEther("5");
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("secret_amount_5"));
      const proof = ethers.toUtf8Bytes("valid_proof");

      await expect(
        cryptoVault.connect(investor1).makeSecretContribution(
          1,
          encryptedAmount,
          proof,
          { value: contributionAmount }
        )
      ).to.emit(cryptoVault, "SecretContribution")
        .withArgs(1, investor1.address, encryptedAmount);

      const vaultDetails = await cryptoVault.getVaultDetails(1);
      expect(vaultDetails.totalRaised).to.equal(contributionAmount);
      expect(vaultDetails.contributorsCount).to.equal(1);
    });

    it("Should complete vault when target is reached", async function () {
      const { cryptoVault, creator, investor1, investor2 } = await loadFixture(deployCryptoVaultFixture);
      
      const targetAmount = ethers.parseEther("10");
      
      // Create vault
      await cryptoVault.connect(creator).createTradingVault(
        "Test Vault",
        "Test Description", 
        targetAmount,
        86400,
        0
      );

      const contribution1 = ethers.parseEther("6");
      const contribution2 = ethers.parseEther("5");
      
      const encryptedAmount1 = ethers.keccak256(ethers.toUtf8Bytes("secret_6"));
      const encryptedAmount2 = ethers.keccak256(ethers.toUtf8Bytes("secret_5"));
      const proof = ethers.toUtf8Bytes("proof");

      // First contribution
      await cryptoVault.connect(investor1).makeSecretContribution(
        1, encryptedAmount1, proof, { value: contribution1 }
      );

      // Second contribution should complete the vault
      await expect(
        cryptoVault.connect(investor2).makeSecretContribution(
          1, encryptedAmount2, proof, { value: contribution2 }
        )
      ).to.emit(cryptoVault, "VaultCompleted")
        .withArgs(1, contribution1 + contribution2);

      const vaultDetails = await cryptoVault.getVaultDetails(1);
      expect(vaultDetails.isComplete).to.be.true;
    });

    it("Should reject contributions to inactive vaults", async function () {
      const { cryptoVault, creator, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("secret"));
      const proof = ethers.toUtf8Bytes("proof");

      await expect(
        cryptoVault.connect(investor1).makeSecretContribution(
          999, // Non-existent vault
          encryptedAmount,
          proof,
          { value: ethers.parseEther("1") }
        )
      ).to.be.revertedWith("Invalid vault ID");
    });
  });

  describe("Secret Orders", function () {
    it("Should place secret orders successfully", async function () {
      const { cryptoVault, mockToken, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("price"));
      const tokenA = await mockToken.getAddress();
      const tokenB = ethers.ZeroAddress; // ETH
      const proof = ethers.toUtf8Bytes("proof");

      await expect(
        cryptoVault.connect(investor1).placeSecretOrder(
          encryptedAmount,
          encryptedPrice,
          tokenA,
          tokenB,
          true, // Buy order
          proof,
          proof
        )
      ).to.emit(cryptoVault, "OrderPlaced")
        .withArgs(1, investor1.address, true);

      const userOrders = await cryptoVault.getUserOrders(investor1.address);
      expect(userOrders.length).to.equal(1);
      expect(userOrders[0]).to.equal(1);
    });

    it("Should reject orders with same tokens", async function () {
      const { cryptoVault, mockToken, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      const tokenAddress = await mockToken.getAddress();
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("price"));
      const proof = ethers.toUtf8Bytes("proof");

      await expect(
        cryptoVault.connect(investor1).placeSecretOrder(
          encryptedAmount,
          encryptedPrice,
          tokenAddress,
          tokenAddress, // Same token
          true,
          proof,
          proof
        )
      ).to.be.revertedWith("Tokens must be different");
    });

    it("Should execute orders successfully", async function () {
      const { cryptoVault, mockToken, investor1, investor2 } = await loadFixture(deployCryptoVaultFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("price"));
      const tokenA = await mockToken.getAddress();
      const tokenB = ethers.ZeroAddress;
      const proof = ethers.toUtf8Bytes("proof");

      // Place order
      await cryptoVault.connect(investor1).placeSecretOrder(
        encryptedAmount, encryptedPrice, tokenA, tokenB, true, proof, proof
      );

      // Execute order
      await expect(
        cryptoVault.connect(investor2).executeOrder(1, proof)
      ).to.emit(cryptoVault, "OrderExecuted")
        .withArgs(1, investor2.address);
    });
  });

  describe("Vault Management", function () {
    it("Should allow emergency withdrawal by creator", async function () {
      const { cryptoVault, creator, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      // Create vault and add contribution
      await cryptoVault.connect(creator).createTradingVault(
        "Test Vault", "Description", ethers.parseEther("100"), 86400, 0
      );

      const contribution = ethers.parseEther("5");
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("secret"));
      const proof = ethers.toUtf8Bytes("proof");

      await cryptoVault.connect(investor1).makeSecretContribution(
        1, encryptedAmount, proof, { value: contribution }
      );

      // Emergency withdrawal
      await expect(
        cryptoVault.connect(creator).emergencyWithdrawFromVault(1)
      ).to.emit(cryptoVault, "EmergencyWithdrawal");

      const vaultDetails = await cryptoVault.getVaultDetails(1);
      expect(vaultDetails.isActive).to.be.false;
    });

    it("Should reject emergency withdrawal by non-creator", async function () {
      const { cryptoVault, creator, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      await cryptoVault.connect(creator).createTradingVault(
        "Test Vault", "Description", ethers.parseEther("100"), 86400, 0
      );

      await expect(
        cryptoVault.connect(investor1).emergencyWithdrawFromVault(1)
      ).to.be.revertedWith("Only vault creator can emergency withdraw");
    });

    it("Should return active vaults", async function () {
      const { cryptoVault, creator } = await loadFixture(deployCryptoVaultFixture);
      
      // Create active vault
      await cryptoVault.connect(creator).createTradingVault(
        "Active Vault", "Description", ethers.parseEther("100"), 86400, 0
      );

      // Create and deactivate vault
      await cryptoVault.connect(creator).createTradingVault(
        "Inactive Vault", "Description", ethers.parseEther("100"), 86400, 0
      );
      await cryptoVault.connect(creator).emergencyWithdrawFromVault(2);

      const activeVaults = await cryptoVault.getActiveVaults();
      expect(activeVaults.length).to.equal(1);
      expect(activeVaults[0]).to.equal(1);
    });
  });

  describe("FHE Integration", function () {
    it("Should store encrypted contributions", async function () {
      const { cryptoVault, creator, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      await cryptoVault.connect(creator).createTradingVault(
        "Test Vault", "Description", ethers.parseEther("100"), 86400, 0
      );

      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("secret_amount"));
      const proof = ethers.toUtf8Bytes("proof");

      await cryptoVault.connect(investor1).makeSecretContribution(
        1, encryptedAmount, proof, { value: ethers.parseEther("5") }
      );

      const userContribution = await cryptoVault.getUserEncryptedContribution(1, investor1.address);
      expect(userContribution).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should handle multiple encrypted contributions from same user", async function () {
      const { cryptoVault, creator, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      await cryptoVault.connect(creator).createTradingVault(
        "Test Vault", "Description", ethers.parseEther("100"), 86400, 0
      );

      const encryptedAmount1 = ethers.keccak256(ethers.toUtf8Bytes("amount1"));
      const encryptedAmount2 = ethers.keccak256(ethers.toUtf8Bytes("amount2"));
      const proof = ethers.toUtf8Bytes("proof");

      // First contribution
      await cryptoVault.connect(investor1).makeSecretContribution(
        1, encryptedAmount1, proof, { value: ethers.parseEther("3") }
      );

      const contribution1 = await cryptoVault.getUserEncryptedContribution(1, investor1.address);

      // Second contribution
      await cryptoVault.connect(investor1).makeSecretContribution(
        1, encryptedAmount2, proof, { value: ethers.parseEther("2") }
      );

      const contribution2 = await cryptoVault.getUserEncryptedContribution(1, investor1.address);
      expect(contribution2).to.not.equal(contribution1); // Should be updated
      expect(contribution2).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");

      // Should still be only one contributor
      const vaultDetails = await cryptoVault.getVaultDetails(1);
      expect(vaultDetails.contributorsCount).to.equal(1);
      expect(vaultDetails.totalRaised).to.equal(ethers.parseEther("5"));
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to access all functions", async function () {
      const { cryptoVault, owner } = await loadFixture(deployCryptoVaultFixture);
      
      expect(await cryptoVault.owner()).to.equal(owner.address);
    });

    it("Should restrict vault creation parameters", async function () {
      const { cryptoVault, creator } = await loadFixture(deployCryptoVaultFixture);
      
      // Name too long
      const longName = "A".repeat(101);
      await expect(
        cryptoVault.connect(creator).createTradingVault(
          longName, "Description", ethers.parseEther("100"), 86400, 0
        )
      ).to.be.revertedWith("Invalid name length");

      // Description too long
      const longDescription = "A".repeat(1001);
      await expect(
        cryptoVault.connect(creator).createTradingVault(
          "Valid Name", longDescription, ethers.parseEther("100"), 86400, 0
        )
      ).to.be.revertedWith("Invalid description length");
    });
  });

  describe("Events", function () {
    it("Should emit correct events for vault lifecycle", async function () {
      const { cryptoVault, creator, investor1 } = await loadFixture(deployCryptoVaultFixture);
      
      // Vault creation
      await expect(
        cryptoVault.connect(creator).createTradingVault(
          "Test Vault", "Description", ethers.parseEther("10"), 86400, 0
        )
      ).to.emit(cryptoVault, "VaultCreated");

      // Secret contribution
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("secret"));
      const proof = ethers.toUtf8Bytes("proof");

      await expect(
        cryptoVault.connect(investor1).makeSecretContribution(
          1, encryptedAmount, proof, { value: ethers.parseEther("10") }
        )
      ).to.emit(cryptoVault, "SecretContribution")
       .and.to.emit(cryptoVault, "VaultCompleted");

      // Emergency withdrawal
      await expect(
        cryptoVault.connect(creator).emergencyWithdrawFromVault(1)
      ).to.emit(cryptoVault, "EmergencyWithdrawal");
    });
  });
});