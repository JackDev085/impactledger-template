import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import SkillChainArtifact from '../../../backend/artifacts/contracts/SkillChain.sol/SkillChain.json';

// LocalStorage Keys for Mock Fallback (Hackathon Demo Safe Mode)
const STORAGE_KEYS = {
  INSTITUTIONS: 'skillchain_mock_institutions',
  COURSES: 'skillchain_mock_courses',
  CERTIFICATES: 'skillchain_mock_certificates',
  CURRENT_USER: 'skillchain_current_user',
};

// Default Admin Address for local/mock demo
const DEFAULT_ADMIN = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Standard Hardhat Account 0
const CONTRACT_ADDRESS_LOCAL = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Standard Hardhat deployment slot
const CONTRACT_ADDRESS_SEPOLIA = '0x2351562952afb48bf847C96065531e724658Da2F';

/**
 * Initialize default mock data if not present
 */
function initMockData() {
  if (!localStorage.getItem(STORAGE_KEYS.INSTITUTIONS)) {
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify({
      [DEFAULT_ADMIN]: { name: 'SkillChain Admin Authority', wallet: DEFAULT_ADMIN, active: true, isAdmin: true }
    }));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify([
      { id: 1, institutionId: DEFAULT_ADMIN, name: 'Web3 & Solidity Developer', description: 'Complete smart contract coding boot camp.', workload: 40 },
      { id: 2, institutionId: DEFAULT_ADMIN, name: 'Advanced React Architecture', description: 'Modern design patterns, Vite, and state management.', workload: 32 }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify([]));
  }
}

initMockData();

