const Web3Connection = require("./web3-connection");
const Big = require("bignumber.js");
const ethers = require("ethers");
const Web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider");
const SetTokenAbi = require("./abis/SetToken.json");
const ERC20Abi = require("./abis/erc20.json");
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
      let pair = await Fetcher.fetchPairData(
        uniToken,
        WETH[uniToken.chainId],
        provider
      );

      let route = new Route([pair], uniToken);
      let returnAmount = new Big(position.unit).times(
        route.midPrice.toSignificant(18)
      );
      ethSum = ethSum.plus(returnAmount);
    }
    console.log(`Component ETH Value: ${ethSum.toFixed(0)}`);
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

    if (pctDiff >= process.env.PRICE_THRESHOLD) {

        if (lastArbitrageDate && checkDay(lastArbitrageDate, new Date())) {
          console.log('Already arbed today');
        } else {
          const newPrice = ethSum.div(Math.pow(10,9))
          const arbed = await triggerArbitrage(newPrice.toFixed(0));
          if (arbed) {
            lastArbitrageDate = new Date();
            console.log('ARBITRAGE!')
          }
        }
    }
  }
}

function checkDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

let txSent = false;
async function triggerArbitrage(newPrice) {
  if (!txSent) {
    console.log(`New Price: ${newPrice}`)
    const provider = new HDWalletProvider(
      process.env.MNEMONIC,
      `https://mainnet.infura.io/ws/v3/${process.env.INFURA_KEY}`
    );

    let web3 = new Web3(provider);
    let DFPIndexTrade = new web3.eth.Contract(
      DFPIndexTradeAbi,
      process.env.DFP_TRADE_ADDRESS
    );

    DFPIndexTrade.methods
      .initiateArbitrage(process.env.DFP_INDEX_ADDRESS, newPrice)
      .on("transactionHash", (hash) => {
        txSent = true;
        console.log(`Mining Arbitrage Tx: ${hash}...`);
      })
      .on("confirmation", (confirmation, receipt) => {
        txSent = false;
        console.log("Tx Confirmed!", confirmation);
        return true;
      })
      .on("error", (error) => {
        txSent = false;
        console.log(`Error submitting Arbitrage Tx: ${error}`);
        return false;
      });
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
  console.log(
    `finished getting data.....\n\n`
  );
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

