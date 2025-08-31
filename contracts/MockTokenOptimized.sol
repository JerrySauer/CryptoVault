// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockTokenOptimized
 * @dev Gas-optimized ERC20 token with reduced storage costs and optimized functions
 */
contract MockTokenOptimized is ERC20, Ownable {
    // Pack decimals with other data to save storage slots
    struct TokenInfo {
        uint8 decimals;
        uint32 faucetCooldown;
        uint216 maxFaucetAmount; // Remaining space in the slot
    }
    
    TokenInfo private tokenInfo;
    mapping(address => uint32) private lastFaucetTime;

    // Events for gas-efficient logging
    event FaucetUsed(address indexed user, uint256 amount);
    event TokensBurned(address indexed user, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        tokenInfo.decimals = decimals_;
        tokenInfo.faucetCooldown = 1 hours;
        tokenInfo.maxFaucetAmount = 1000 * (10 ** decimals_);
        
        _mint(msg.sender, initialSupply * (10 ** decimals_));
    }

    function decimals() public view virtual override returns (uint8) {
        return tokenInfo.decimals;
    }

    /**
     * @dev Gas-optimized minting with batch support
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Batch mint to multiple addresses
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint256 length = recipients.length;
        for (uint256 i = 0; i < length;) {
            _mint(recipients[i], amounts[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @dev Gas-optimized burn function
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from multiple addresses (with approval)
     */
    function batchBurn(address[] calldata accounts, uint256[] calldata amounts) external {
        require(accounts.length == amounts.length, "Length mismatch");
        
        uint256 length = accounts.length;
        for (uint256 i = 0; i < length;) {
            address account = accounts[i];
            uint256 amount = amounts[i];
            
            if (account != msg.sender) {
                uint256 currentAllowance = allowance(account, msg.sender);
                require(currentAllowance >= amount, "Insufficient allowance");
                _approve(account, msg.sender, currentAllowance - amount);
            }
            
            _burn(account, amount);
            emit TokensBurned(account, amount);
            unchecked { ++i; }
        }
    }

    /**
     * @dev Gas-optimized faucet with cooldown protection
     */
    function faucet(uint256 amount) external {
        require(amount <= tokenInfo.maxFaucetAmount, "Amount too large");
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + tokenInfo.faucetCooldown,
            "Cooldown active"
        );
        
        lastFaucetTime[msg.sender] = uint32(block.timestamp);
        _mint(msg.sender, amount);
        
        emit FaucetUsed(msg.sender, amount);
    }

    /**
     * @dev Quick faucet with standard amount
     */
    function quickFaucet() external {
        uint256 standardAmount = 100 * (10 ** tokenInfo.decimals);
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + tokenInfo.faucetCooldown,
            "Cooldown active"
        );
        
        lastFaucetTime[msg.sender] = uint32(block.timestamp);
        _mint(msg.sender, standardAmount);
        
        emit FaucetUsed(msg.sender, standardAmount);
    }

    /**
     * @dev Update faucet parameters (owner only)
     */
    function updateFaucetParams(uint216 maxAmount, uint32 cooldown) external onlyOwner {
        tokenInfo.maxFaucetAmount = maxAmount;
        tokenInfo.faucetCooldown = cooldown;
    }

    /**
     * @dev Get faucet information for an address
     */
    function getFaucetInfo(address user) external view returns (
        uint256 maxAmount,
        uint256 cooldown,
        uint256 nextAvailable
    ) {
        maxAmount = tokenInfo.maxFaucetAmount;
        cooldown = tokenInfo.faucetCooldown;
        
        uint256 lastUsed = lastFaucetTime[user];
        if (lastUsed == 0) {
            nextAvailable = block.timestamp;
        } else {
            nextAvailable = lastUsed + cooldown;
            if (nextAvailable < block.timestamp) {
                nextAvailable = block.timestamp;
            }
        }
    }

    /**
     * @dev Check if faucet is available for user
     */
    function canUseFaucet(address user) external view returns (bool) {
        return block.timestamp >= lastFaucetTime[user] + tokenInfo.faucetCooldown;
    }

    /**
     * @dev Gas-optimized transfer with validation
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(to != address(this), "Cannot transfer to contract");
        return super.transfer(to, amount);
    }

    /**
     * @dev Gas-optimized transferFrom with validation
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(to != address(this), "Cannot transfer to contract");
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Batch transfer to multiple recipients
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external returns (bool) {
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint256 length = recipients.length;
        for (uint256 i = 0; i < length;) {
            require(transfer(recipients[i], amounts[i]), "Transfer failed");
            unchecked { ++i; }
        }
        
        return true;
    }

    /**
     * @dev Emergency recovery for stuck tokens (owner only)
     */
    function emergencyRecovery(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot recover own tokens");
        require(to != address(0), "Invalid recipient");
        
        if (token == address(0)) {
            // Recover ETH
            payable(to).transfer(amount);
        } else {
            // Recover ERC20 tokens
            IERC20(token).transfer(to, amount);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
}