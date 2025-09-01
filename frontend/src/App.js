import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

// Components
import Navbar from './components/Navbar';
import VaultPortal from './pages/VaultPortal';
import DEXInterface from './pages/DEXInterface';
import Dashboard from './pages/Dashboard';
import WalletModal from './components/WalletModal';

// Web3 and Ethers
import { ethers } from 'ethers';

function App() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [network, setNetwork] = useState(null);

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          
          setConnected(true);
          setAccount(accounts[0]);
          setProvider(provider);
          setSigner(signer);
          setNetwork(network);
        }
      } catch (error) {
        console.log('Connection check failed:', error);
      }
    }
  };

  const connectWallet = () => {
    setShowWalletModal(true);
  };

  const handleWalletConnect = async (type) => {
    if (type === 'metamask') {
      await connectMetaMask();
    } else if (type === 'demo') {
      connectDemo();
    }
    setShowWalletModal(false);
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const address = await signer.getAddress();

        // Switch to Sepolia if not already
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            // Chain not added to MetaMask
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'SepoliaETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
              });
            } catch (addError) {
              console.log('Failed to add Sepolia network:', addError);
            }
          }
        }

        setConnected(true);
        setAccount(address);
        setProvider(provider);
        setSigner(signer);
        setNetwork(network);
        
        toast.success('🔗 MetaMask connected successfully!');
      } catch (error) {
        console.error('MetaMask connection failed:', error);
        toast.error('❌ Failed to connect MetaMask');
      }
    } else {
      toast.error('🦊 Please install MetaMask first!');
      window.open('https://metamask.io/', '_blank');
    }
  };

  const connectDemo = () => {
    setConnected(true);
    setAccount('0x...Demo...Address');
    toast.success('🔧 Demo mode activated!');
  };

  const disconnect = () => {
    setConnected(false);
    setAccount('');
    setProvider(null);
    setSigner(null);
    setNetwork(null);
    toast.success('👋 Wallet disconnected');
  };

  return (
    <Router>
      <div className="App min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Navbar 
          connected={connected}
          account={account}
          network={network}
          onConnect={connectWallet}
          onDisconnect={disconnect}
        />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/vaults" replace />} />
            <Route 
              path="/vaults" 
              element={
                <VaultPortal 
                  connected={connected}
                  account={account}
                  provider={provider}
                  signer={signer}
                  onConnect={connectWallet}
                />
              } 
            />
            <Route 
              path="/dex" 
              element={
                <DEXInterface 
                  connected={connected}
                  account={account}
                  provider={provider}
                  signer={signer}
                  onConnect={connectWallet}
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  connected={connected}
                  account={account}
                  provider={provider}
                  signer={signer}
                />
              } 
            />
          </Routes>
        </main>

        {/* Wallet Connection Modal */}
        <WalletModal 
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onConnect={handleWalletConnect}
        />

        {/* Toast Notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              backdropFilter: 'blur(16px)',
            }
          }}
        />
      </div>
    </Router>
  );
}

export default App;