import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactPath = path.join(__dirname, 'artifacts', 'contracts', 'SkillChain.sol', 'SkillChain.json');

let abi = [];
try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  abi = artifact.abi;
} catch (err) {
  console.error('Failed to load SkillChain ABI in backend:', err);
}

const CONTRACT_ADDRESS = '0x2351562952afb48bf847C96065531e724658Da2F';

let provider = null;
let wallet = null;
let contract = null;

if (process.env.ALCHEMY_API_KEY) {
  const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  provider = new ethers.JsonRpcProvider(rpcUrl);
  
  if (process.env.SEPOLIA_PRIVATE_KEY) {
    try {
      wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
      contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
      console.log('🔗 Connected to Sepolia contract successfully with admin wallet:', wallet.address);
    } catch (err) {
      console.error('Failed to initialize admin wallet:', err);
      contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    }
  } else {
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  }
} else {
  console.warn('⚠️ ALCHEMY_API_KEY not found in backend environment. Smart contract features disabled.');
}

export { provider, wallet, contract, CONTRACT_ADDRESS };
