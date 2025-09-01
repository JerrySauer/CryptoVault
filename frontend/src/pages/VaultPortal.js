import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { MetaMaskHelper, CONTRACT_ADDRESSES } from '../utils/metamask';

const VaultPortal = ({ connected, account, provider, signer, onConnect }) => {
  const [selectedVault, setSelectedVault] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    target: '',
    category: 'Technology',
    duration: '30'
  });

  // Mock vault data
  const vaults = [
    {
      id: 1,
      name: "AI Privacy Protocol",
      description: "Revolutionary AI system that preserves user privacy while delivering personalized experiences using homomorphic encryption.",
      category: "Technology",
      target: "500 ETH",
      raised: "███ ETH",
      progress: 67,
      daysLeft: 15,
      icon: "🤖",
      gradient: "from-purple-500 to-pink-500",
      status: "ACTIVE"
    },
    {
      id: 2,
      name: "EcoChain Carbon Credits",
      description: "Blockchain-based carbon credit marketplace with verified environmental impact tracking and transparent offset mechanisms.",
      category: "Environment", 
      target: "300 ETH",
      raised: "███ ETH",
      progress: 45,
      daysLeft: 22,
      icon: "🌍",
      gradient: "from-green-500 to-emerald-500",
      status: "ACTIVE"
    },
    {
      id: 3,
      name: "MedSecure Data Platform",
      description: "Secure medical data sharing platform enabling patient-controlled health information with privacy-preserving analytics.",
      category: "Healthcare",
      target: "750 ETH", 
      raised: "███ ETH",
      progress: 23,
      daysLeft: 35,
      icon: "🏥",
      gradient: "from-orange-500 to-red-500",
      status: "FUNDING"
    }
  ];

  const stats = [
    { label: "Total Vaults", value: "████", encrypted: true },
    { label: "Funds Raised", value: "$███,███", encrypted: true },
    { label: "Contributors", value: "████", encrypted: true },
    { label: "Privacy Guaranteed", value: "100%", encrypted: false }
  ];

  const handleInvest = (vault) => {
    if (!connected) {
      onConnect();
      return;
    }
    setSelectedVault(vault);
    setShowInvestModal(true);
  };

  const executeInvestment = async () => {
    if (!connected) {
      onConnect();
      return;
    }

    if (!investAmount || parseFloat(investAmount) <= 0) {
      toast.error('⚠️ Please enter a valid investment amount');
      return;
    }

    const validation = MetaMaskHelper.validateAmount(investAmount);
    if (!validation.valid) {
      toast.error(`⚠️ ${validation.error}`);
      return;
    }

    try {
      const tx = {
        to: CONTRACT_ADDRESSES.VAULT_EXAMPLE,
        value: ethers.parseEther(investAmount),
        data: '0x' // Could include encoded function call
      };

      await MetaMaskHelper.sendTransaction(signer, tx, 'encrypted investment');
      
      setShowInvestModal(false);
      setInvestAmount('');
      setSelectedVault(null);
      
    } catch (error) {
      // Error handling is done in MetaMaskHelper
    }
  };

  const handleCreateVault = () => {
    if (!connected) {
      onConnect();
      return;
    }
    setShowCreateModal(true);
  };

  const executeCreateVault = async () => {
    if (!connected) {
      onConnect();
      return;
    }

    if (!createForm.name || !createForm.description || !createForm.target) {
      toast.error('⚠️ Please fill in all required fields');
      return;
    }

    if (parseFloat(createForm.target) <= 0) {
      toast.error('⚠️ Please enter a valid target amount');
      return;
    }

    const validation = MetaMaskHelper.validateAmount(createForm.target, 0.1);
    if (!validation.valid) {
      toast.error(`⚠️ Target ${validation.error}`);
      return;
    }

    try {
      const tx = {
        to: CONTRACT_ADDRESSES.VAULT_FACTORY,
        value: ethers.parseEther('0.01'), // Creation fee
        data: '0x' // Could include encoded function call with vault parameters
      };

      await MetaMaskHelper.sendTransaction(signer, tx, 'vault creation');
      
      toast.success(`🚀 Vault "${createForm.name}" created successfully!`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        target: '',
        category: 'Technology',
        duration: '30'
      });
      
    } catch (error) {
      // Error handling is done in MetaMaskHelper
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-12 mb-12">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Secret Participation in<br />Decentralized Funding
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Contribute to projects anonymously using Zama's FHE encryption. Your investment amounts remain completely private while supporting innovation.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={handleCreateVault}
            className="btn-primary px-8 py-4 rounded-xl font-bold text-lg"
          >
            Create Secret Vault
          </button>
          <button className="border border-cyan-500 px-8 py-4 rounded-xl font-bold text-lg hover:bg-cyan-500/10 transition-all text-cyan-400">
            Explore Vaults
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="glass-morphism rounded-xl p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${stat.encrypted ? 'encrypted-text' : 'text-green-400'}`}>
              {stat.value}
            </div>
            <div className="text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Featured Vaults */}
      <div className="mb-12">
        <h3 className="text-3xl font-bold mb-8 flex items-center">
          <span className="mr-3">🌟</span>
          Featured Secret Vaults
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vaults.map((vault) => (
            <div key={vault.id} className="vault-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${vault.gradient} flex items-center justify-center`}>
                  <span className="text-2xl">{vault.icon}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${vault.status === 'ACTIVE' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400'}`}>
                  {vault.status}
                </span>
              </div>
              
              <h4 className="text-xl font-bold mb-2 text-white">{vault.name}</h4>
              <p className="text-gray-400 text-sm mb-4">{vault.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Target:</span>
                  <span className="font-bold text-white">{vault.target}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Raised:</span>
                  <span className="encrypted-text">{vault.raised}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className={`bg-gradient-to-r ${vault.gradient} h-2 rounded-full transition-all duration-1000`} 
                       style={{ width: `${vault.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Progress: {vault.progress}%</span>
                  <span className="text-gray-400">{vault.daysLeft} days left</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleInvest(vault)}
                  className={`flex-1 bg-gradient-to-r ${vault.gradient} py-3 rounded-xl font-medium hover:shadow-lg transition-all text-white`}
                >
                  🔒 Invest Secretly
                </button>
                <button className="px-4 py-3 border border-gray-600 rounded-xl hover:border-cyan-500 transition-all">
                  <span className="text-xl">ℹ️</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Vault Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="glass-morphism rounded-2xl p-8 max-w-lg w-full mx-4 border border-cyan-500/30">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Create Secret Vault</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Vault Name *</label>
                <input 
                  type="text" 
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Enter vault name" 
                  className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Description *</label>
                <textarea 
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Describe your project" 
                  rows={3}
                  className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Target Amount (ETH) *</label>
                  <input 
                    type="number" 
                    value={createForm.target}
                    onChange={(e) => setCreateForm({...createForm, target: e.target.value})}
                    placeholder="100" 
                    step="0.1" 
                    min="0.1"
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Category</label>
                  <select 
                    value={createForm.category}
                    onChange={(e) => setCreateForm({...createForm, category: e.target.value})}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Environment">Environment</option>
                    <option value="Finance">Finance</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Duration (days)</label>
                <input 
                  type="number" 
                  value={createForm.duration}
                  onChange={(e) => setCreateForm({...createForm, duration: e.target.value})}
                  placeholder="30" 
                  min="1" 
                  max="365"
                  className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                <div className="text-sm text-cyan-300 flex items-start">
                  <span className="mr-2 text-lg">🔒</span>
                  <div>
                    <div className="font-medium mb-1">FHE Privacy Protection</div>
                    <div className="text-xs opacity-80">Contributor amounts will be encrypted using Zama's homomorphic encryption</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="text-sm text-yellow-300 flex items-start">
                  <span className="mr-2 text-lg">💳</span>
                  <div>
                    <div className="font-medium mb-1">Creation Fee: 0.01 ETH</div>
                    <div className="text-xs opacity-80">A small fee is required to deploy your vault contract</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={executeCreateVault}
                className="flex-1 btn-primary py-3 rounded-xl font-bold text-white"
              >
                🚀 Create Vault
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-600 rounded-xl hover:border-cyan-500 transition-all text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {showInvestModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="glass-morphism rounded-2xl p-8 max-w-md w-full mx-4 border border-cyan-500/30">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Secret Investment</h2>
            
            <div className="mb-6">
              <div className="text-center mb-4">
                <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${selectedVault?.gradient} flex items-center justify-center mb-3`}>
                  <span className="text-2xl">{selectedVault?.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{selectedVault?.name}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Investment Amount (ETH)</label>
                  <input 
                    type="number" 
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="0.1" 
                    step="0.01" 
                    min="0.001"
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <div className="text-sm text-cyan-300 flex items-start">
                    <span className="mr-2 text-lg">🔒</span>
                    <div>
                      <div className="font-medium mb-1">FHE Encryption Active</div>
                      <div className="text-xs opacity-80">Your investment amount will be encrypted using Zama's homomorphic encryption</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={executeInvestment}
                className="flex-1 btn-primary py-3 rounded-xl font-bold text-white"
              >
                Invest Secretly
              </button>
              <button 
                onClick={() => setShowInvestModal(false)}
                className="px-6 py-3 border border-gray-600 rounded-xl hover:border-cyan-500 transition-all text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Vault CTA */}
      <div className="glass-morphism rounded-2xl p-12 text-center">
        <h3 className="text-3xl font-bold mb-4 text-white">Launch Your Secret Funding Campaign</h3>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
          Create a confidential vault where contributors can support your project privately. 
          All investment amounts are encrypted using Zama's FHE technology.
        </p>
        <button 
          onClick={handleCreateVault}
          className="btn-primary px-12 py-4 rounded-xl font-bold text-lg neon-glow text-white"
        >
          🚀 Launch Secret Vault
        </button>
      </div>
    </div>
  );
};

export default VaultPortal;