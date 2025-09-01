// CryptoVault Configuration - Demo Mode with Simulation
window.CryptoVaultConfig = {
    // Network Configuration
    SEPOLIA_CHAIN_ID: '0xaa36a7',
    SEPOLIA_CHAIN_NAME: 'Sepolia Testnet',
    SEPOLIA_RPC_URL: 'https://sepolia.infura.io/v3/',
    SEPOLIA_EXPLORER: 'https://sepolia.etherscan.io',

    // Demo Mode Settings - Modified for MetaMask PopUp Testing
    DEMO_MODE: true, // Set to false for real contract interactions
    SIMULATE_TRANSACTIONS: false, // Changed to false to enable actual MetaMask popups

    // Zama FHE Contract Addresses on Sepolia (Updated)
    contracts: {
        // Core FHE Infrastructure
        FHEVM_EXECUTOR_CONTRACT: '0x848B0066793BcC60346Da1F49049357399B8D595',
        ACL_CONTRACT: '0x687820221192C5B662b25367F70076A37bc79b6c',
        HCU_LIMIT_CONTRACT: '0x594BB474275918AF9609814E68C61B1587c5F838',
        KMS_VERIFIER_CONTRACT: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
        INPUT_VERIFIER_CONTRACT: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
        DECRYPTION_ORACLE_CONTRACT: '0xa02Cda4Ca3a71D7C46997716F4283aa851C28812',
        
        // Service Addresses
        DECRYPTION_ADDRESS: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
        INPUT_VERIFICATION_ADDRESS: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F'
    },
    
    // Relayer Configuration
    RELAYER_URL: 'https://relayer.testnet.zama.cloud',

    // CryptoVault Feature Mappings using FHEVM Contracts
    featureContracts: {
        vaultInvestment: '0x594BB474275918AF9609814E68C61B1587c5F838',   // HCU_LIMIT_CONTRACT for investment tracking
        vaultCreation: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',    // KMS_VERIFIER_CONTRACT for vault creation
        dexSwap: '0x848B0066793BcC60346Da1F49049357399B8D595',         // FHEVM_EXECUTOR_CONTRACT for swaps
        dexLiquidity: '0x687820221192C5B662b25367F70076A37bc79b6c',     // ACL_CONTRACT for liquidity
        dexTrading: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',      // INPUT_VERIFIER_CONTRACT for trading
        decryption: '0xa02Cda4Ca3a71D7C46997716F4283aa851C28812'       // DECRYPTION_ORACLE_CONTRACT for results
    },

    // Gas Limits for FHE Operations (Reduced for better compatibility)
    gasLimits: {
        investment: '150000',    // Reduced gas for basic operations
        vaultCreation: '200000', // Reduced for simple vault setup
        dexSwap: '150000',       // Reduced for swap operations
        dexLiquidity: '180000'   // Reduced for liquidity operations
    },


    // UI Configuration
    ui: {
        toastDuration: 3000,
        transactionTimeout: 60000, // 1 minute
        encryptionDelay: 1500      // Simulated FHE processing time
    }
};

// Utility function to get contract address by feature
window.getContractAddress = function(feature) {
    // Always use FHEVM contract addresses for proper MetaMask interaction
    return window.CryptoVaultConfig.featureContracts[feature] || 
           window.CryptoVaultConfig.contracts.FHEVM_EXECUTOR_CONTRACT;
};

// Utility function to get gas limit by operation
window.getGasLimit = function(operation) {
    return window.CryptoVaultConfig.gasLimits[operation] || '200000';
};

// Utility function to simulate transaction (only when explicitly requested)
window.simulateTransaction = async function(tx, operationType) {
    if (!window.CryptoVaultConfig.SIMULATE_TRANSACTIONS) {
        // When simulation is disabled, return null to let real MetaMask handle it
        return null;
    }
    
    // Generate mock transaction hash
    const mockTxHash = '0x' + Math.random().toString(16).slice(2, 66);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock receipt
    return {
        hash: mockTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        status: 1,
        wait: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                hash: mockTxHash,
                blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
                status: 1
            };
        }
    };
};

console.log('🔐 CryptoVault Config loaded with Zama FHE Sepolia addresses');