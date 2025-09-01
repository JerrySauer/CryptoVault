const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting CryptoVault deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  try {
    // Deploy main CryptoVault contract
    console.log("\n📦 Deploying CryptoVault...");
    const CryptoVault = await ethers.getContractFactory("CryptoVault");
    const cryptoVault = await CryptoVault.deploy();
    await cryptoVault.waitForDeployment();
    const cryptoVaultAddress = await cryptoVault.getAddress();
    console.log("✅ CryptoVault deployed to:", cryptoVaultAddress);

    // Deploy VaultManager
    console.log("\n📦 Deploying VaultManager...");
    const VaultManager = await ethers.getContractFactory("VaultManager");
    const vaultManager = await VaultManager.deploy();
    await vaultManager.waitForDeployment();
    const vaultManagerAddress = await vaultManager.getAddress();
    console.log("✅ VaultManager deployed to:", vaultManagerAddress);

    // Deploy ConfidentialDEX
    console.log("\n📦 Deploying ConfidentialDEX...");
    const ConfidentialDEX = await ethers.getContractFactory("ConfidentialDEX");
    const confidentialDEX = await ConfidentialDEX.deploy();
    await confidentialDEX.waitForDeployment();
    const confidentialDEXAddress = await confidentialDEX.getAddress();
    console.log("✅ ConfidentialDEX deployed to:", confidentialDEXAddress);

    // Deploy mock tokens for testing
    console.log("\n🪙 Deploying test tokens...");
    
    const MockToken = await ethers.getContractFactory("MockToken");
    
    const tokenA = await MockToken.deploy("CryptoVault Token A", "CVTA", 18, 1000000);
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log("✅ Token A deployed to:", tokenAAddress);

    const tokenB = await MockToken.deploy("CryptoVault Token B", "CVTB", 18, 1000000);
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log("✅ Token B deployed to:", tokenBAddress);

    const mockUSDC = await MockToken.deploy("Mock USDC", "USDC", 6, 100000000);
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ Mock USDC deployed to:", mockUSDCAddress);

    // Create initial trading vault for demo
    console.log("\n🏗️ Creating demo vault...");
    const vaultTx = await cryptoVault.createTradingVault(
      "AI Privacy Protocol Demo",
      "Demonstration of privacy-preserving AI system using Zama FHE encryption for confidential data processing",
      ethers.parseEther("100"), // 100 ETH target
      30 * 24 * 60 * 60, // 30 days
      0 // TRADING vault type
    );
    await vaultTx.wait();
    console.log("✅ Demo vault created with ID: 1");

    // Create liquidity pool in DEX
    console.log("\n💧 Creating DEX liquidity pool...");
    const poolTx = await confidentialDEX.createLiquidityPool(
      tokenAAddress,
      tokenBAddress,
      30 // 0.3% fee
    );
    await poolTx.wait();
    console.log("✅ Liquidity pool created for Token A/Token B");

    // Register demo vault with VaultManager
    console.log("\n📋 Registering vault metadata...");
    const metadataTx = await vaultManager.registerVault(
      1, // Vault ID
      "AI Privacy Protocol Demo",
      "Revolutionary demonstration of privacy-preserving artificial intelligence using Zama's Fully Homomorphic Encryption (FHE) technology. This project showcases how sensitive AI computations can be performed on encrypted data without compromising privacy.",
      "Technology",
      "https://cryptovault-demo.example.com",
      "https://cryptovault-demo.example.com/logo.png"
    );
    await metadataTx.wait();
    console.log("✅ Vault metadata registered");

    // Summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Contract Addresses:");
    console.log("   CryptoVault:", cryptoVaultAddress);
    console.log("   VaultManager:", vaultManagerAddress);
    console.log("   ConfidentialDEX:", confidentialDEXAddress);
    console.log("   Token A:", tokenAAddress);
    console.log("   Token B:", tokenBAddress);
    console.log("   Mock USDC:", mockUSDCAddress);

    console.log("\n🔧 Next Steps:");
    console.log("1. Update frontend configuration with contract addresses");
    console.log("2. Verify contracts on Etherscan if deploying to public network");
    console.log("3. Set up frontend environment variables");
    console.log("4. Test the application with the demo vault");

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        CryptoVault: cryptoVaultAddress,
        VaultManager: vaultManagerAddress,
        ConfidentialDEX: confidentialDEXAddress,
        TokenA: tokenAAddress,
        TokenB: tokenBAddress,
        MockUSDC: mockUSDCAddress
      },
      gasUsed: "Check transaction receipts for gas usage",
      demoVault: {
        id: 1,
        name: "AI Privacy Protocol Demo",
        target: "100 ETH"
      }
    };

    console.log("\n💾 Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });