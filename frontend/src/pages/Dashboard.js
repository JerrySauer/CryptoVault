import React from 'react';
import { toast } from 'react-hot-toast';

const Dashboard = ({ connected, account, provider, signer }) => {
  
  const userStats = [
    { label: "Total Invested", value: "████.██ ETH", encrypted: true },
    { label: "Active Vaults", value: "█", encrypted: true },
    { label: "Trading Volume", value: "██,███ USDC", encrypted: true },
    { label: "Rewards Earned", value: "███.█ CVP", encrypted: true }
  ];

  const recentActivity = [
    {
      id: 1,
      type: "investment",
      description: "Secret investment in AI Privacy Protocol",
      amount: "████.██ ETH",
      timestamp: "2 hours ago",
      icon: "🔒"
    },
    {
      id: 2,
      type: "trade",
      description: "Confidential swap ETH → USDC",
      amount: "████.██ USDC",
      timestamp: "5 hours ago", 
      icon: "🔄"
    },
    {
      id: 3,
      type: "liquidity",
      description: "Added liquidity to CVP/USDC pool",
      amount: "████.██ LP",
      timestamp: "1 day ago",
      icon: "💧"
    }
  ];

  const portfolioBreakdown = [
    { asset: "ETH", amount: "████.██", value: "$██,███", percentage: 45 },
    { asset: "USDC", amount: "██,███.██", value: "$██,███", percentage: 30 },
    { asset: "CVP", amount: "█,███.██", value: "$█,███", percentage: 15 },
    { asset: "PRIV", amount: "█,███.██", value: "$███", percentage: 10 }
  ];

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4 text-white">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Access your confidential trading dashboard</p>
          <button 
            onClick={() => toast.info('Please use the Connect Wallet button in the navigation')}
            className="btn-primary px-8 py-3 rounded-xl font-bold text-white"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, {account.slice(0, 6)}...{account.slice(-4)} 
          <span className="ml-2 text-xs bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30 text-green-400">
            🔐 FHE Protected
          </span>
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {userStats.map((stat, index) => (
          <div key={index} className="glass-morphism rounded-xl p-6 text-center">
            <div className={`text-2xl font-bold mb-2 ${stat.encrypted ? 'encrypted-text' : 'text-white'}`}>
              {stat.value}
            </div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Portfolio Breakdown */}
        <div className="lg:col-span-2">
          <div className="glass-morphism rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <span className="encrypted-text mr-2">📊</span>
              Encrypted Portfolio
            </h3>
            
            <div className="space-y-4">
              {portfolioBreakdown.map((asset, index) => (
                <div key={index} className="bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                        {asset.asset}
                      </div>
                      <div>
                        <div className="font-medium text-white">{asset.asset}</div>
                        <div className="text-xs text-gray-400">Amount: <span className="encrypted-text">{asset.amount}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white encrypted-text">{asset.value}</div>
                      <div className="text-xs text-gray-400">{asset.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${asset.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-morphism rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <span className="encrypted-text mr-2">📋</span>
              Recent Activity
            </h3>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      {activity.icon}
                    </div>
                    <div>
                      <div className="font-medium text-white">{activity.description}</div>
                      <div className="text-xs text-gray-400">{activity.timestamp}</div>
                    </div>
                  </div>
                  <div className="encrypted-text font-mono text-sm">
                    {activity.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-morphism rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Quick Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => toast.success('🚀 Redirecting to vault creation...')}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 py-3 rounded-xl font-medium transition-all hover:shadow-lg text-white"
              >
                🔒 Create Secret Vault
              </button>
              <button 
                onClick={() => toast.success('📈 Opening DEX interface...')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl font-medium transition-all hover:shadow-lg text-white"
              >
                🔄 Trade Assets
              </button>
              <button 
                onClick={() => toast.success('💧 Opening liquidity pools...')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 py-3 rounded-xl font-medium transition-all hover:shadow-lg text-white"
              >
                💧 Add Liquidity
              </button>
            </div>
          </div>

          {/* Privacy Status */}
          <div className="glass-morphism rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Privacy Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">FHE Encryption</span>
                <span className="text-green-400 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Zero-Knowledge Proofs</span>
                <span className="text-green-400 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Range Proofs</span>
                <span className="text-green-400 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Data Encryption</span>
                <span className="text-green-400 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  100%
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-sm text-green-300 flex items-center">
                <span className="mr-2">🛡️</span>
                All your financial data is protected by military-grade FHE encryption
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="glass-morphism rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Network</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Network:</span>
                <span className="text-white">Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Chain ID:</span>
                <span className="text-white">11155111</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Block Height:</span>
                <span className="text-white">5,234,567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Gas Price:</span>
                <span className="text-white">12 gwei</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;