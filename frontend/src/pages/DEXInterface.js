import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { MetaMaskHelper, CONTRACT_ADDRESSES } from '../utils/metamask';

const DEXInterface = ({ connected, account, provider, signer, onConnect }) => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [isSwapping, setIsSwapping] = useState(false);

  // Mock exchange rate
  const exchangeRate = 2456.78;

  useEffect(() => {
    if (fromAmount) {
      const calculated = (parseFloat(fromAmount) * exchangeRate).toFixed(6);
      setToAmount(calculated);
    } else {
      setToAmount('');
    }
  }, [fromAmount, exchangeRate]);

  const executeSwap = async () => {
    if (!connected) {
      onConnect();
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('⚠️ Please enter a valid amount');
      return;
    }

    setIsSwapping(true);
    
    try {
      toast.loading('🔄 Executing confidential swap...', { id: 'swap' });
      
      // Simulate FHE encryption and swap
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('🔄 Confidential swap executed successfully!', { id: 'swap' });
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      
    } catch (error) {
      toast.error('❌ Swap failed. Please try again.', { id: 'swap' });
    } finally {
      setIsSwapping(false);
    }
  };

  const swapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    // Recalculate amounts
    if (toAmount) {
      const newFromAmount = (parseFloat(toAmount) / exchangeRate).toFixed(6);
      setFromAmount(newFromAmount);
    }
  };

  // Mock order book data
  const buyOrders = [
    { amount: "████.██", price: "$2,456.78" },
    { amount: "████.██", price: "$2,455.21" },
    { amount: "████.██", price: "$2,453.89" }
  ];

  const sellOrders = [
    { amount: "████.██", price: "$2,458.43" },
    { amount: "████.██", price: "$2,459.67" },
    { amount: "████.██", price: "$2,461.12" }
  ];

  const tradingStats = [
    { label: "24h Volume:", value: "████.██ ETH", encrypted: true },
    { label: "Total Liquidity:", value: "$██,███.██", encrypted: true },
    { label: "Active Orders:", value: "247", encrypted: false },
    { label: "Fee APY:", value: "12.4%", encrypted: false, color: "text-green-400" }
  ];

  return (
    <div className="dex-interface min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center py-8 mb-8">
          <h1 className="text-4xl font-bold mb-4">Confidential DEX</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Trade assets with complete privacy using Zama's FHE encryption. Your trading positions and amounts remain completely confidential.
          </p>
        </div>

        {/* DEX Trading Interface */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trading Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Swap Interface */}
            <div className="glass-morphism rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="encrypted-text mr-2">🔄</span>
                Confidential Swap
              </h2>
              
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl p-4">
                  <label className="text-sm text-gray-300 mb-2 block">From</label>
                  <div className="flex items-center space-x-3">
                    <select 
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="WBTC">WBTC</option>
                      <option value="PRIV">PRIV</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="0.0" 
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="flex-1 bg-transparent text-white text-xl font-medium outline-none"
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Balance: <span className="encrypted-text">████.██</span> {fromToken}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={swapTokens}
                    className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5a1 1 0 100 2h5.586L2 18.586A1 1 0 003.414 20L15 8.414V14a1 1 0 102 0V6a1 1 0 00-1-1H8z"/>
                    </svg>
                  </button>
                </div>

                <div className="bg-black/20 rounded-xl p-4">
                  <label className="text-sm text-gray-300 mb-2 block">To</label>
                  <div className="flex items-center space-x-3">
                    <select 
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                      <option value="WBTC">WBTC</option>
                      <option value="PRIV">PRIV</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="0.0" 
                      value={toAmount}
                      readOnly
                      className="flex-1 bg-transparent text-white text-xl font-medium outline-none"
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Balance: <span className="encrypted-text">████.██</span> {toToken}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                  <div className="text-sm text-yellow-300 flex items-center">
                    <span className="mr-2">⚡</span>
                    Your trade amounts are encrypted using Zama FHE protocol
                  </div>
                </div>

                <button 
                  onClick={executeSwap}
                  disabled={isSwapping}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isSwapping 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'btn-primary neon-glow hover:shadow-2xl'
                  } text-white`}
                >
                  {isSwapping ? 'Processing...' : 'Execute Confidential Swap'}
                </button>
              </div>
            </div>

            {/* Order Book */}
            <div className="glass-morphism rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="encrypted-text mr-2">📊</span>
                Encrypted Order Book - {fromToken}/{toToken}
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-green-400 font-semibold mb-3">Buy Orders</h4>
                  <div className="space-y-2">
                    {buyOrders.map((order, index) => (
                      <div key={index} className="flex justify-between text-sm bg-green-500/10 p-2 rounded">
                        <span className="encrypted-text">{order.amount}</span>
                        <span className="text-white">{order.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-red-400 font-semibold mb-3">Sell Orders</h4>
                  <div className="space-y-2">
                    {sellOrders.map((order, index) => (
                      <div key={index} className="flex justify-between text-sm bg-red-500/10 p-2 rounded">
                        <span className="encrypted-text">{order.amount}</span>
                        <span className="text-white">{order.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Liquidity Pool */}
            <div className="glass-morphism rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="encrypted-text mr-2">💧</span>
                Add Liquidity
              </h3>
              
              <div className="space-y-4">
                <div className="bg-black/20 rounded-lg p-3">
                  <input 
                    type="number" 
                    placeholder="ETH Amount"
                    value={liquidityAmount1}
                    onChange={(e) => setLiquidityAmount1(e.target.value)}
                    step="0.001"
                    min="0"
                    className="w-full bg-transparent text-white outline-none"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Balance: <span className="encrypted-text">███.██</span> ETH
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <input 
                    type="number" 
                    placeholder="USDC Amount"
                    value={liquidityAmount2}
                    onChange={(e) => setLiquidityAmount2(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full bg-transparent text-white outline-none"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Balance: <span className="encrypted-text">████.██</span> USDC
                  </div>
                </div>
                
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <div className="text-xs text-cyan-300 flex items-start">
                    <span className="mr-2">🔒</span>
                    <div>
                      <div className="font-medium">Privacy Protection</div>
                      <div className="opacity-80">Your liquidity amounts will be encrypted</div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={addLiquidity}
                  disabled={isAddingLiquidity}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isAddingLiquidity 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isAddingLiquidity ? 'Adding...' : 'Add Confidential Liquidity'}
                </button>
              </div>
            </div>

            {/* Trading Stats */}
            <div className="glass-morphism rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="encrypted-text mr-2">📈</span>
                Trading Stats
              </h3>
              
              <div className="space-y-3">
                {tradingStats.map((stat, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-300">{stat.label}</span>
                    <span className={
                      stat.encrypted ? 'encrypted-text' : 
                      stat.color || 'text-white'
                    }>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Orders */}
            <div className="glass-morphism rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="encrypted-text mr-2">📋</span>
                My Orders
              </h3>
              
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">🔒</div>
                <p>{connected ? 'No active orders' : 'Connect wallet to view your encrypted orders'}</p>
                {!connected && (
                  <button 
                    onClick={onConnect}
                    className="mt-3 text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DEXInterface;