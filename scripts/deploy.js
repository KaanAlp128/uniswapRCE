// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = hre.ethers.utils.parseEther("0.001");

  const Lock = await hre.ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  await lock.deployed();

  console.log(
    `Lock with ${ethers.utils.formatEther(
      lockedAmount
    )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Setup and deploy all the contracts
console.log("Fetching contracts");
const contractFactory = $contracts["UniswapV3Factory"];
const contractPool = $contracts["UniswapV3Pool"];
const contractManager = $contracts["UniswapV3Manager"];

const provider = new ethers.providers.JsonRpcProvider($rpcUrl);
const user = await provider.getSigner(0);
const owner = await provider.getSigner(1);


const uniswapFactoryFactory = new ethers.ContractFactory(contractFactory.abi, contractFactory.evm.bytecode, owner);
const uniswapPoolFactory = new ethers.ContractFactory(contractPool.abi, contractPool.evm.bytecode, owner);
const uniswapManagerFactory = new ethers.ContractFactory(contractManager.abi, contractManager.evm.bytecode, user);

// Deploy the UniswapV3Factory contract
console.log("Deploying UniswapV3Factory");
const uniswapFactory = await uniswapFactoryFactory.deploy();

// Deploy the UniswapV3Manager contract
console.log("Deploying UniswapV3Manager");
const uniswapManager = await uniswapManagerFactory.deploy();




// Since the pools needs to have tokens, we will deploy our own ERC20 tokens
const contractERC20 = $contracts["ERC20"];
const erc20 = new ethers.ContractFactory(contractERC20.abi, contractERC20.evm.bytecode, owner);
console.log("Deploying ERC20 contracts");
const DAItoken = await erc20.deploy('DAI', 'DAI');
const WBTCtoken = await erc20.deploy('WBTC', 'WBTC');





// Create a new liquidity pool DAI/WBTC with a fee of 0.30%
console.log("Creating a new pool");
const POOL_FEE = 3000;
await uniswapFactory.createPool(DAItoken.address, WBTCtoken.address, POOL_FEE);

// Grab the pool's address so we can use it later
const uniswapPoolAddress = await uniswapFactory.getPool(DAItoken.address, WBTCtoken.address, POOL_FEE); 
console.log("Address of the new pool: " + uniswapPoolAddress);

// Save the pool in a const and initializing it
const uniswapPool = await uniswapPoolFactory.attach(uniswapPoolAddress);
const sqrtPriceX96 = ethers.BigNumber.from('1221518815445764345980326290161970195');
await uniswapPool.initialize(sqrtPriceX96);
console.log("Pool initialized!");




// For the sake of this example, give free tokens to our user so later he can spend them as a LP
const userAddress = await user.getAddress();
await DAItoken.connect(owner).transfer(userAddress, ethers.utils.parseEther('250000'));
await WBTCtoken.connect(owner).transfer(userAddress, ethers.utils.parseEther('10'));




// Approve the manager from the user wallet so it can spend on his behalf
console.log('Approving UniswapV3Manager');
await DAItoken.connect(user).approve(uniswapManager.address, ethers.utils.parseEther('250000'));
await WBTCtoken.connect(user).approve(uniswapManager.address, ethers.utils.parseEther('10'));
const DAIallowance = await DAItoken.allowance(userAddress, uniswapManager.address);
const WBTCallowance = await WBTCtoken.allowance(userAddress, uniswapManager.address);
console.log('Allowances:\n' +
            'DAI: ' + ethers.utils.formatEther(DAIallowance) + '\n' +
            'WBTC: ' + ethers.utils.formatEther(WBTCallowance) 
);



// Mint a position with our parameters
console.log("Minting a position");
// Create encoded data to be passed to the mint function 
const abi = ethers.utils.defaultAbiCoder;
const extraData = abi.encode(
    ["address"],
    [ userAddress ]);

await uniswapManager.connect(user).executeMint(uniswapPoolAddress, -3000, 3000, ethers.utils.parseEther('100000'), extraData);


// Verbose logging to show the change in our pool
const balanceDAI = await DAItoken.balanceOf(userAddress);
const balanceWBTC = await WBTCtoken.balanceOf(userAddress);
const poolBalanceDAI = await DAItoken.balanceOf(uniswapPoolAddress);
const poolBalanceWBTC = await WBTCtoken.balanceOf(uniswapPoolAddress);
console.log("Minted successfully");
console.log("User balance DAI :" + ethers.utils.formatEther(balanceDAI));
console.log("User balance WBTC :" + ethers.utils.formatEther(balanceWBTC));
console.log("Pool balance DAI :" + ethers.utils.formatEther(poolBalanceDAI));
console.log("Pool balance WBTC :" + ethers.utils.formatEther(poolBalanceWBTC));