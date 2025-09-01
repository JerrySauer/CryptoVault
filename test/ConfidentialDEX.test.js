const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ConfidentialDEX", function () {
  async function deployConfidentialDEXFixture() {
    const [owner, trader1, trader2, liquidityProvider] = await ethers.getSigners();

    const ConfidentialDEX = await ethers.getContractFactory("ConfidentialDEX");
    const dex = await ConfidentialDEX.deploy();

    const MockToken = await ethers.getContractFactory("MockToken");
    const tokenA = await MockToken.deploy("Token A", "TKNA", 18, 1000000);
    const tokenB = await MockToken.deploy("Token B", "TKNB", 18, 1000000);

    // Transfer tokens to test accounts
    await tokenA.transfer(trader1.address, ethers.parseEther("1000"));
    await tokenA.transfer(trader2.address, ethers.parseEther("1000"));
    await tokenA.transfer(liquidityProvider.address, ethers.parseEther("2000"));

    await tokenB.transfer(trader1.address, ethers.parseEther("1000"));
    await tokenB.transfer(trader2.address, ethers.parseEther("1000"));
    await tokenB.transfer(liquidityProvider.address, ethers.parseEther("2000"));

    return { dex, tokenA, tokenB, owner, trader1, trader2, liquidityProvider };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { dex, owner } = await loadFixture(deployConfidentialDEXFixture);
      
      expect(await dex.owner()).to.equal(owner.address);
      expect(await dex.nextSwapId()).to.equal(1);
      expect(await dex.MAX_SLIPPAGE()).to.equal(1000); // 10%
      expect(await dex.MIN_LIQUIDITY()).to.equal(1000);
    });
  });

  describe("Liquidity Pool Management", function () {
    it("Should create liquidity pool successfully", async function () {
      const { dex, tokenA, tokenB, owner } = await loadFixture(deployConfidentialDEXFixture);
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      const feePercentage = 30; // 0.3%

      await expect(
        dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, feePercentage)
      ).to.emit(dex, "PoolCreated");

      const poolId = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddress, tokenBAddress]));
      const poolReserves = await dex.getPoolReserves(poolId);
      
      expect(poolReserves[0]).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(poolReserves[1]).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should reject pool creation with invalid parameters", async function () {
      const { dex, tokenA, owner } = await loadFixture(deployConfidentialDEXFixture);
      
      const tokenAddress = await tokenA.getAddress();

      // Same tokens
      await expect(
        dex.connect(owner).createLiquidityPool(tokenAddress, tokenAddress, 30)
      ).to.be.revertedWith("Tokens must be different");

      // Zero address
      await expect(
        dex.connect(owner).createLiquidityPool(ethers.ZeroAddress, tokenAddress, 30)
      ).to.be.revertedWith("Invalid token addresses");

      // Fee too high
      await expect(
        dex.connect(owner).createLiquidityPool(tokenAddress, ethers.ZeroAddress, 400) // 4%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should prevent duplicate pool creation", async function () {
      const { dex, tokenA, tokenB, owner } = await loadFixture(deployConfidentialDEXFixture);
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      // Create pool
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);

      // Try to create same pool again
      await expect(
        dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30)
      ).to.be.revertedWith("Pool already exists");
    });
  });

  describe("Liquidity Operations", function () {
    async function createPoolFixture() {
      const fixture = await loadFixture(deployConfidentialDEXFixture);
      const { dex, tokenA, tokenB, owner } = fixture;
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);
      const poolId = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddress, tokenBAddress]));
      
      return { ...fixture, poolId, tokenAAddress, tokenBAddress };
    }

    it("Should add liquidity successfully", async function () {
      const { dex, poolId, liquidityProvider } = await loadFixture(createPoolFixture);
      
      const encryptedAmountA = ethers.keccak256(ethers.toUtf8Bytes("encrypted_amount_A"));
      const encryptedAmountB = ethers.keccak256(ethers.toUtf8Bytes("encrypted_amount_B"));
      const proof = ethers.toUtf8Bytes("valid_proof");

      await expect(
        dex.connect(liquidityProvider).addLiquidity(
          poolId,
          encryptedAmountA,
          encryptedAmountB,
          proof,
          proof
        )
      ).to.emit(dex, "LiquidityAdded");

      const userLiquidity = await dex.getUserLiquidityShare(poolId, liquidityProvider.address);
      expect(userLiquidity).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should remove liquidity successfully", async function () {
      const { dex, poolId, liquidityProvider } = await loadFixture(createPoolFixture);
      
      const encryptedAmountA = ethers.keccak256(ethers.toUtf8Bytes("amount_A"));
      const encryptedAmountB = ethers.keccak256(ethers.toUtf8Bytes("amount_B"));
      const encryptedLiquidity = ethers.keccak256(ethers.toUtf8Bytes("liquidity_amount"));
      const proof = ethers.toUtf8Bytes("proof");

      // Add liquidity first
      await dex.connect(liquidityProvider).addLiquidity(
        poolId, encryptedAmountA, encryptedAmountB, proof, proof
      );

      // Remove liquidity
      await expect(
        dex.connect(liquidityProvider).removeLiquidity(poolId, encryptedLiquidity, proof)
      ).to.emit(dex, "LiquidityRemoved");
    });

    it("Should reject invalid liquidity operations", async function () {
      const { dex, poolId, liquidityProvider } = await loadFixture(createPoolFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const invalidProof = ethers.toUtf8Bytes(""); // Empty proof

      // Invalid proof
      await expect(
        dex.connect(liquidityProvider).addLiquidity(
          poolId, encryptedAmount, encryptedAmount, invalidProof, invalidProof
        )
      ).to.be.revertedWith("Invalid proof A");

      // Remove from non-existent liquidity
      const validProof = ethers.toUtf8Bytes("proof");
      await expect(
        dex.connect(liquidityProvider).removeLiquidity(poolId, encryptedAmount, validProof)
      ).to.be.revertedWith("No liquidity to remove");
    });
  });

  describe("Confidential Swaps", function () {
    async function createPoolWithLiquidityFixture() {
      const fixture = await loadFixture(deployConfidentialDEXFixture);
      const { dex, tokenA, tokenB, owner, liquidityProvider } = fixture;
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);
      const poolId = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddress, tokenBAddress]));
      
      // Add initial liquidity
      const encryptedAmountA = ethers.keccak256(ethers.toUtf8Bytes("liquidity_A"));
      const encryptedAmountB = ethers.keccak256(ethers.toUtf8Bytes("liquidity_B"));
      const proof = ethers.toUtf8Bytes("proof");
      
      await dex.connect(liquidityProvider).addLiquidity(
        poolId, encryptedAmountA, encryptedAmountB, proof, proof
      );
      
      return { ...fixture, poolId, tokenAAddress, tokenBAddress };
    }

    it("Should execute secret swap successfully", async function () {
      const { dex, poolId, tokenAAddress, tokenBAddress, trader1 } = await loadFixture(createPoolWithLiquidityFixture);
      
      const encryptedAmountIn = ethers.keccak256(ethers.toUtf8Bytes("swap_amount_in"));
      const encryptedMinAmountOut = ethers.keccak256(ethers.toUtf8Bytes("min_amount_out"));
      const encryptedSlippage = ethers.keccak256(ethers.toUtf8Bytes("slippage"));
      const proof = ethers.toUtf8Bytes("proof");

      const swapTx = await dex.connect(trader1).executeSecretSwap(
        poolId,
        tokenAAddress,
        tokenBAddress,
        encryptedAmountIn,
        encryptedMinAmountOut,
        encryptedSlippage,
        proof,
        proof,
        proof
      );

      await expect(swapTx).to.emit(dex, "SwapExecuted");

      const userSwaps = await dex.getUserSwaps(trader1.address);
      expect(userSwaps.length).to.equal(1);
      expect(userSwaps[0]).to.equal(1);
    });

    it("Should reject swaps with invalid tokens", async function () {
      const { dex, poolId, tokenA, trader1 } = await loadFixture(createPoolWithLiquidityFixture);
      
      const tokenAAddress = await tokenA.getAddress();
      const invalidTokenAddress = ethers.ZeroAddress; // Not in the pool
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const proof = ethers.toUtf8Bytes("proof");

      await expect(
        dex.connect(trader1).executeSecretSwap(
          poolId,
          tokenAAddress,
          invalidTokenAddress, // This combination doesn't exist in pool
          encryptedAmount,
          encryptedAmount,
          encryptedAmount,
          proof,
          proof,
          proof
        )
      ).to.be.revertedWith("Invalid token pair");
    });

    it("Should reject swaps with invalid proofs", async function () {
      const { dex, poolId, tokenAAddress, tokenBAddress, trader1 } = await loadFixture(createPoolWithLiquidityFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const invalidProof = ethers.toUtf8Bytes(""); // Empty proof

      await expect(
        dex.connect(trader1).executeSecretSwap(
          poolId,
          tokenAAddress,
          tokenBAddress,
          encryptedAmount,
          encryptedAmount,
          encryptedAmount,
          invalidProof, // Invalid proof
          invalidProof,
          invalidProof
        )
      ).to.be.revertedWith("Invalid amount proof");
    });
  });

  describe("Order Book Operations", function () {
    async function createPoolFixture() {
      const fixture = await loadFixture(deployConfidentialDEXFixture);
      const { dex, tokenA, tokenB, owner } = fixture;
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);
      const poolId = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddress, tokenBAddress]));
      
      return { ...fixture, poolId, tokenAAddress, tokenBAddress };
    }

    it("Should place limit orders successfully", async function () {
      const { dex, poolId, trader1 } = await loadFixture(createPoolFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("order_amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("order_price"));
      const proof = ethers.toUtf8Bytes("proof");
      const OrderType = { MARKET: 0, LIMIT: 1, STOP_LOSS: 2 };

      await expect(
        dex.connect(trader1).placeLimitOrder(
          poolId,
          encryptedAmount,
          encryptedPrice,
          OrderType.LIMIT,
          true, // Buy order
          proof,
          proof
        )
      ).to.emit(dex, "OrderPlaced")
        .withArgs(poolId, 1, trader1.address, OrderType.LIMIT);

      const userOrders = await dex.getUserOrders(trader1.address, poolId);
      expect(userOrders.length).to.equal(1);
      expect(userOrders[0]).to.equal(1);
    });

    it("Should execute orders successfully", async function () {
      const { dex, poolId, trader1, trader2 } = await loadFixture(createPoolFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("price"));
      const proof = ethers.toUtf8Bytes("proof");

      // Place order
      await dex.connect(trader1).placeLimitOrder(
        poolId, encryptedAmount, encryptedPrice, 1, true, proof, proof
      );

      // Execute order
      await expect(
        dex.connect(trader2).executeOrder(poolId, 1, true)
      ).to.emit(dex, "OrderExecuted")
        .withArgs(poolId, 1, trader2.address);
    });

    it("Should reject self-execution of orders", async function () {
      const { dex, poolId, trader1 } = await loadFixture(createPoolFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("price"));
      const proof = ethers.toUtf8Bytes("proof");

      // Place order
      await dex.connect(trader1).placeLimitOrder(
        poolId, encryptedAmount, encryptedPrice, 1, true, proof, proof
      );

      // Try to execute own order
      await expect(
        dex.connect(trader1).executeOrder(poolId, 1, true)
      ).to.be.revertedWith("Cannot execute own order");
    });

    it("Should reject execution of inactive orders", async function () {
      const { dex, poolId, trader1, trader2 } = await loadFixture(createPoolFixture);
      
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("price"));
      const proof = ethers.toUtf8Bytes("proof");

      // Place and execute order
      await dex.connect(trader1).placeLimitOrder(
        poolId, encryptedAmount, encryptedPrice, 1, true, proof, proof
      );
      await dex.connect(trader2).executeOrder(poolId, 1, true);

      // Try to execute already executed order
      await expect(
        dex.connect(trader2).executeOrder(poolId, 1, true)
      ).to.be.revertedWith("Order not active");
    });
  });

  describe("View Functions", function () {
    it("Should return active pools", async function () {
      const { dex, tokenA, tokenB, owner } = await loadFixture(deployConfidentialDEXFixture);
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();

      // Initially no pools
      let activePools = await dex.getActivePools();
      expect(activePools.length).to.equal(0);

      // Create pool
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);

      activePools = await dex.getActivePools();
      expect(activePools.length).to.equal(1);
    });

    it("Should return user-specific data", async function () {
      const { dex, tokenA, tokenB, owner, trader1, liquidityProvider } = await loadFixture(deployConfidentialDEXFixture);
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);
      const poolId = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddress, tokenBAddress]));

      // Initially empty
      expect((await dex.getUserSwaps(trader1.address)).length).to.equal(0);
      expect((await dex.getUserOrders(trader1.address, poolId)).length).to.equal(0);

      // After operations, should return data
      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("amount"));
      const proof = ethers.toUtf8Bytes("proof");

      // Add liquidity first
      await dex.connect(liquidityProvider).addLiquidity(
        poolId, encryptedAmount, encryptedAmount, proof, proof
      );

      // Execute swap
      await dex.connect(trader1).executeSecretSwap(
        poolId, tokenAAddress, tokenBAddress, encryptedAmount, encryptedAmount, encryptedAmount, proof, proof, proof
      );

      expect((await dex.getUserSwaps(trader1.address)).length).to.equal(1);
    });
  });

  describe("FHE Integration", function () {
    it("Should handle encrypted amounts in pools", async function () {
      const { dex, tokenA, tokenB, owner, liquidityProvider } = await loadFixture(deployConfidentialDEXFixture);
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);
      const poolId = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddress, tokenBAddress]));

      const encryptedAmountA = ethers.keccak256(ethers.toUtf8Bytes("secret_A"));
      const encryptedAmountB = ethers.keccak256(ethers.toUtf8Bytes("secret_B"));
      const proof = ethers.toUtf8Bytes("proof");

      await dex.connect(liquidityProvider).addLiquidity(
        poolId, encryptedAmountA, encryptedAmountB, proof, proof
      );

      const reserves = await dex.getPoolReserves(poolId);
      expect(reserves[0]).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(reserves[1]).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(reserves[2]).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should maintain encrypted order data", async function () {
      const { dex, tokenA, tokenB, owner, trader1 } = await loadFixture(deployConfidentialDEXFixture);
      
      const tokenAAddress = await tokenA.getAddress();
      const tokenBAddress = await tokenB.getAddress();
      
      await dex.connect(owner).createLiquidityPool(tokenAAddress, tokenBAddress, 30);
      const poolId = ethers.keccak256(ethers.solidityPacked(["address", "address"], [tokenAAddress, tokenBAddress]));

      const encryptedAmount = ethers.keccak256(ethers.toUtf8Bytes("secret_amount"));
      const encryptedPrice = ethers.keccak256(ethers.toUtf8Bytes("secret_price"));
      const proof = ethers.toUtf8Bytes("proof");

      await dex.connect(trader1).placeLimitOrder(
        poolId, encryptedAmount, encryptedPrice, 1, true, proof, proof
      );

      const userOrders = await dex.getUserOrders(trader1.address, poolId);
      expect(userOrders.length).to.equal(1);
    });
  });
});