import React from 'react';

const WalletModal = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="glass-morphism rounded-2xl p-8 max-w-md w-full mx-4 border border-cyan-500/30">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Connect to CryptoVault</h2>
          <p className="text-gray-300 text-sm">Choose your preferred wallet connection method</p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => onConnect('metamask')}
            className="w-full flex items-center justify-center space-x-3 bg-orange-500 hover:bg-orange-600 py-4 px-4 rounded-xl transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🦊</span>
            <div className="text-left">
              <div className="font-medium text-white">MetaMask</div>
              <div className="text-xs text-orange-100">Connect with MetaMask wallet</div>
            </div>
          </button>
          
          <button 
            onClick={() => onConnect('demo')}
            className="w-full flex items-center justify-center space-x-3 bg-cyan-500 hover:bg-cyan-600 py-4 px-4 rounded-xl transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🔧</span>
            <div className="text-left">
              <div className="font-medium text-white">Demo Mode</div>
              <div className="text-xs text-cyan-100">Explore without connecting wallet</div>
            </div>
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <div className="text-sm text-blue-300 flex items-start space-x-2">
            <span className="text-lg">ℹ️</span>
            <div>
              <div className="font-medium">New to Web3?</div>
              <div className="text-xs text-blue-200 mt-1">
                MetaMask is a secure wallet that lets you interact with blockchain applications. 
                Demo mode lets you explore features without connecting.
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-6 text-gray-400 hover:text-white py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WalletModal;