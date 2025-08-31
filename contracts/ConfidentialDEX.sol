// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FHECore.sol";

contract ConfidentialDEX is ReentrancyGuard, Ownable {
    using FHECore for *;

    struct LiquidityPool {
        address tokenA;
        address tokenB;
        bytes32 encryptedReserveA;
        bytes32 encryptedReserveB;
        bytes32 encryptedTotalLiquidity;
        mapping(address => bytes32) encryptedLiquidityShares;
        address[] liquidityProviders;
        bool isActive;
        uint256 feePercentage; // in basis points (100 = 1%)
    }

    struct SecretSwap {
        uint256 id;
        address trader;
        address tokenIn;
        address tokenOut;
        bytes32 encryptedAmountIn;
        bytes32 encryptedAmountOut;
        bytes32 encryptedSlippageTolerance;
        uint256 timestamp;
        bool isExecuted;
        bool isCancelled;
    }

    struct OrderBook {
        address tokenA;
        address tokenB;
        mapping(uint256 => SecretOrder) buyOrders;
        mapping(uint256 => SecretOrder) sellOrders;
        uint256[] activeBuyOrderIds;
        uint256[] activeSellOrderIds;
        uint256 nextOrderId;
    }

    struct SecretOrder {
        uint256 id;
        address trader;
        bytes32 encryptedAmount;
        bytes32 encryptedPrice;
        uint256 timestamp;
        bool isActive;
        OrderType orderType;
    }

    enum OrderType { MARKET, LIMIT, STOP_LOSS }

    mapping(bytes32 => LiquidityPool) public liquidityPools;
    mapping(bytes32 => OrderBook) public orderBooks;
    mapping(uint256 => SecretSwap) public swaps;
    mapping(address => uint256[]) public userSwaps;
    mapping(address => mapping(bytes32 => uint256[])) public userOrders;
    
    bytes32[] public activePools;
    uint256 public nextSwapId = 1;
    uint256 public constant MAX_SLIPPAGE = 1000; // 10%
    uint256 public constant MIN_LIQUIDITY = 1000;

    event PoolCreated(bytes32 indexed poolId, address tokenA, address tokenB);
    event LiquidityAdded(bytes32 indexed poolId, address indexed provider, bytes32 encryptedAmount);
    event LiquidityRemoved(bytes32 indexed poolId, address indexed provider, bytes32 encryptedAmount);
    event SwapExecuted(uint256 indexed swapId, address indexed trader, address tokenIn, address tokenOut);
    event OrderPlaced(bytes32 indexed poolId, uint256 indexed orderId, address indexed trader, OrderType orderType);
    event OrderExecuted(bytes32 indexed poolId, uint256 indexed orderId, address indexed trader);

    constructor() Ownable(msg.sender) {}

    function createLiquidityPool(
        address tokenA,
        address tokenB,
        uint256 feePercentage
    ) external returns (bytes32) {
        require(tokenA != tokenB, "Tokens must be different");
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");
        require(feePercentage <= 300, "Fee too high"); // Max 3%

        bytes32 poolId = keccak256(abi.encodePacked(tokenA, tokenB));
        require(!liquidityPools[poolId].isActive, "Pool already exists");

        LiquidityPool storage pool = liquidityPools[poolId];
        pool.tokenA = tokenA;
        pool.tokenB = tokenB;
        pool.encryptedReserveA = FHECore.encrypt(0);
        pool.encryptedReserveB = FHECore.encrypt(0);
        pool.encryptedTotalLiquidity = FHECore.encrypt(0);
        pool.isActive = true;
        pool.feePercentage = feePercentage;

        OrderBook storage orderBook = orderBooks[poolId];
        orderBook.tokenA = tokenA;
        orderBook.tokenB = tokenB;
        orderBook.nextOrderId = 1;

        activePools.push(poolId);

        emit PoolCreated(poolId, tokenA, tokenB);
        return poolId;
    }

    function addLiquidity(
        bytes32 poolId,
        bytes32 encryptedAmountA,
        bytes32 encryptedAmountB,
        bytes calldata proofA,
        bytes calldata proofB
    ) external nonReentrant {
        require(liquidityPools[poolId].isActive, "Pool not active");
        require(FHECore.verifyEncryption(encryptedAmountA, proofA), "Invalid proof A");
        require(FHECore.verifyEncryption(encryptedAmountB, proofB), "Invalid proof B");

        LiquidityPool storage pool = liquidityPools[poolId];
        
        bytes32 liquidityTokens = FHECore.addEncrypted(encryptedAmountA, encryptedAmountB);
        
        if (pool.encryptedLiquidityShares[msg.sender] == bytes32(0)) {
            pool.liquidityProviders.push(msg.sender);
        }

        pool.encryptedLiquidityShares[msg.sender] = FHECore.addEncrypted(
            pool.encryptedLiquidityShares[msg.sender],
            liquidityTokens
        );

        pool.encryptedReserveA = FHECore.addEncrypted(pool.encryptedReserveA, encryptedAmountA);
        pool.encryptedReserveB = FHECore.addEncrypted(pool.encryptedReserveB, encryptedAmountB);
        pool.encryptedTotalLiquidity = FHECore.addEncrypted(pool.encryptedTotalLiquidity, liquidityTokens);

        emit LiquidityAdded(poolId, msg.sender, liquidityTokens);
    }

    function removeLiquidity(
        bytes32 poolId,
        bytes32 encryptedLiquidityAmount,
        bytes calldata proof
    ) external nonReentrant {
        require(liquidityPools[poolId].isActive, "Pool not active");
        require(FHECore.verifyEncryption(encryptedLiquidityAmount, proof), "Invalid proof");

        LiquidityPool storage pool = liquidityPools[poolId];
        require(pool.encryptedLiquidityShares[msg.sender] != bytes32(0), "No liquidity to remove");

        pool.encryptedLiquidityShares[msg.sender] = FHECore.subtractEncrypted(
            pool.encryptedLiquidityShares[msg.sender],
            encryptedLiquidityAmount
        );

        pool.encryptedTotalLiquidity = FHECore.subtractEncrypted(
            pool.encryptedTotalLiquidity,
            encryptedLiquidityAmount
        );

        emit LiquidityRemoved(poolId, msg.sender, encryptedLiquidityAmount);
    }

    function executeSecretSwap(
        bytes32 poolId,
        address tokenIn,
        address tokenOut,
        bytes32 encryptedAmountIn,
        bytes32 encryptedMinAmountOut,
        bytes32 encryptedSlippageTolerance,
        bytes calldata amountProof,
        bytes calldata minAmountProof,
        bytes calldata slippageProof
    ) external nonReentrant returns (uint256) {
        require(liquidityPools[poolId].isActive, "Pool not active");
        require(FHECore.verifyEncryption(encryptedAmountIn, amountProof), "Invalid amount proof");
        require(FHECore.verifyEncryption(encryptedMinAmountOut, minAmountProof), "Invalid min amount proof");
        require(FHECore.verifyEncryption(encryptedSlippageTolerance, slippageProof), "Invalid slippage proof");

        LiquidityPool storage pool = liquidityPools[poolId];
        require(
            (tokenIn == pool.tokenA && tokenOut == pool.tokenB) ||
            (tokenIn == pool.tokenB && tokenOut == pool.tokenA),
            "Invalid token pair"
        );

        uint256 swapId = nextSwapId++;
        SecretSwap storage swap = swaps[swapId];
        
        swap.id = swapId;
        swap.trader = msg.sender;
        swap.tokenIn = tokenIn;
        swap.tokenOut = tokenOut;
        swap.encryptedAmountIn = encryptedAmountIn;
        swap.encryptedSlippageTolerance = encryptedSlippageTolerance;
        swap.timestamp = block.timestamp;

        bytes32 encryptedAmountOut = _calculateSwapOutput(poolId, tokenIn, encryptedAmountIn);
        swap.encryptedAmountOut = encryptedAmountOut;
        swap.isExecuted = true;

        _updatePoolReserves(poolId, tokenIn, tokenOut, encryptedAmountIn, encryptedAmountOut);

        userSwaps[msg.sender].push(swapId);

        emit SwapExecuted(swapId, msg.sender, tokenIn, tokenOut);
        return swapId;
    }

    function placeLimitOrder(
        bytes32 poolId,
        bytes32 encryptedAmount,
        bytes32 encryptedPrice,
        OrderType orderType,
        bool isBuyOrder,
        bytes calldata amountProof,
        bytes calldata priceProof
    ) external returns (uint256) {
        require(liquidityPools[poolId].isActive, "Pool not active");
        require(FHECore.verifyEncryption(encryptedAmount, amountProof), "Invalid amount proof");
        require(FHECore.verifyEncryption(encryptedPrice, priceProof), "Invalid price proof");

        OrderBook storage book = orderBooks[poolId];
        uint256 orderId = book.nextOrderId++;

        SecretOrder storage order = isBuyOrder 
            ? book.buyOrders[orderId] 
            : book.sellOrders[orderId];

        order.id = orderId;
        order.trader = msg.sender;
        order.encryptedAmount = encryptedAmount;
        order.encryptedPrice = encryptedPrice;
        order.timestamp = block.timestamp;
        order.isActive = true;
        order.orderType = orderType;

        if (isBuyOrder) {
            book.activeBuyOrderIds.push(orderId);
        } else {
            book.activeSellOrderIds.push(orderId);
        }

        userOrders[msg.sender][poolId].push(orderId);

        emit OrderPlaced(poolId, orderId, msg.sender, orderType);
        return orderId;
    }

    function executeOrder(bytes32 poolId, uint256 orderId, bool isBuyOrder) external nonReentrant {
        require(liquidityPools[poolId].isActive, "Pool not active");
        
        OrderBook storage book = orderBooks[poolId];
        SecretOrder storage order = isBuyOrder 
            ? book.buyOrders[orderId] 
            : book.sellOrders[orderId];

        require(order.isActive, "Order not active");
        require(order.trader != msg.sender, "Cannot execute own order");

        order.isActive = false;

        _removeOrderFromActiveList(book, orderId, isBuyOrder);

        emit OrderExecuted(poolId, orderId, msg.sender);
    }

    function getPoolReserves(bytes32 poolId) external view returns (bytes32, bytes32, bytes32) {
        LiquidityPool storage pool = liquidityPools[poolId];
        return (
            pool.encryptedReserveA,
            pool.encryptedReserveB,
            pool.encryptedTotalLiquidity
        );
    }

    function getUserLiquidityShare(bytes32 poolId, address user) external view returns (bytes32) {
        return liquidityPools[poolId].encryptedLiquidityShares[user];
    }

    function getActivePools() external view returns (bytes32[] memory) {
        return activePools;
    }

    function getUserSwaps(address user) external view returns (uint256[] memory) {
        return userSwaps[user];
    }

    function getUserOrders(address user, bytes32 poolId) external view returns (uint256[] memory) {
        return userOrders[user][poolId];
    }

    function _calculateSwapOutput(
        bytes32 poolId,
        address tokenIn,
        bytes32 encryptedAmountIn
    ) internal view returns (bytes32) {
        LiquidityPool storage pool = liquidityPools[poolId];
        
        bytes32 reserveIn = (tokenIn == pool.tokenA) ? pool.encryptedReserveA : pool.encryptedReserveB;
        bytes32 reserveOut = (tokenIn == pool.tokenA) ? pool.encryptedReserveB : pool.encryptedReserveA;

        return FHECore.multiplyEncrypted(
            encryptedAmountIn,
            FHECore.subtractEncrypted(reserveOut, encryptedAmountIn)
        );
    }

    function _updatePoolReserves(
        bytes32 poolId,
        address tokenIn,
        address tokenOut,
        bytes32 encryptedAmountIn,
        bytes32 encryptedAmountOut
    ) internal {
        LiquidityPool storage pool = liquidityPools[poolId];

        if (tokenIn == pool.tokenA) {
            pool.encryptedReserveA = FHECore.addEncrypted(pool.encryptedReserveA, encryptedAmountIn);
            pool.encryptedReserveB = FHECore.subtractEncrypted(pool.encryptedReserveB, encryptedAmountOut);
        } else {
            pool.encryptedReserveB = FHECore.addEncrypted(pool.encryptedReserveB, encryptedAmountIn);
            pool.encryptedReserveA = FHECore.subtractEncrypted(pool.encryptedReserveA, encryptedAmountOut);
        }
    }

    function _removeOrderFromActiveList(
        OrderBook storage book,
        uint256 orderId,
        bool isBuyOrder
    ) internal {
        uint256[] storage activeOrders = isBuyOrder ? book.activeBuyOrderIds : book.activeSellOrderIds;
        
        for (uint i = 0; i < activeOrders.length; i++) {
            if (activeOrders[i] == orderId) {
                activeOrders[i] = activeOrders[activeOrders.length - 1];
                activeOrders.pop();
                break;
            }
        }
    }
}