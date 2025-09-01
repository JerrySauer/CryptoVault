import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

// Contract addresses (mock addresses for demo)
export const CONTRACT_ADDRESSES = {
  VAULT_FACTORY: '0x1234567890123456789012345678901234567890',
  DEX_ROUTER: '0x3B7c3c8F5F3C3A1B2A8F9E7D6C5B4A3F2E1D0C9B',
  LIQUIDITY_POOL: '0x4C8D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D',
  VAULT_EXAMPLE: '0x742d35Cc662C3B63A1D6FbBe6D8F0F8D4E1B4F5C'
};

// Network configurations
export const NETWORKS = {
  SEPOLIA: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'SepoliaETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  },
  LOCALHOST: {
    chainId: '0x7a69',
    chainName: 'Localhost 8545',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['http://localhost:8545'],
    blockExplorerUrls: ['http://localhost:8545']
  }
};

export class MetaMaskHelper {
  static async checkConnection() {
    if (typeof window.ethereum === 'undefined') {
      toast.error('🦊 Please install MetaMask first!');
      window.open('https://metamask.io/', '_blank');
      return false;
    }
    return true;
  }

  static async connectWallet() {
    if (!await this.checkConnection()) return null;

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const address = await signer.getAddress();

      return { provider, signer, network, address };
    } catch (error) {
      console.error('MetaMask connection failed:', error);
      toast.error('❌ Failed to connect MetaMask');
      return null;
    }
  }

  static async switchNetwork(networkConfig) {
    if (!await this.checkConnection()) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig]
          });
          return true;
        } catch (addError) {
          console.error('Failed to add network:', addError);
          toast.error('❌ Failed to add network to MetaMask');
          return false;
        }
      } else {
        console.error('Failed to switch network:', switchError);
        toast.error('❌ Failed to switch network');
        return false;
      }
    }
  }

  static async sendTransaction(signer, txParams, description = 'transaction') {
    try {
      toast.loading(`🔄 Sending ${description}...`, { id: description });
      
      const transaction = await signer.sendTransaction(txParams);
      
      toast.loading(`⏳ Waiting for ${description} confirmation...`, { id: description });
      
      const receipt = await transaction.wait();
      
      toast.success(
        `✅ ${description.charAt(0).toUpperCase() + description.slice(1)} successful! TX: ${receipt.hash.slice(0, 10)}...`,
        { id: description }
      );
      
      return receipt;
    } catch (error) {
      console.error(`${description} error:`, error);
      
      if (error.code === 4001) {
        toast.error(`❌ ${description.charAt(0).toUpperCase() + description.slice(1)} cancelled by user`, { id: description });
      } else if (error.code === -32603) {
        toast.error(`❌ ${description.charAt(0).toUpperCase() + description.slice(1)} failed - insufficient funds`, { id: description });
      } else {
        toast.error(`❌ ${description.charAt(0).toUpperCase() + description.slice(1)} failed. Please try again.`, { id: description });
      }
      
      throw error;
    }
  }

  static formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  static formatBalance(balance, decimals = 4) {
    if (!balance) return '0';
    return parseFloat(ethers.formatEther(balance)).toFixed(decimals);
  }

  static async getBalance(provider, address) {
    try {
      const balance = await provider.getBalance(address);
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return ethers.parseEther('0');
    }
  }

  static validateAmount(amount, min = 0.001) {
    if (!amount || isNaN(parseFloat(amount))) {
      return { valid: false, error: 'Please enter a valid amount' };
    }
    
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }
    
    if (numAmount < min) {
      return { valid: false, error: `Minimum amount is ${min} ETH` };
    }
    
    return { valid: true };
  }
}

// Custom hooks for MetaMask integration
export const useMetaMask = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [balance, setBalance] = useState('0');

  const connect = async () => {
    const result = await MetaMaskHelper.connectWallet();
    if (result) {
      setIsConnected(true);
      setAccount(result.address);
      setProvider(result.provider);
      setSigner(result.signer);
      setNetwork(result.network);
      
      const userBalance = await MetaMaskHelper.getBalance(result.provider, result.address);
      setBalance(MetaMaskHelper.formatBalance(userBalance));
      
      toast.success('🔗 MetaMask connected successfully!');
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount('');
    setProvider(null);
    setSigner(null);
    setNetwork(null);
    setBalance('0');
    toast.success('👋 Wallet disconnected');
  };

  return {
    isConnected,
    account,
    provider,
    signer,
    network,
    balance,
    connect,
    disconnect,
    formatAddress: MetaMaskHelper.formatAddress,
    sendTransaction: MetaMaskHelper.sendTransaction
  };
};