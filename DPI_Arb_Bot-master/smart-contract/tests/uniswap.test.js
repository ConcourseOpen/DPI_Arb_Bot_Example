require("dotenv").config();
jest.setTimeout(100000);

const { ethers } = require("ethers");
const erc20 = require("@studydefi/money-legos/erc20");
const uniswap = require("@studydefi/money-legos/uniswap");
const addresses = require('../addresses.json');
const factory = require('../build/contracts/IUniswapV2Factory.json');
const abi = require('../abi.json');

const fromWei = (x, u = 18) => ethers.utils.formatUnits(x, u);

describe("uniswap", () => {
  let wallet, daiMaster, daiContract, uniswapFactory, web3;

  beforeAll(async () => {
    wallet = global.wallet;
    web3 = global.web3;
    let network = process.env.network;

    if(network == 'KOVAN') {
      daiContract = new ethers.Contract(addresses.MKR, abi.erc20Mock, wallet);
      uniswapFactory = new ethers.Contract(addresses.UniswapFactory, factory.abi, wallet);
    } 
    else /* mainnet */ {
      daiContract = new ethers.Contract(erc20.dai.address, erc20.dai.abi, wallet);
      uniswapFactory = new ethers.Contract(uniswap.factory.address, factory.abi, wallet);
    }

    daiMaster = new web3.eth.Contract(erc20.dai.abi, daiContract.address, {from: daiContract.address});

  });

  test("get tokens", async () => {
    const daiExchangeAddress = await uniswapFactory.allPairs(7);

    const daiExchange = new ethers.Contract(
      daiExchangeAddress,
      uniswap.exchange.abi,
      wallet,
    );

    // collect info on state before the swap
    const ethBefore = await wallet.getBalance();
    const daiBefore = await daiContract.balanceOf(wallet.address);

    await daiContract.greedIsGood(wallet.address, ethers.utils.parseEther("11100"));

    // collect info on state after the swap
    const ethAfter = await wallet.getBalance();
    const daiAfter = await daiContract.balanceOf(wallet.address);

    expect(fromWei(daiBefore)).toBe("0.0");
    expect(fromWei(daiAfter)).toBe("11100.0");
  });
});
