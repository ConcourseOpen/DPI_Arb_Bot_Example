const Web3Connection = require("./web3-connection");
const Big = require("bignumber.js");
const ethers = require("ethers");
const axios = require("axios");
const SetTokenAbi = require("./abis/SetToken.json");
const ERC20Abi = require("./abis/erc20.json");
const IUniswapV2PairAbi = require("./abis/IUniswapV2Pair.json")
const DFPIndexTradeAbi = require("./abis/DFPIndexTrade.json");

const {
  ChainId,
  Token,
  WETH,
  Fetcher,
  Trade,
  Route,
  TokenAmount,
  TradeType,
} = require("@uniswap/sdk");
const { resolveProperties } = require("ethers/lib/utils");
const { Pair } = require("@uniswap/sdk");

let lastArbitrageDate;
async function checkPositions(web3) {
  const provider = new ethers.providers.InfuraProvider(
    "mainnet",
    process.env.INFURA_KEY
  );
  const SetToken = new web3.eth.Contract(
    SetTokenAbi,
    process.env.DFP_INDEX_ADDRESS
  );

  const positions = await SetToken.methods.getPositions().call();
  let ethSum = new Big(0);
  if (positions) {
    for (let position of positions) {
      let erc20 = new web3.eth.Contract(ERC20Abi, position.component);
      let decimals = await erc20.methods.decimals().call();
      
      let uniToken = new Token(ChainId.MAINNET, position.component, decimals);
      let pair ;
      if (position.component === "0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202") {
        // uniswap sdk fetcher returns the wrong address for the KNC-ETH pool...
        // so we have to construct the pair by hand, using the correct pool address
        const pool = new web3.eth.Contract(IUniswapV2PairAbi, "0xf49C43Ae0fAf37217bDcB00DF478cF793eDd6687")
        const reserves = await pool.methods.getReserves().call();
        pair = new Pair(
          new TokenAmount(WETH[ChainId.MAINNET], reserves.reserve0),
          new TokenAmount(uniToken, reserves.reserve1)
        )
      } else {
        pair = await Fetcher.fetchPairData(
          uniToken,
          WETH[uniToken.chainId],
          provider
        );
      }

      let route = new Route([pair], uniToken);
      let returnAmount = new Big(position.unit).times(
        route.midPrice.toSignificant(18)
      );
      ethSum = ethSum.plus(returnAmount);
    }
    console.log(`Component ETH Value: ${ethSum.toFixed(0)/1e18}`);
    let dfpIndexToken = new Token(
      ChainId.MAINNET,
      process.env.DFP_INDEX_ADDRESS,
      18
    );
    let pair = await Fetcher.fetchPairData(
      dfpIndexToken,
      WETH[dfpIndexToken.chainId],
      provider
    );

    let route = new Route([pair], dfpIndexToken);
    let returnAmount = new Big("1000000000000000000").times(
      route.midPrice.toSignificant(18)
    );

    let pctDiff = new Big(100).times(
      returnAmount.minus(ethSum).div(returnAmount.plus(ethSum).div(2)).abs()
    );

    console.log(`DFP Index Price: ${route.midPrice.toSignificant(18)}`);
    console.log(`Percentage Price Difference: ${pctDiff.toFixed(18)}`);
    if (pctDiff.gt(process.env.PRICE_THRESHOLD)) {
      if (lastArbitrageDate && checkDay(lastArbitrageDate, new Date())) {
        console.log("Already arbed today");
      } else {
        const newPrice = ethSum.div(Math.pow(10, 9));
        const arbed = await triggerArbitrage(newPrice.toFixed(0));
        console.log(arbed);
        if (arbed) {
          lastArbitrageDate = new Date();
          console.log("ARBITRAGE!");
        }
      }
    }
  }
}

function checkDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

let txSent = false;
async function triggerArbitrage(newPrice) {
  if (!txSent) {
    console.log(`New Price: ${newPrice}`);
    const provider = new ethers.providers.InfuraProvider(
      "mainnet",
      process.env.INFURA_KEY
    );
    const signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(
      provider
    );

    let DFPIndexTrade = new ethers.Contract(
      process.env.DFP_TRADE_ADDRESS,
      DFPIndexTradeAbi,
      signer
    );
    txSent = true;
    try {
      let gasPrice = await axios.get(
        `https://data-api.defipulse.com/api/v1/egs/api/ethgasAPI.json?api-key=${process.env.DPD_KEY}`
      );
      gasPrice = Number(gasPrice.data.fastest) / 10;
      let gasLimit = await DFPIndexTrade.estimateGas.initiateArbitrage(
        process.env.DFP_INDEX_ADDRESS,
        newPrice,
        { value: ethers.utils.parseEther('1.0') }
      );

      let profit = await DFPIndexTrade.callStatic.initiateArbitrage(
        process.env.DFP_INDEX_ADDRESS,
        newPrice,
        { value: ethers.utils.parseEther('1.0') }
      );
      console.log(`Expected Return Amount: ${profit.toString()}`);
      console.log('Sending Arbitrage tx...');
      let tx = await DFPIndexTrade.initiateArbitrage(
        process.env.DFP_INDEX_ADDRESS,
        newPrice,
        {
          value: ethers.utils.parseEther('1.0'),
          gasLimit,
          gasPrice: ethers.utils.parseUnits(gasPrice, "gwei"),
        }
      );
      txSent = false;
      return true;
    } catch (e) {
      console.log(e);
      txSent = false;
      return false;
    }
  } else {
    return false;
  }
}

let BLOCK_LISTENER;
const _connectListener = () => {
  BLOCK_LISTENER = new Web3Connection(listen, "BlockListener");
  return BLOCK_LISTENER;
};

async function listen(web3) {
  console.log("Starting Block Watcher...");
  await checkPositions(web3);
  console.log(`finished getting data.....\n\n`);
  web3.eth.subscribe("newBlockHeaders", async (error, result) => {
    if (error) {
      console.error(new Error(error));
      return;
    }

    if (result.number) {
      console.log(`Getting Positions for block: ${result.number} >>>>>`);
      await checkPositions(web3);
      console.log(
        `finished getting data for block: ${result.number} .....\n\n`
      );
    }
  });
}

module.exports = _connectListener();
