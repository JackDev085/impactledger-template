import hre from "hardhat";

async function main() {
  console.log("🚀 Starting SkillChain contract deployment...");
  
  // Get the contract factory
  const SkillChain = await hre.ethers.getContractFactory("SkillChain");
  
  // Deploy the contract
  const contract = await SkillChain.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log(`✅ SkillChain successfully deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
