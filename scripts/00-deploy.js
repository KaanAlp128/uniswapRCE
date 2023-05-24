// Setup and deploy all the contracts
const { ethers, network, run } = require("hardhat");

async function main() {
  console.log("Fetching contracts");
  const contractFactory = await ethers.getContractFactory("UniswapV3Factory");
  const contractPool = await ethers.getContractFactory("UniswapV3Pool");
  const contractManager = await ethers.getContractFactory("UniswapV3Manager");

  const provider = new ethers.providers.JsonRpcProvider();
  const owner = await provider.getSigner(0);
  const user = await provider.getSigner(1);

  // Deploy the UniswapV3Factory contract
  console.log("Deploying UniswapV3Factory");
  const uniswapFactory = await contractFactory.deploy();

  // Deploy the UniswapV3Manager contract
  console.log("Deploying UniswapV3Manager");
  const uniswapManager = await contractManager.deploy();
  

  // Since the pools needs to have tokens, we will deploy our own ERC20 tokens
  const rowaERC20 = await ethers.getContractFactory("RowaToken");
  const maticERC20 = await ethers.getContractFactory("ERC20MaticToken");
  console.log("Deploying token contracts");
  const RowaToken = await rowaERC20.deploy();
  const MaticToken = await maticERC20.deploy();

  // Create a new liquidity pool Rowa/Matic with a fee of 0.30%
  console.log("------------------------------");
  console.log("Creating a new pool");
  const POOL_FEE = 3000;
  await uniswapFactory.createPool(
    RowaToken.address,
    MaticToken.address,
    POOL_FEE
  );
  const lowerTick = -3000;
  const upperTick = 3000;

  // Grab the pool's address so we can use it later
  const uniswapPoolAddress = await uniswapFactory.getPool(
    RowaToken.address,
    MaticToken.address,
    POOL_FEE
  );
  console.log("Address of the new pool: " + uniswapPoolAddress);

  // Save the pool in a const and initializing it
  const uniswapPool = await contractPool.attach(uniswapPoolAddress);
  const sqrtPriceX96 = ethers.BigNumber.from(
    '1221518815445764345980326290161970195'
  );
  await uniswapPool.initialize(sqrtPriceX96);
  console.log("Pool initialized!");

  // For the sake of this example, give free tokens to our user so later he can spend them as a LP
  console.log("Transfering Tokens...");
  console.log("------------------------------");
  const userAddress = await user.getAddress();
  const ownerAddress = await owner.getAddress();
  await RowaToken.transfer(ownerAddress, ethers.utils.parseEther('250000'));
  await MaticToken.transfer(ownerAddress,ethers.utils.parseEther('10'));
  await RowaToken.connect(owner).transfer(userAddress,ethers.utils.parseEther('250000'));
  await MaticToken.connect(owner).transfer(userAddress, ethers.utils.parseEther('10'));

  // Approve the manager from the user wallet so it can spend on his behalf
  console.log("Approving UniswapV3Manager");
  console.log("------------------------------");
  await RowaToken.connect(user).approve(
    uniswapManager.address,
    ethers.utils.parseEther('250000')
  );
  await MaticToken.connect(user).approve(
    uniswapManager.address,
    ethers.utils.parseEther('10')
  );
  const ROWAallowance = await RowaToken.allowance(
    userAddress,
    uniswapManager.address
  );
  const MATICallowance = await MaticToken.allowance(
    userAddress,
    uniswapManager.address
  );
  console.log(
    "Allowances:\n" +
      "ROWA: " +
      ethers.utils.formatEther(ROWAallowance) +
      "\n" +
      "MATIC: " +
      ethers.utils.formatEther(MATICallowance)
  );
  const rowaBalance = await RowaToken.balanceOf(userAddress);
  const maticBalance = await MaticToken.balanceOf(userAddress);
  console.log("BalanceofRowa: " + ethers.utils.formatEther(rowaBalance));
  console.log("BalanceofMatic: " + ethers.utils.formatEther(maticBalance));

  // Mint a position with our parameters
  console.log("Minting a position");
  console.log("------------------------------");
  // Create encoded data to be passed to the mint function
  const abi = ethers.utils.defaultAbiCoder;
  const extraData = abi.encode(["address"], [ownerAddress]);
  console.log("Minting Pool....");
  

   await uniswapManager
    .connect(owner)
    .executeMint(
      uniswapPoolAddress,
      lowerTick,
      upperTick,
      ethers.utils.parseEther('100000'),
      extraData,
      { gasLimit: 3000000 }
    );

  // Verbose logging to show the change in our pool
  const insidePoolRowa = await uniswapPool.balance0();
  const insidePoolMatic = await uniswapPool.balance1();
  const balanceRowa = await RowaToken.balanceOf(userAddress);
  const balanceMatic = await MaticToken.balanceOf(userAddress);
  const poolBalanceRowa = await RowaToken.balanceOf(uniswapPoolAddress);
  const poolbalanceMatic = await MaticToken.balanceOf(uniswapPoolAddress);
  console.log(insidePoolRowa);
  console.log(insidePoolMatic);

  console.log("Minted successfully");
  console.log("User balance Rowa :" + ethers.utils.formatEther(balanceRowa));
  console.log("User balance Matic :" + ethers.utils.formatEther(balanceMatic));
  console.log(
    "Pool balance Rowa :" + ethers.utils.formatEther(poolBalanceRowa)
  );
  console.log(
    "Pool balance Matic :" + ethers.utils.formatEther(poolbalanceMatic)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