class BlockchainService {
  constructor() {
    // Se o endereço da Sepolia tiver sido modificado pelo desenvolvedor, use ele. Caso contrário, use local.
    this.contractAddress = CONTRACT_ADDRESS_SEPOLIA !== '0xSEU_CONTRATO_DEPLOYADO_AQUI'
      ? CONTRACT_ADDRESS_SEPOLIA
      : CONTRACT_ADDRESS_LOCAL;
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
        console.warn('Failed to initialize browser provider, falling back to mock mode.', err);
      }
    }
    this.isWeb3Enabled = false;
    return false;
  }

  /**
   * Connect Wallet
   */
  async connectWallet() {
    const isAvailable = await this.checkWeb3();
    if (!isAvailable) {
      // Return mock user if in demo mode
      const mockUser = {
        address: DEFAULT_ADMIN,
        formattedAddress: `${DEFAULT_ADMIN.substring(0, 6)}...${DEFAULT_ADMIN.substring(38)}`,
        mode: 'mock',
        isAdmin: true,
        name: 'Demo Admin Authority'
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockUser));
      return mockUser;
    }

    try {
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      this.contract = new Contract(this.contractAddress, this.abi, this.signer);

      // Check if user is admin or active institution
      let isAdmin = false;
      try {
        const contractAdmin = await this.contract.admin();
        isAdmin = contractAdmin.toLowerCase() === address.toLowerCase();
      } catch (e) {
        isAdmin = address.toLowerCase() === DEFAULT_ADMIN.toLowerCase();
      }

      let isInstitution = false;
      let institutionName = '';
      try {
        const inst = await this.contract.institutions(address);
        isInstitution = inst.active;
        institutionName = inst.name;
      } catch (e) {
        // Fallback checks
      }

      const user = {
        address,
        formattedAddress: `${address.substring(0, 6)}...${address.substring(38)}`,
        mode: 'blockchain',
        isAdmin,
        isInstitution,
        institutionName
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
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
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.signer = null;
    this.contract = null;
  }

  /**
   * Get Active User Status
   */
  getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  }

  /**
   * 1. Register Institution (Admin Only)
   */
  async registerInstitution(walletAddress, name) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('No user connected');

    if (currentUser.mode === 'blockchain') {
      try {
        const tx = await this.contract.registerInstitution(walletAddress, name);
        const receipt = await tx.wait();
        return { success: true, hash: receipt.hash, mode: 'blockchain' };
      } catch (error) {
        console.error('Blockchain registration failed:', error);
        throw error;
      }
    } else {
      // Mock mode
      const insts = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTIONS));
      insts[walletAddress.toLowerCase()] = {
        name,
        wallet: walletAddress,
        active: true,
      };
      localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(insts));
      return { success: true, hash: 'mock_tx_' + Math.random().toString(36).substring(2, 15), mode: 'mock' };
    }
  }

  /**
   * Toggle Institution Active Status
   */
  async setInstitutionStatus(walletAddress, active) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('No user connected');

    if (currentUser.mode === 'blockchain') {
      try {
        const tx = await this.contract.setInstitutionStatus(walletAddress, active);
        const receipt = await tx.wait();
        return { success: true, hash: receipt.hash, mode: 'blockchain' };
      } catch (error) {
        console.error('Blockchain status change failed:', error);
        throw error;
      }
    } else {
      const insts = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTIONS));
      if (insts[walletAddress.toLowerCase()]) {
        insts[walletAddress.toLowerCase()].active = active;
        localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(insts));
        return { success: true, hash: 'mock_tx_' + Math.random().toString(36).substring(2, 15), mode: 'mock' };
      }
      throw new Error('Institution not found');
    }
  }

  /**
   * Get List of Institutions
   */
  async getInstitutions() {
    const insts = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTIONS)) || {};
    return Object.values(insts);
  }

  /**
   * 2. Register Course (stored in off-chain database/local state)
   */
  async registerCourse(name, description, workload) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('No user connected');

    const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES)) || [];
    const newCourse = {
      id: Date.now(),
      institutionId: currentUser.address,
      name,
      description,
      workload: parseInt(workload, 10),
      createdAt: new Date().toISOString()
    };

    courses.push(newCourse);
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    return newCourse;
  }

  /**
   * Get Courses
   */
  async getCourses() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES)) || [];
  }

  /**
   * 3 & 4. Issue Certificate and Register Hash on Blockchain
   */
  async issueCertificate(studentName, studentIdentifier, courseId, pdfIpfsHash) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('No user connected');

    const courses = await this.getCourses();
    const course = courses.find(c => c.id === Number(courseId));
    if (!course) throw new Error('Course not found');

    const certId = Math.floor(Math.random() * 900000000) + 100000000; // Generate a unique 9-digit ID
    // Create an identifier hash representing the student
    const encoder = new TextEncoder();
    const data = encoder.encode(studentIdentifier.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const studentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    let blockchainTx = '';

    if (currentUser.mode === 'blockchain') {
      try {
        const tx = await this.contract.issueCertificate(certId, pdfIpfsHash, studentHash);
        const receipt = await tx.wait();
        blockchainTx = receipt.hash;
      } catch (error) {
        console.error('Blockchain certificate registration failed:', error);
        throw error;
      }
    } else {
      blockchainTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    const certificates = JSON.parse(localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) || [];
    const newCert = {
      id: certId,
      studentName,
      studentIdentifier,
      studentHash,
      courseId: course.id,
      courseName: course.name,
      workload: course.workload,
      ipfsHash: pdfIpfsHash,
      blockchainTx,
      issuer: currentUser.address,
      issuerName: currentUser.institutionName || 'Demo Institution',
      issuedAt: new Date().toISOString(),
      status: 'active'
    };

    certificates.push(newCert);
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
    return newCert;
  }

  /**
   * Revoke Certificate
   */
  async revokeCertificate(certId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('No user connected');

    if (currentUser.mode === 'blockchain') {
      try {
        const tx = await this.contract.revokeCertificate(certId);
        const receipt = await tx.wait();
        // Update local status too
        const certs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) || [];
        const updated = certs.map(c => c.id === Number(certId) ? { ...c, status: 'revoked' } : c);
        localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(updated));
        return { success: true, hash: receipt.hash };
      } catch (error) {
        console.error('Blockchain revocation failed:', error);
        throw error;
      }
    } else {
      const certs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) || [];
      const updated = certs.map(c => c.id === Number(certId) ? { ...c, status: 'revoked' } : c);
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(updated));
      return { success: true, hash: 'mock_revoke_tx_' + Math.random().toString(36).substring(2, 15) };
    }
  }

  /**
   * Get Certificates issued by current user
   */
  async getIssuedCertificates() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    const certs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) || [];
    return certs.filter(c => c.issuer.toLowerCase() === currentUser.address.toLowerCase());
  }

  /**
   * 5. Public Verification / Validation of Certificate
   */
  async verifyCertificate(certId) {
    // Check local storage records
    const certs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) || [];
    const certLocal = certs.find(c => c.id === Number(certId));

    await this.checkWeb3();

    // Attempt contract call if provider is available
    if (this.isWeb3Enabled) {
      try {
        const readOnlyContract = new Contract(this.contractAddress, this.abi, this.provider);
        const [isValid, certificateHash, studentHash, issuer, issuedAt, revoked] = await readOnlyContract.verifyCertificate(certId);

        if (issuer !== '0x0000000000000000000000000000000000000000') {
          // Fetch additional local details if matches
          return {
            exists: true,
            isValid,
            id: certId,
            ipfsHash: certificateHash,
            studentHash,
            issuer,
            issuedAt: new Date(Number(issuedAt) * 1000).toISOString(),
            revoked,
            // Fallbacks from database
            studentName: certLocal ? certLocal.studentName : 'Registered Student',
            courseName: certLocal ? certLocal.courseName : 'Verified Course',
            workload: certLocal ? certLocal.workload : 0,
            blockchainTx: certLocal ? certLocal.blockchainTx : 'Verified on Contract'
          };
        }
      } catch (e) {
        console.warn('Failed contract verification call, falling back to database lookup:', e);
      }
    }

    // Fallback to local storage (Mock Mode verification)
    if (certLocal) {
      // Check if institution is active
      const insts = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTIONS)) || {};
      const issuerInst = insts[certLocal.issuer.toLowerCase()];
      const isIssuerActive = issuerInst ? issuerInst.active : true;

      return {
        exists: true,
        isValid: certLocal.status === 'active' && isIssuerActive,
        id: certLocal.id,
        studentName: certLocal.studentName,
        courseName: certLocal.courseName,
        workload: certLocal.workload,
        ipfsHash: certLocal.ipfsHash,
        blockchainTx: certLocal.blockchainTx,
        issuer: certLocal.issuer,
        issuerName: issuerInst ? issuerInst.name : certLocal.issuerName,
        issuedAt: certLocal.issuedAt,
        revoked: certLocal.status === 'revoked',
        mode: 'mock'
      };
    }

    return { exists: false, isValid: false };
  }
}

export const blockchainService = new BlockchainService();
