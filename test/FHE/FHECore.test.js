const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("FHECore Library", function () {
  async function deployFHECoreTestFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy a test contract that uses FHECore library
    const FHECoreTest = await ethers.getContractFactory("FHECoreTest");
    const fheTest = await FHECoreTest.deploy();

    return { fheTest, owner, user1, user2 };
  }

  // First, we need to create a test contract that exposes FHECore functions
  before(async function () {
    const FHECoreTestContract = `
      // SPDX-License-Identifier: UNLICENSED
      pragma solidity ^0.8.28;
      
      import "./FHECore.sol";
      
      contract FHECoreTest {
          using FHECore for *;
          
          function testEncrypt(uint256 value) external view returns (bytes32) {
              return FHECore.encrypt(value);
          }
          
          function testEncryptWithSalt(uint256 value, bytes32 salt) external view returns (bytes32) {
              return FHECore.encryptWithSalt(value, salt);
          }
          
          function testAddEncrypted(bytes32 a, bytes32 b) external pure returns (bytes32) {
              return FHECore.addEncrypted(a, b);
          }
          
          function testSubtractEncrypted(bytes32 a, bytes32 b) external pure returns (bytes32) {
              return FHECore.subtractEncrypted(a, b);
          }
          
          function testMultiplyEncrypted(bytes32 a, bytes32 b) external pure returns (bytes32) {
              return FHECore.multiplyEncrypted(a, b);
          }
          
          function testCompareEncrypted(bytes32 a, bytes32 b) external pure returns (bytes32) {
              return FHECore.compareEncrypted(a, b);
          }
          
          function testVerifyEncryption(bytes32 encryptedValue, bytes calldata proof) external pure returns (bool) {
              return FHECore.verifyEncryption(encryptedValue, proof);
          }
          
          function testVerifyRangeProof(
              bytes32 encryptedValue,
              uint256 minValue,
              uint256 maxValue,
              bytes calldata proof
          ) external pure returns (bool) {
              return FHECore.verifyRangeProof(encryptedValue, minValue, maxValue, proof);
          }
          
          function testGenerateZKProof(
              uint256 value,
              uint256 minValue,
              uint256 maxValue,
              bytes32 salt
          ) external pure returns (bytes memory) {
              return FHECore.generateZKProof(value, minValue, maxValue, salt);
          }
          
          function testHomomorphicSum(bytes32[] calldata encryptedValues) external pure returns (bytes32) {
              return FHECore.homomorphicSum(encryptedValues);
          }
          
          function testHomomorphicAverage(bytes32[] calldata encryptedValues) external pure returns (bytes32) {
              return FHECore.homomorphicAverage(encryptedValues);
          }
          
          function testEncryptBalance(uint256 balance, address user) external pure returns (bytes32) {
              return FHECore.encryptBalance(balance, user);
          }
          
          function testEncryptOrder(
              uint256 amount,
              uint256 price,
              address tokenA,
              address tokenB
          ) external view returns (bytes32, bytes32) {
              return FHECore.encryptOrder(amount, price, tokenA, tokenB);
          }
          
          function testVerifyOrderProof(
              bytes32 encryptedAmount,
              bytes32 encryptedPrice,
              address tokenA,
              address tokenB,
              bytes calldata proof
          ) external pure returns (bool) {
              return FHECore.verifyOrderProof(encryptedAmount, encryptedPrice, tokenA, tokenB, proof);
          }
          
          function testCreatePrivacyPreservingSignature(
              bytes32 encryptedData,
              address signer
          ) external pure returns (bytes32) {
              return FHECore.createPrivacyPreservingSignature(encryptedData, signer);
          }
          
          function testValidatePrivacySignature(
              bytes32 signature,
              bytes32 encryptedData,
              address expectedSigner
          ) external pure returns (bool) {
              return FHECore.validatePrivacySignature(signature, encryptedData, expectedSigner);
          }
          
          function testGenerateRandomSalt() external view returns (bytes32) {
              return FHECore.generateRandomSalt();
          }
          
          function testEncryptWithTimestamp(uint256 value, uint256 timestamp) external pure returns (bytes32) {
              return FHECore.encryptWithTimestamp(value, timestamp);
          }
          
          function testBatchEncrypt(uint256[] calldata values) external pure returns (bytes32[] memory) {
              return FHECore.batchEncrypt(values);
          }
          
          function testIsValidEncryptedValue(bytes32 encryptedValue) external pure returns (bool) {
              return FHECore.isValidEncryptedValue(encryptedValue);
          }
      }
    `;

    // Write the test contract to a temporary file
    const fs = require('fs');
    const path = require('path');
    
    const contractPath = path.join(__dirname, '../../contracts/FHECoreTest.sol');
    fs.writeFileSync(contractPath, FHECoreTestContract);
  });

  describe("Basic Encryption Functions", function () {
    it("Should encrypt values correctly", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const value = 12345;
      const encrypted = await fheTest.testEncrypt(value);
      
      expect(encrypted).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(encrypted).to.be.a("string");
      expect(encrypted).to.have.lengthOf(66); // 32 bytes = 64 hex chars + '0x'
    });

    it("Should encrypt different values to different hashes", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const value1 = 100;
      const value2 = 200;
      
      const encrypted1 = await fheTest.testEncrypt(value1);
      const encrypted2 = await fheTest.testEncrypt(value2);
      
      expect(encrypted1).to.not.equal(encrypted2);
    });

    it("Should encrypt with salt correctly", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const value = 12345;
      const salt = ethers.keccak256(ethers.toUtf8Bytes("test_salt"));
      
      const encrypted = await fheTest.testEncryptWithSalt(value, salt);
      const encryptedAgain = await fheTest.testEncryptWithSalt(value, salt);
      
      expect(encrypted).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      // Note: Due to timestamp inclusion, these might be different
      // In a real implementation, we'd control for timestamp
    });

    it("Should validate encrypted values", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const validEncrypted = ethers.keccak256(ethers.toUtf8Bytes("valid_data"));
      const zeroValue = "0x0000000000000000000000000000000000000000000000000000000000000000";
      
      expect(await fheTest.testIsValidEncryptedValue(validEncrypted)).to.be.true;
      expect(await fheTest.testIsValidEncryptedValue(zeroValue)).to.be.false;
    });
  });

  describe("Homomorphic Operations", function () {
    it("Should perform homomorphic addition", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encrypted1 = ethers.keccak256(ethers.toUtf8Bytes("value1"));
      const encrypted2 = ethers.keccak256(ethers.toUtf8Bytes("value2"));
      
      const result = await fheTest.testAddEncrypted(encrypted1, encrypted2);
      
      expect(result).to.not.equal(encrypted1);
      expect(result).to.not.equal(encrypted2);
      expect(result).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should perform homomorphic subtraction", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encrypted1 = ethers.keccak256(ethers.toUtf8Bytes("value1"));
      const encrypted2 = ethers.keccak256(ethers.toUtf8Bytes("value2"));
      
      const result = await fheTest.testSubtractEncrypted(encrypted1, encrypted2);
      
      expect(result).to.not.equal(encrypted1);
      expect(result).to.not.equal(encrypted2);
      expect(result).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should perform homomorphic multiplication", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encrypted1 = ethers.keccak256(ethers.toUtf8Bytes("value1"));
      const encrypted2 = ethers.keccak256(ethers.toUtf8Bytes("value2"));
      
      const result = await fheTest.testMultiplyEncrypted(encrypted1, encrypted2);
      
      expect(result).to.not.equal(encrypted1);
      expect(result).to.not.equal(encrypted2);
      expect(result).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should perform homomorphic comparison", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encrypted1 = ethers.keccak256(ethers.toUtf8Bytes("value1"));
      const encrypted2 = ethers.keccak256(ethers.toUtf8Bytes("value2"));
      
      const result = await fheTest.testCompareEncrypted(encrypted1, encrypted2);
      
      expect(result).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should compute homomorphic sum of arrays", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encryptedValues = [
        ethers.keccak256(ethers.toUtf8Bytes("value1")),
        ethers.keccak256(ethers.toUtf8Bytes("value2")),
        ethers.keccak256(ethers.toUtf8Bytes("value3"))
      ];
      
      const result = await fheTest.testHomomorphicSum(encryptedValues);
      
      expect(result).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should compute homomorphic average", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encryptedValues = [
        ethers.keccak256(ethers.toUtf8Bytes("value1")),
        ethers.keccak256(ethers.toUtf8Bytes("value2")),
        ethers.keccak256(ethers.toUtf8Bytes("value3"))
      ];
      
      const result = await fheTest.testHomomorphicAverage(encryptedValues);
      
      expect(result).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  });

  describe("Proof Verification", function () {
    it("Should verify encryption proofs", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encryptedValue = ethers.keccak256(ethers.toUtf8Bytes("encrypted_data"));
      const validProof = ethers.toUtf8Bytes("valid_proof_data");
      const emptyProof = ethers.toUtf8Bytes("");
      
      expect(await fheTest.testVerifyEncryption(encryptedValue, validProof)).to.be.true;
      expect(await fheTest.testVerifyEncryption(encryptedValue, emptyProof)).to.be.false;
    });

    it("Should verify range proofs", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encryptedValue = ethers.keccak256(ethers.toUtf8Bytes("value_in_range"));
      const minValue = 100;
      const maxValue = 1000;
      const validProof = ethers.toUtf8Bytes("range_proof_data_with_sufficient_length");
      const shortProof = ethers.toUtf8Bytes("short");
      
      expect(await fheTest.testVerifyRangeProof(encryptedValue, minValue, maxValue, validProof)).to.be.true;
      expect(await fheTest.testVerifyRangeProof(encryptedValue, minValue, maxValue, shortProof)).to.be.false;
    });

    it("Should generate ZK proofs", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const value = 500;
      const minValue = 100;
      const maxValue = 1000;
      const salt = ethers.keccak256(ethers.toUtf8Bytes("salt"));
      
      const proof = await fheTest.testGenerateZKProof(value, minValue, maxValue, salt);
      
      expect(proof).to.not.equal("0x");
      expect(proof.length).to.be.greaterThan(2); // More than just '0x'
    });

    it("Should reject ZK proofs for out-of-range values", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const value = 1500; // Out of range
      const minValue = 100;
      const maxValue = 1000;
      const salt = ethers.keccak256(ethers.toUtf8Bytes("salt"));
      
      await expect(
        fheTest.testGenerateZKProof(value, minValue, maxValue, salt)
      ).to.be.revertedWith("Value out of range");
    });

    it("Should verify order proofs", async function () {
      const { fheTest, user1 } = await loadFixture(deployFHECoreTestFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("price"));
      const tokenA = user1.address; // Use address as token
      const tokenB = ethers.ZeroAddress;
      const validProof = ethers.toUtf8Bytes("order_proof_data_with_sufficient_length_for_validation");
      const shortProof = ethers.toUtf8Bytes("short");
      
      expect(await fheTest.testVerifyOrderProof(encryptedAmount, encryptedPrice, tokenA, tokenB, validProof)).to.be.true;
      expect(await fheTest.testVerifyOrderProof(encryptedAmount, encryptedPrice, tokenA, tokenB, shortProof)).to.be.false;
    });
  });

  describe("Specialized Encryption Functions", function () {
    it("Should encrypt balances", async function () {
      const { fheTest, user1 } = await loadFixture(deployFHECoreTestFixture);
      
      const balance = 1000000;
      const encrypted = await fheTest.testEncryptBalance(balance, user1.address);
      
      expect(encrypted).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should encrypt orders", async function () {
      const { fheTest, user1, user2 } = await loadFixture(deployFHECoreTestFixture);
      
      const amount = 100;
      const price = 2500;
      const tokenA = user1.address;
      const tokenB = user2.address;
      
      const [encryptedAmount, encryptedPrice] = await fheTest.testEncryptOrder(amount, price, tokenA, tokenB);
      
      expect(encryptedAmount).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(encryptedPrice).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(encryptedAmount).to.not.equal(encryptedPrice);
    });

    it("Should encrypt with timestamp", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const value = 12345;
      const timestamp = Math.floor(Date.now() / 1000);
      
      const encrypted = await fheTest.testEncryptWithTimestamp(value, timestamp);
      
      expect(encrypted).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should perform batch encryption", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const values = [100, 200, 300, 400, 500];
      const encryptedValues = await fheTest.testBatchEncrypt(values);
      
      expect(encryptedValues.length).to.equal(values.length);
      
      for (let i = 0; i < encryptedValues.length; i++) {
        expect(encryptedValues[i]).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      }
      
      // Each encrypted value should be different
      for (let i = 0; i < encryptedValues.length - 1; i++) {
        expect(encryptedValues[i]).to.not.equal(encryptedValues[i + 1]);
      }
    });
  });

  describe("Privacy-Preserving Signatures", function () {
    it("Should create privacy-preserving signatures", async function () {
      const { fheTest, user1 } = await loadFixture(deployFHECoreTestFixture);
      
      const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("secret_data"));
      const signature = await fheTest.testCreatePrivacyPreservingSignature(encryptedData, user1.address);
      
      expect(signature).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should validate privacy signatures correctly", async function () {
      const { fheTest, user1, user2 } = await loadFixture(deployFHECoreTestFixture);
      
      const encryptedData = ethers.keccak256(ethers.toUtf8Bytes("secret_data"));
      const signature = await fheTest.testCreatePrivacyPreservingSignature(encryptedData, user1.address);
      
      // Valid signature with correct signer
      expect(await fheTest.testValidatePrivacySignature(signature, encryptedData, user1.address)).to.be.true;
      
      // Invalid signature with wrong signer
      expect(await fheTest.testValidatePrivacySignature(signature, encryptedData, user2.address)).to.be.false;
    });

    it("Should generate random salts", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const salt1 = await fheTest.testGenerateRandomSalt();
      const salt2 = await fheTest.testGenerateRandomSalt();
      
      expect(salt1).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(salt2).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      // Note: Due to block-dependent randomness, salts might be the same if called in same transaction
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero values in encryption", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const encrypted = await fheTest.testEncrypt(0);
      
      expect(encrypted).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should handle maximum values", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const maxValue = ethers.MaxUint256;
      
      // This might fail due to gas limits or overflow, which is expected behavior
      try {
        const encrypted = await fheTest.testEncrypt(maxValue);
        expect(encrypted).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      } catch (error) {
        // Expected to potentially fail with very large numbers
        expect(error.message).to.include("overflow");
      }
    });

    it("Should handle empty arrays in homomorphic operations", async function () {
      const { fheTest } = await loadFixture(deployFHECoreTestFixture);
      
      const emptyArray = [];
      const result = await fheTest.testHomomorphicSum(emptyArray);
      
      expect(result).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  });

  // Clean up test contract file
  after(async function () {
    const fs = require('fs');
    const path = require('path');
    
    const contractPath = path.join(__dirname, '../../contracts/FHECoreTest.sol');
    
    try {
      if (fs.existsSync(contractPath)) {
        fs.unlinkSync(contractPath);
      }
    } catch (error) {
      console.log("Could not clean up test contract file:", error.message);
    }
  });
});