const hre = require("hardhat");
// npx hardhat run scripts\main.js --network one
async function main() {
    // const _owner = '0x1109c5BB8Abb99Ca3BBeff6E60F5d3794f4e0473';
    const _owner = '0x78B3Ec25D285F7a9EcA8Da8eb6b20Be4d5D70E84';
    const _feeAddress = '0x1109c5BB8Abb99Ca3BBeff6E60F5d3794f4e0473';
  const _main = await hre.ethers.getContractFactory("Main");
  const main = await _main.deploy(_owner, _feeAddress);
  await main.deployed();
  console.log("main:", main.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
