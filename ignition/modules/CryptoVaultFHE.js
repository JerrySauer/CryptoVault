const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CryptoVaultFHEModule", (m) => {
  // Deploy the main CryptoVault contract with FHE support
  const cryptoVault = m.contract("CryptoVault");

  // Deploy VaultManager for advanced project management
  const vaultManager = m.contract("VaultManager");

  // Deploy ConfidentialDEX for private trading
  const confidentialDEX = m.contract("ConfidentialDEX");

  // Deploy production-ready tokens
  const cvToken = m.contract("MockToken", [
    "CryptoVault Protocol Token",
    "CVP",
    18,
    21000000 // 21 million tokens (Bitcoin-like supply)
  ]);

  const privacyToken = m.contract("MockToken", [
    "Privacy Token",
    "PRIV",
    18,
    100000000 // 100 million privacy tokens
  ]);

  const vaultToken = m.contract("MockToken", [
    "Vault Rewards Token",
    "VRT",
    18,
    50000000 // 50 million vault reward tokens
  ]);

  // Deploy mock stablecoins for testing
  const mockUSDT = m.contract("MockToken", [
    "Mock Tether USD",
    "USDT",
    6,
    1000000000 // 1 billion USDT
  ]);

  const mockDAI = m.contract("MockToken", [
    "Mock DAI Stablecoin", 
    "DAI",
    18,
    1000000000 // 1 billion DAI
  ]);

  return {
    cryptoVault,
    vaultManager,
    confidentialDEX,
    cvToken,
    privacyToken,
    vaultToken,
    mockUSDT,
    mockDAI,
  };
});