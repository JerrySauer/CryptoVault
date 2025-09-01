const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CryptoVaultModule", (m) => {
  // Deploy the main CryptoVault contract
  const cryptoVault = m.contract("CryptoVault");

  // Deploy VaultManager for metadata and analytics
  const vaultManager = m.contract("VaultManager");

  // Deploy ConfidentialDEX for trading functionality
  const confidentialDEX = m.contract("ConfidentialDEX");

  // Deploy mock tokens for testing
  const mockTokenA = m.contract("MockToken", [
    "CryptoVault Token A",
    "CVTA",
    18,
    1000000 // 1 million tokens
  ]);

  const mockTokenB = m.contract("MockToken", [
    "CryptoVault Token B", 
    "CVTB",
    18,
    1000000
  ]);

  const mockUSDC = m.contract("MockToken", [
    "Mock USDC",
    "USDC",
    6,
    100000000 // 100 million USDC (6 decimals)
  ]);

  return {
    cryptoVault,
    vaultManager,
    confidentialDEX,
    mockTokenA,
    mockTokenB,
    mockUSDC,
  };
});