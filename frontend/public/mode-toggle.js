// CryptoVault Mode Toggle - Demo vs Real Transactions

// Add mode toggle UI to pages
document.addEventListener('DOMContentLoaded', function() {
    addModeToggle();
});

function addModeToggle() {
    // Create mode toggle element
    const modeToggle = document.createElement('div');
    modeToggle.className = 'fixed bottom-4 left-4 z-50';
    modeToggle.innerHTML = `
        <div class="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-300">Transaction Mode:</span>
                <button id="modeToggleBtn" class="flex items-center space-x-2 px-3 py-1 rounded-lg transition-all">
                    <span class="w-2 h-2 rounded-full" id="modeIndicator"></span>
                    <span id="modeText">Demo Mode</span>
                </button>
            </div>
            <div class="text-xs text-gray-400 mt-1" id="modeDescription">
                Safe simulation with fake transactions
            </div>
        </div>
    `;
    
    document.body.appendChild(modeToggle);
    
    // Initialize toggle state
    updateModeToggle();
    
    // Add click event
    document.getElementById('modeToggleBtn').addEventListener('click', toggleMode);
}

function updateModeToggle() {
    const btn = document.getElementById('modeToggleBtn');
    const indicator = document.getElementById('modeIndicator');
    const text = document.getElementById('modeText');
    const description = document.getElementById('modeDescription');
    
    if (window.CryptoVaultConfig.DEMO_MODE) {
        btn.className = 'flex items-center space-x-2 px-3 py-1 rounded-lg transition-all bg-blue-500/20 border border-blue-500/50 text-blue-400';
        indicator.className = 'w-2 h-2 rounded-full bg-blue-400';
        text.textContent = 'Demo Mode';
        description.textContent = 'Safe simulation with fake transactions';
    } else {
        btn.className = 'flex items-center space-x-2 px-3 py-1 rounded-lg transition-all bg-red-500/20 border border-red-500/50 text-red-400';
        indicator.className = 'w-2 h-2 rounded-full bg-red-400';
        text.textContent = 'Real Mode';
        description.textContent = 'Actual blockchain transactions with gas fees';
    }
}

function toggleMode() {
    // Show confirmation modal
    const currentMode = window.CryptoVaultConfig.DEMO_MODE ? 'Demo' : 'Real';
    const newMode = window.CryptoVaultConfig.DEMO_MODE ? 'Real' : 'Demo';
    
    const confirmMsg = window.CryptoVaultConfig.DEMO_MODE 
        ? `Switch to Real Mode?\n\n⚠️ WARNING: Real transactions will cost actual ETH!\nYou will need Sepolia testnet ETH for transactions.`
        : `Switch to Demo Mode?\n\nTransactions will be simulated for safety.`;
    
    if (confirm(confirmMsg)) {
        // Toggle mode
        window.CryptoVaultConfig.DEMO_MODE = !window.CryptoVaultConfig.DEMO_MODE;
        window.CryptoVaultConfig.SIMULATE_TRANSACTIONS = window.CryptoVaultConfig.DEMO_MODE;
        
        // Update UI
        updateModeToggle();
        
        // Show toast
        const toastMsg = window.CryptoVaultConfig.DEMO_MODE 
            ? '🔧 Switched to Demo Mode - Safe simulations enabled'
            : '⚠️ Switched to Real Mode - Actual transactions will cost gas!';
        
        if (typeof showToast === 'function') {
            showToast(toastMsg, window.CryptoVaultConfig.DEMO_MODE ? 'info' : 'warning');
        }
        
        console.log(`CryptoVault mode changed to: ${newMode} Mode`);
    }
}

// Export for global use
window.toggleCryptoVaultMode = toggleMode;
window.updateModeToggle = updateModeToggle;