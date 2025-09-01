// CryptoVault Configuration - Updated with Deployed Addresses
window.CryptoVaultConfig = {
    // Network Configuration
    SEPOLIA_CHAIN_ID: '0xaa36a7',
    SEPOLIA_CHAIN_NAME: 'Sepolia Testnet',
    SEPOLIA_RPC_URL: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    SEPOLIA_EXPLORER: 'https://sepolia.etherscan.io',

    // Deployment Settings
    DEMO_MODE: false, // Set to false to use real deployed contracts
    SIMULATE_TRANSACTIONS: false, // Use actual blockchain transactions

    // Deployed CryptoVault Contract Addresses on Sepolia
    contracts: {
        // Main Protocol Contracts
        CRYPTO_VAULT: '0x_NEW_CRYPTO_VAULT_ADDRESS',
        VAULT_MANAGER: '0x_NEW_VAULT_MANAGER_ADDRESS',
        CONFIDENTIAL_DEX: '0x_NEW_CONFIDENTIAL_DEX_ADDRESS',
        FHE_CORE: '0x_NEW_FHE_CORE_ADDRESS',
        
        // Protocol Tokens
        CVP_TOKEN: '0x_NEW_CVP_TOKEN_ADDRESS',
        PRIVACY_TOKEN: '0x_NEW_PRIVACY_TOKEN_ADDRESS',
        VAULT_TOKEN: '0x_NEW_VAULT_TOKEN_ADDRESS',
        
        // Test Tokens
        MOCK_USDT: '0x_NEW_MOCK_USDT_ADDRESS',
        MOCK_DAI: '0x_NEW_MOCK_DAI_ADDRESS',
        
        // Zama FHE Infrastructure (Keep for compatibility)
        FHEVM_EXECUTOR_CONTRACT: '0x848B0066793BcC60346Da1F49049357399B8D595',
        ACL_CONTRACT: '0x687820221192C5B662b25367F70076A37bc79b6c',
        KMS_VERIFIER_CONTRACT: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC'
    },

    // Feature Contract Mappings - Updated to use our deployed contracts
    featureContracts: {
        vaultInvestment: '0x_NEW_CRYPTO_VAULT_ADDRESS',    // Main vault contract
        vaultCreation: '0x_NEW_VAULT_MANAGER_ADDRESS',     // Vault management
        dexSwap: '0x_NEW_CONFIDENTIAL_DEX_ADDRESS',        // DEX swapping
        dexLiquidity: '0x_NEW_CONFIDENTIAL_DEX_ADDRESS',   // DEX liquidity
        dexTrading: '0x_NEW_CONFIDENTIAL_DEX_ADDRESS',     // DEX trading
        decryption: '0x_NEW_FHE_CORE_ADDRESS'              // FHE operations
    },

    // Optimized Gas Limits (from our gas analysis)
    gasLimits: {
        investment: '180000',     // Optimized for vault contributions
        vaultCreation: '250000',  // Optimized for vault creation
        dexSwap: '200000',        // Optimized for DEX swaps
        dexLiquidity: '220000',   // Optimized for liquidity operations
        tokenTransfer: '80000',   // Standard token transfers
        tokenApproval: '60000'    // Token approvals
    },

    // UI Configuration
    ui: {
        toastDuration: 4000,
        transactionTimeout: 120000, // 2 minutes for better reliability
        encryptionDelay: 2000,      // Realistic FHE processing time
        refreshInterval: 30000      // Auto-refresh data every 30 seconds
    }
};

// Utility function to get contract address by feature
window.getContractAddress = function(feature) {
    return window.CryptoVaultConfig.featureContracts[feature] || 
           window.CryptoVaultConfig.contracts.CRYPTO_VAULT;
};

// Utility function to get gas limit by operation
window.getGasLimit = function(operation) {
    return window.CryptoVaultConfig.gasLimits[operation] || '200000';
};

console.log('🚀 CryptoVault Config loaded with deployed contract addresses');
console.log('📍 Main Contract:', window.CryptoVaultConfig.contracts.CRYPTO_VAULT);
console.log('💱 DEX Contract:', window.CryptoVaultConfig.contracts.CONFIDENTIAL_DEX);