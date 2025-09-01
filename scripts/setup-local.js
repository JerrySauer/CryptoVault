const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting up local CryptoVault development environment...");
  
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log("👥 Using accounts:");
  console.log("   Deployer:", deployer.address);
  console.log("   User 1:", user1.address);
  console.log("   User 2:", user2.address);
  console.log("   User 3:", user3.address);

  try {
    // Get deployed contracts (assumes they're already deployed)
    console.log("\n🔍 Locating deployed contracts...");
    
    const CryptoVault = await ethers.getContractFactory("CryptoVault");
    const VaultManager = await ethers.getContractFactory("VaultManager");
    const ConfidentialDEX = await ethers.getContractFactory("ConfidentialDEX");
    const MockToken = await ethers.getContractFactory("MockToken");

    // For local setup, we'll deploy fresh contracts
    console.log("\n📦 Deploying fresh contracts for local development...");
    
    const cryptoVault = await CryptoVault.deploy();
    await cryptoVault.waitForDeployment();
    const cryptoVaultAddress = await cryptoVault.getAddress();
    console.log("✅ CryptoVault:", cryptoVaultAddress);

    const vaultManager = await VaultManager.deploy();
    await vaultManager.waitForDeployment();
    const vaultManagerAddress = await vaultManager.getAddress();
    console.log("✅ VaultManager:", vaultManagerAddress);

    const confidentialDEX = await ConfidentialDEX.deploy();
    await confidentialDEX.waitForDeployment();
    const confidentialDEXAddress = await confidentialDEX.getAddress();
    console.log("✅ ConfidentialDEX:", confidentialDEXAddress);

    // Deploy test tokens with more supply for local testing
    const cvpToken = await MockToken.deploy("CryptoVault Protocol", "CVP", 18, 21000000);
    await cvpToken.waitForDeployment();
    const cvpTokenAddress = await cvpToken.getAddress();

    const privToken = await MockToken.deploy("Privacy Token", "PRIV", 18, 100000000);
    await privToken.waitForDeployment();
    const privTokenAddress = await privToken.getAddress();

    const testUSDC = await MockToken.deploy("Test USDC", "USDC", 6, 1000000000);
    await testUSDC.waitForDeployment();
    const testUSDCAddress = await testUSDC.getAddress();

    const testDAI = await MockToken.deploy("Test DAI", "DAI", 18, 1000000000);
    await testDAI.waitForDeployment();
    const testDAIAddress = await testDAI.getAddress();

    console.log("✅ All tokens deployed");

    // Create comprehensive test data
    console.log("\n🏗️ Creating test vaults and data...");

    // Create multiple test vaults with different characteristics
    const vaultData = [
      {
        name: "AI Privacy Labs",
        description: "Advanced artificial intelligence research focused on privacy-preserving machine learning algorithms and secure multi-party computation protocols.",
        target: ethers.parseEther("250"),
        duration: 30 * 24 * 60 * 60,
        type: 0,
        category: "Technology"
      },
      {
        name: "Green Energy Initiative",
        description: "Revolutionary solar panel technology with 40% higher efficiency and integrated blockchain-based energy trading platform for peer-to-peer energy exchange.",
        target: ethers.parseEther("150"),
        duration: 45 * 24 * 60 * 60,
        type: 1,
        category: "Environment"
      },
      {
        name: "DeFi Insurance Protocol",
        description: "Decentralized insurance platform providing comprehensive coverage for DeFi protocols, smart contract risks, and yield farming strategies.",
        target: ethers.parseEther("400"),
        duration: 60 * 24 * 60 * 60,
        type: 0,
        category: "Finance"
      },
      {
        name: "HealthChain Network",
        description: "Secure healthcare data sharing network enabling interoperability between hospitals, researchers, and patients while maintaining privacy compliance.",
        target: ethers.parseEther("300"),
        duration: 90 * 24 * 60 * 60,
        type: 1,
        category: "Healthcare"
      },
      {
        name: "Web3 Education Platform",
        description: "Interactive learning platform for blockchain development, smart contract programming, and DeFi protocols with hands-on coding exercises.",
        target: ethers.parseEther("100"),
        duration: 20 * 24 * 60 * 60,
        type: 0,
        category: "Education"
      }
    ];

    for (let i = 0; i < vaultData.length; i++) {
      const vault = vaultData[i];
      
      const tx = await cryptoVault.connect(i < 3 ? user1 : user2).createTradingVault(
        vault.name,
        vault.description,
        vault.target,
        vault.duration,
        vault.type
      );
      await tx.wait();

      // Register metadata
      await vaultManager.registerVault(
        i + 1,
        vault.name,
        vault.description,
        vault.category,
        `https://demo-${i + 1}.cryptovault.local`,
        `https://assets.cryptovault.local/logo-${i + 1}.png`
      );

      console.log(`✅ Created vault ${i + 1}: ${vault.name}`);
    }

    // Create DEX liquidity pools
    console.log("\n💧 Setting up DEX liquidity pools...");
    
    const pools = [
      { tokenA: cvpTokenAddress, tokenB: testUSDCAddress, fee: 30, name: "CVP/USDC" },
      { tokenA: privTokenAddress, tokenB: testDAIAddress, fee: 50, name: "PRIV/DAI" },
      { tokenA: cvpTokenAddress, tokenB: privTokenAddress, fee: 25, name: "CVP/PRIV" },
      { tokenA: testUSDCAddress, tokenB: testDAIAddress, fee: 5, name: "USDC/DAI" }
    ];

    for (const pool of pools) {
      const tx = await confidentialDEX.createLiquidityPool(pool.tokenA, pool.tokenB, pool.fee);
      await tx.wait();
      console.log(`✅ Created pool: ${pool.name} (${pool.fee/100}% fee)`);
    }

    // Distribute test tokens to users
    console.log("\n💰 Distributing test tokens...");
    
    const users = [user1, user2, user3];
    for (const user of users) {
      // CVP tokens
      await cvpToken.transfer(user.address, ethers.parseEther("10000"));
      // PRIV tokens
      await privToken.transfer(user.address, ethers.parseEther("50000"));
      // USDC
      await testUSDC.transfer(user.address, ethers.parseUnits("25000", 6));
      // DAI
      await testDAI.transfer(user.address, ethers.parseEther("25000"));
      
      console.log(`✅ Tokens distributed to ${user.address}`);
    }

    // Make some test contributions to vaults
    console.log("\n🔒 Making test contributions...");
    
    const contributions = [
      { vaultId: 1, user: user1, amount: ethers.parseEther("15") },
      { vaultId: 1, user: user2, amount: ethers.parseEther("25") },
      { vaultId: 2, user: user3, amount: ethers.parseEther("8") },
      { vaultId: 3, user: user1, amount: ethers.parseEther("50") },
      { vaultId: 4, user: user2, amount: ethers.parseEther("35") },
    ];

    for (const contrib of contributions) {
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes(`secret_${contrib.amount}`));
      const proof = ethers.toUtf8Bytes("local_test_proof");
      
      const tx = await cryptoVault.connect(contrib.user).makeSecretContribution(
        contrib.vaultId,
        encryptedAmount,
        proof,
        { value: contrib.amount }
      );
      await tx.wait();
      
      console.log(`✅ ${contrib.user.address.slice(0, 8)}... contributed ${ethers.formatEther(contrib.amount)} ETH to vault ${contrib.vaultId}`);
    }

    // Add some liquidity to DEX pools
    console.log("\n🏊 Adding test liquidity to DEX...");
    
    // Add liquidity for CVP/USDC pool
    const poolId1 = ethers.keccak256(ethers.solidityPacked(["address", "address"], [cvpTokenAddress, testUSDCAddress]));
    const encryptedLiquidityA = ethers.keccak256(ethers.toUtf8Bytes("liquidity_amount_A"));
    const encryptedLiquidityB = ethers.keccak256(ethers.toUtf8Bytes("liquidity_amount_B"));
    const liquidityProof = ethers.toUtf8Bytes("liquidity_proof");

    await confidentialDEX.connect(user1).addLiquidity(
      poolId1,
      encryptedLiquidityA,
      encryptedLiquidityB,
      liquidityProof,
      liquidityProof
    );

    console.log("✅ Added liquidity to CVP/USDC pool");

    // Place some test orders
    console.log("\n📋 Placing test orders...");
    
    const encryptedOrderAmount = ethers.keccak256(ethers.toUtf8Bytes("order_amount"));
    const encryptedOrderPrice = ethers.keccak256(ethers.toUtf8Bytes("order_price"));
    const orderProof = ethers.toUtf8Bytes("order_proof");

    await confidentialDEX.connect(user2).placeLimitOrder(
      poolId1,
      encryptedOrderAmount,
      encryptedOrderPrice,
      1, // LIMIT order
      true, // Buy order
      orderProof,
      orderProof
    );

    console.log("✅ Placed test buy order");

    // Generate summary
    const setupSummary = {
      environment: "Local Development",
      timestamp: new Date().toISOString(),
      contracts: {
        CryptoVault: cryptoVaultAddress,
        VaultManager: vaultManagerAddress,
        ConfidentialDEX: confidentialDEXAddress,
        CVPToken: cvpTokenAddress,
        PrivacyToken: privTokenAddress,
        TestUSDC: testUSDCAddress,
        TestDAI: testDAIAddress
      },
      testData: {
        vaults: vaultData.length,
        contributions: contributions.length,
        liquidityPools: pools.length,
        testOrders: 1,
        distributedTokens: users.length * 4
      },
      users: {
        deployer: deployer.address,
        user1: user1.address,
        user2: user2.address,
        user3: user3.address
      }
    };

    console.log("\n🎉 Local development environment setup completed!");
    console.log("\n📋 SETUP SUMMARY");
    console.log("================");
    console.log("Environment:", setupSummary.environment);
    console.log("Timestamp:", setupSummary.timestamp);
    
    console.log("\n📍 CONTRACT ADDRESSES:");
    Object.entries(setupSummary.contracts).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    console.log("\n📊 TEST DATA CREATED:");
    console.log(`   ${setupSummary.testData.vaults} vaults with various categories`);
    console.log(`   ${setupSummary.testData.contributions} test contributions`);
    console.log(`   ${setupSummary.testData.liquidityPools} DEX liquidity pools`);
    console.log(`   ${setupSummary.testData.testOrders} test order(s)`);
    console.log(`   Token distribution to ${setupSummary.testData.distributedTokens / 4} users`);

    console.log("\n👥 TEST ACCOUNTS:");
    Object.entries(setupSummary.users).forEach(([role, address]) => {
      console.log(`   ${role}: ${address}`);
    });

    console.log("\n🚀 READY FOR DEVELOPMENT:");
    console.log("1. Frontend can now connect to local contracts");
    console.log("2. Test users have tokens for interaction");
    console.log("3. Demo vaults are available for investment");
    console.log("4. DEX pools are ready for trading");
    console.log("5. All FHE encryption features are active");

    console.log("\n🔧 FRONTEND SETUP:");
    console.log("Update your frontend .env file with:");
    console.log(`REACT_APP_CRYPTOVAULT_ADDRESS=${cryptoVaultAddress}`);
    console.log(`REACT_APP_VAULT_MANAGER_ADDRESS=${vaultManagerAddress}`);
    console.log(`REACT_APP_CONFIDENTIAL_DEX_ADDRESS=${confidentialDEXAddress}`);
    console.log(`REACT_APP_CVP_TOKEN_ADDRESS=${cvpTokenAddress}`);
    console.log("REACT_APP_NETWORK=localhost");
    console.log("REACT_APP_CHAIN_ID=31337");

    // Save setup info
    const fs = require('fs');
    try {
      if (!fs.existsSync('./deployments')) {
        fs.mkdirSync('./deployments');
      }
      fs.writeFileSync('./deployments/local-setup.json', JSON.stringify(setupSummary, null, 2));
      console.log("\n💾 Setup data saved to: ./deployments/local-setup.json");
    } catch (error) {
      console.log("⚠️  Could not save setup file:", error.message);
    }

  } catch (error) {
    console.error("\n❌ LOCAL SETUP FAILED:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup script failed:", error);
    process.exit(1);
  });