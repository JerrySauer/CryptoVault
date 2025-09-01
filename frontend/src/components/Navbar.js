import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ connected, account, network, onConnect, onDisconnect }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-300 hover:text-white';
  };

  return (
    <nav className="crypto-vault-header p-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">🔐</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CryptoVault</h1>
            <p className="text-sm text-gray-300">Confidential Trading Platform</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/vaults" className={`transition-colors pb-1 ${isActive('/vaults')}`}>
            Vaults
          </Link>
          <Link to="/dex" className={`transition-colors pb-1 ${isActive('/dex')}`}>
            DEX
          </Link>
          <Link to="/dashboard" className={`transition-colors pb-1 ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {network && (
            <div className="text-sm bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30 text-blue-300">
              {network.name === 'sepolia' ? 'Sepolia' : network.name || 'Unknown'}
            </div>
          )}
          
          {connected ? (
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-300">
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
              <button 
                onClick={onDisconnect}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-xl border border-red-500/30 transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={onConnect}
              className="btn-primary text-white px-6 py-2 rounded-xl font-medium neon-glow"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden mt-4 flex justify-center space-x-6">
        <Link to="/vaults" className={`transition-colors pb-1 ${isActive('/vaults')}`}>
          Vaults
        </Link>
        <Link to="/dex" className={`transition-colors pb-1 ${isActive('/dex')}`}>
          DEX
        </Link>
        <Link to="/dashboard" className={`transition-colors pb-1 ${isActive('/dashboard')}`}>
          Dashboard
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;