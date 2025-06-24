async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Oracle = await ethers.getContractFactory("Lamina1oracle");
  const oracle = await Oracle.deploy();
  await oracle.deployed();

  console.log("Oracle deployed to:", oracle.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
