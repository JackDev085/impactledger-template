import { BrowserProvider, Contract } from 'ethers';
import SkillChainArtifact from '../../../backend/artifacts/contracts/SkillChain.sol/SkillChain.json';

const CONTRACT_ADDRESS_SEPOLIA = '0x2351562952afb48bf847C96065531e724658Da2F';

class BlockchainService {
  constructor() {
    this.contractAddress = CONTRACT_ADDRESS_SEPOLIA;
    this.abi = SkillChainArtifact.abi;
    this.isWeb3Enabled = false;
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  /**
   * Check if MetaMask or other Web3 provider is present
   */
  async checkWeb3() {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        this.provider = new BrowserProvider(window.ethereum);
        this.isWeb3Enabled = true;
        return true;
      } catch (err) {
        console.warn('Failed to initialize browser provider:', err);
      }
    }
    this.isWeb3Enabled = false;
    return false;
  }

  /**
   * Connect Wallet
   */
  async connectWallet(forcePrompt = false) {
    const isAvailable = await this.checkWeb3();
    if (!isAvailable) {
      throw new Error('MetaMask or another Web3 wallet browser extension was not found. Please install MetaMask to interact with the blockchain.');
    }

    try {
      // Force MetaMask account selection prompt only if requested
      if (forcePrompt) {
        try {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          });
        } catch (permErr) {
          console.warn('MetaMask account selection permission requested failed or rejected:', permErr);
        }
      }

      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      this.contract = new Contract(this.contractAddress, this.abi, this.signer);

      // Check if user is admin or active institution
      let isAdmin = false;
      try {
        const contractAdmin = await this.contract.admin();
        isAdmin = contractAdmin.toLowerCase() === address.toLowerCase();
      } catch (e) {
        // Ignored fallback
      }

      let isInstitution = false;
      let institutionName = '';
      try {
        const inst = await this.contract.institutions(address);
        isInstitution = inst.active;
        institutionName = inst.name;
      } catch (e) {
        // Ignored fallback
      }

      const user = {
        address,
        formattedAddress: `${address.substring(0, 6)}...${address.substring(38)}`,
        mode: 'blockchain',
        isAdmin,
        isInstitution,
        institutionName
      };
      localStorage.setItem('skillchain_connected_wallet', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect Wallet
   */
  disconnectWallet() {
    localStorage.removeItem('skillchain_connected_wallet');
    this.signer = null;
    this.contract = null;
  }

  /**
   * Get Active User Status
   */
  getCurrentUser() {
    const user = localStorage.getItem('skillchain_connected_wallet');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Revoke Certificate on-chain
   */
  async revokeCertificate(certId) {
    if (!this.contract) {
      throw new Error('Web3 Wallet is not connected. Please connect your wallet first.');
    }
    try {
      const tx = await this.contract.revokeCertificate(certId);
      const receipt = await tx.wait();
      return { success: true, hash: receipt.hash };
    } catch (error) {
      console.error('Blockchain revocation failed:', error);
      throw error;
    }
  }

  /**
   * Public Verification / Validation of Certificate directly on-chain
   */
  async verifyCertificate(certId) {
    await this.checkWeb3();
    if (!this.isWeb3Enabled) {
      throw new Error('MetaMask or another Web3 provider is not available.');
    }

    try {
      const readOnlyContract = new Contract(this.contractAddress, this.abi, this.provider);
      const [isValid, certificateHash, studentHash, issuer, issuedAt, revoked] = await readOnlyContract.verifyCertificate(certId);

      if (issuer !== '0x0000000000000000000000000000000000000000') {
        return {
          exists: true,
          isValid: isValid && !revoked,
          id: certId,
          ipfsHash: certificateHash,
          studentHash,
          issuer,
          issuedAt: new Date(Number(issuedAt) * 1000).toISOString(),
          revoked,
          mode: 'blockchain'
        };
      }
    } catch (e) {
      console.error('Failed on-chain verification call:', e);
      throw e;
    }

    return { exists: false, isValid: false };
  }
}

export const blockchainService = new BlockchainService();
