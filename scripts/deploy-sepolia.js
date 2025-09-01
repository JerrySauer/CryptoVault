import { ethers } from "hardhat";
import fs from 'fs';

async function main() {
  console.log("🌐 Deploying CryptoVault to Sepolia testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance. You may need more Sepolia ETH from faucet");
    console.log("🚰 Get Sepolia ETH from: https://sepoliafaucet.com/");
  }

  const networkInfo = await ethers.provider.getNetwork();
  console.log("🌍 Network:", networkInfo.name, "Chain ID:", networkInfo.chainId);

  if (networkInfo.chainId !== 11155111n) {
    console.error("❌ Wrong network! Please switch to Sepolia (Chain ID: 11155111)");
    process.exit(1);
  }

  try {
    console.log("\n🚀 Starting deployment process...");

    // Deploy FHECore library first (if needed separately)
    console.log("\n📦 Deploying core contracts...");

    // Deploy main CryptoVault contract
    const CryptoVault = await ethers.getContractFactory("CryptoVault");
    console.log("⏳ Deploying CryptoVault...");
    const cryptoVault = await CryptoVault.deploy();
    await cryptoVault.waitForDeployment();
    const cryptoVaultAddress = await cryptoVault.getAddress();
    console.log("✅ CryptoVault deployed to:", cryptoVaultAddress);

    // Deploy VaultManager
    const VaultManager = await ethers.getContractFactory("VaultManager");
    console.log("⏳ Deploying VaultManager...");
    const vaultManager = await VaultManager.deploy();
    await vaultManager.waitForDeployment();
    const vaultManagerAddress = await vaultManager.getAddress();
    console.log("✅ VaultManager deployed to:", vaultManagerAddress);

    // Deploy ConfidentialDEX
    const ConfidentialDEX = await ethers.getContractFactory("ConfidentialDEX");
    console.log("⏳ Deploying ConfidentialDEX...");
    const confidentialDEX = await ConfidentialDEX.deploy();
    await confidentialDEX.waitForDeployment();
    const confidentialDEXAddress = await confidentialDEX.getAddress();
    console.log("✅ ConfidentialDEX deployed to:", confidentialDEXAddress);

    // Deploy protocol tokens
    console.log("\n🪙 Deploying protocol tokens...");
    const MockToken = await ethers.getContractFactory("MockToken");

    // Main protocol token
    console.log("⏳ Deploying CryptoVault Protocol Token...");
    const cvpToken = await MockToken.deploy("CryptoVault Protocol", "CVP", 18, 21000000);
    await cvpToken.waitForDeployment();
    const cvpTokenAddress = await cvpToken.getAddress();
    console.log("✅ CVP Token deployed to:", cvpTokenAddress);

    // Privacy token
    console.log("⏳ Deploying Privacy Token...");
    const privacyToken = await MockToken.deploy("Privacy Token", "PRIV", 18, 100000000);
    await privacyToken.waitForDeployment();
    const privacyTokenAddress = await privacyToken.getAddress();
    console.log("✅ PRIV Token deployed to:", privacyTokenAddress);

    // Vault rewards token
    console.log("⏳ Deploying Vault Rewards Token...");
    const vaultToken = await MockToken.deploy("Vault Rewards", "VRT", 18, 50000000);
    await vaultToken.waitForDeployment();
    const vaultTokenAddress = await vaultToken.getAddress();
    console.log("✅ VRT Token deployed to:", vaultTokenAddress);

    // Mock stablecoins for testing
    console.log("⏳ Deploying Mock USDT...");
    const mockUSDT = await MockToken.deploy("Mock Tether USD", "USDT", 6, 1000000000);
    await mockUSDT.waitForDeployment();
    const mockUSDTAddress = await mockUSDT.getAddress();
    console.log("✅ Mock USDT deployed to:", mockUSDTAddress);

    console.log("⏳ Deploying Mock DAI...");
    const mockDAI = await MockToken.deploy("Mock DAI", "DAI", 18, 1000000000);
    await mockDAI.waitForDeployment();
    const mockDAIAddress = await mockDAI.getAddress();
    console.log("✅ Mock DAI deployed to:", mockDAIAddress);

    // Wait for a few confirmations
    console.log("\n⏳ Waiting for confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    // Create initial setup
    console.log("\n🏗️ Setting up initial configuration...");

    // Create demo vaults
    console.log("Creating demo vaults...");
    
    // AI Privacy Protocol Vault
    const aiVaultTx = await cryptoVault.createTradingVault(
      "AI Privacy Protocol",
      "Revolutionary AI system that preserves user privacy while delivering personalized experiences using homomorphic encryption and secure multi-party computation.",
      ethers.parseEther("500"), // 500 ETH target
      45 * 24 * 60 * 60, // 45 days
      0 // TRADING type
    );
    await aiVaultTx.wait();

    // EcoChain Carbon Credits Vault  
    const ecoVaultTx = await cryptoVault.createTradingVault(
      "EcoChain Carbon Credits",
      "Blockchain-based carbon credit marketplace with verified environmental impact tracking and transparent offset mechanisms for sustainable future.",
      ethers.parseEther("300"), // 300 ETH target
      60 * 24 * 60 * 60, // 60 days
      1 // FUNDING type
    );
    await ecoVaultTx.wait();

    // MedSecure Data Platform Vault
    const medVaultTx = await cryptoVault.createTradingVault(
      "MedSecure Data Platform", 
      "Secure medical data sharing platform enabling patient-controlled health information with privacy-preserving analytics and regulatory compliance.",
      ethers.parseEther("750"), // 750 ETH target
      90 * 24 * 60 * 60, // 90 days
      0 // TRADING type
    );
    await medVaultTx.wait();

    console.log("✅ Demo vaults created (IDs: 1, 2, 3)");

    // Register vault metadata
    console.log("Registering vault metadata...");
    
    await vaultManager.registerVault(
      1,
      "AI Privacy Protocol",
      "Revolutionary artificial intelligence system that preserves user privacy while delivering personalized experiences. Uses advanced homomorphic encryption and secure multi-party computation to process sensitive data without exposure.",
      "Technology",
      "https://ai-privacy-protocol.demo",
      "https://cryptovault.demo/logos/ai-privacy.png"
    );

    await vaultManager.registerVault(
      2,
      "EcoChain Carbon Credits",
      "Comprehensive blockchain-based carbon credit marketplace featuring verified environmental impact tracking, transparent offset mechanisms, and integration with global sustainability initiatives.",
      "Environment",
      "https://ecochain-carbon.demo",
      "https://cryptovault.demo/logos/ecochain.png"
    );

    await vaultManager.registerVault(
      3,
      "MedSecure Data Platform",
      "Advanced secure medical data sharing platform that enables patient-controlled health information access with privacy-preserving analytics, regulatory compliance, and interoperability.",
      "Healthcare",
      "https://medsecure-platform.demo",
      "https://cryptovault.demo/logos/medsecure.png"
    );

    console.log("✅ Vault metadata registered");

    // Create DEX liquidity pools
    console.log("Creating DEX liquidity pools...");
    
    const pool1Tx = await confidentialDEX.createLiquidityPool(cvpTokenAddress, mockUSDTAddress, 30);
    await pool1Tx.wait();
    
    const pool2Tx = await confidentialDEX.createLiquidityPool(privacyTokenAddress, mockDAIAddress, 50);
    await pool2Tx.wait();
    
    const pool3Tx = await confidentialDEX.createLiquidityPool(vaultTokenAddress, cvpTokenAddress, 25);
    await pool3Tx.wait();

    console.log("✅ DEX liquidity pools created");

    // Final deployment summary
    const deploymentSummary = {
      network: "Sepolia Testnet",
      chainId: 11155111,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      gasPrice: (await ethers.provider.getFeeData()).gasPrice?.toString() || "N/A",
      contracts: {
        CryptoVault: cryptoVaultAddress,
        VaultManager: vaultManagerAddress,
        ConfidentialDEX: confidentialDEXAddress,
        CVPToken: cvpTokenAddress,
        PrivacyToken: privacyTokenAddress,
        VaultToken: vaultTokenAddress,
        MockUSDT: mockUSDTAddress,
        MockDAI: mockDAIAddress
      },
      demoVaults: [
        { id: 1, name: "AI Privacy Protocol", target: "500 ETH", duration: "45 days" },
        { id: 2, name: "EcoChain Carbon Credits", target: "300 ETH", duration: "60 days" },
        { id: 3, name: "MedSecure Data Platform", target: "750 ETH", duration: "90 days" }
      ],
      liquidityPools: [
        "CVP/USDT (0.3% fee)",
        "PRIV/DAI (0.5% fee)",
        "VRT/CVP (0.25% fee)"
      ]
    };

    console.log("\n🎉 Sepolia deployment completed successfully!");
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("====================");
    console.log("Network:", deploymentSummary.network);
    console.log("Chain ID:", deploymentSummary.chainId);
    console.log("Deployer:", deploymentSummary.deployer);
    console.log("Timestamp:", deploymentSummary.timestamp);
    console.log("\n📍 CONTRACT ADDRESSES:");
    Object.entries(deploymentSummary.contracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    console.log("\n🏗️ DEMO VAULTS CREATED:");
    deploymentSummary.demoVaults.forEach(vault => {
      console.log(`   ${vault.id}. ${vault.name} (${vault.target}, ${vault.duration})`);
    });

    console.log("\n💧 LIQUIDITY POOLS:");
    deploymentSummary.liquidityPools.forEach((pool, i) => {
      console.log(`   ${i + 1}. ${pool}`);
    });

    console.log("\n🔗 USEFUL LINKS:");
    console.log("   Sepolia Etherscan:", `https://sepolia.etherscan.io/address/${cryptoVaultAddress}`);
    console.log("   Sepolia Faucet:", "https://sepoliafaucet.com/");
    console.log("   OpenSea Testnet:", "https://testnets.opensea.io/");

    console.log("\n🚀 NEXT STEPS:");
    console.log("1. Update frontend environment variables with contract addresses");
    console.log("2. Verify contracts on Sepolia Etherscan");
    console.log("3. Test vault creation and investment flows");
    console.log("4. Test DEX trading functionality");
    console.log("5. Share testnet deployment with team");

    // Save deployment data to file
    const deploymentFile = `./deployments/sepolia-${Date.now()}.json`;
    
    try {
      if (!fs.existsSync('./deployments')) {
        fs.mkdirSync('./deployments');
      }
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentSummary, null, 2));
      console.log(`\n💾 Deployment data saved to: ${deploymentFile}`);
    } catch (error) {
      console.log("⚠️  Could not save deployment file:", error.message);
    }

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Suggestion: Get more Sepolia ETH from https://sepoliafaucet.com/");
    }
    
    if (error.message.includes("nonce")) {
      console.log("\n💡 Suggestion: Reset your MetaMask account or wait for transaction confirmation");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  });