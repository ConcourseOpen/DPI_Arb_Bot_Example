require("dotenv").config();
jest.setTimeout(100000);

const { ethers } = require("ethers");
const erc20 = require("@studydefi/money-legos/erc20");
const uniswap = require("@studydefi/money-legos/uniswap");
const addresses = require('../addresses.json');
const factory = require('../build/contracts/IUniswapV2Factory.json');
const abi = require('../abi.json');
const setToken = require('../build/contracts/ISetToken.json');
const issueModuleJson = require('../build/contracts/IBasicIssuanceModule.json');
const DFP = require('../build/contracts/DefiPulseIndexTrade.json');


const fromWei = (x, u = 18) => ethers.utils.formatUnits(x, u);

describe("DFP", () => {
  let dfpIndex, wallet, uniswapFactory, issueModule, controller, tokens = {};

  beforeAll(async () => {
    wallet = global.wallet;
    web3 = global.web3;
    dfpIndex = new ethers.Contract(DFP.address, setToken.abi, wallet);
  });

  test("verify token balances", async () => {
    let calc = await dfpIndex.computeProfitMaximizingTrade(100, 200, 600000, 8000000);
    console.log(calc);
  });


  test("issue dfp Index", async () => {
    let COMPAllowance = await tokens.COMP.allowance(wallet.address, SetCtrl);
    let SNXAllowance = await tokens.SNX.allowance(wallet.address, SetCtrl);
    let ZRXAllowance = await tokens.ZRX.allowance(wallet.address, SetCtrl);
    let KNCAllowance = await tokens.KNC.allowance(wallet.address, SetCtrl);
    let LENDAllowance = await tokens.LEND.allowance(wallet.address, SetCtrl);
    let BALAllowance = await tokens.BAL.allowance(wallet.address, SetCtrl);
    let RENAllowance = await tokens.REN.allowance(wallet.address, SetCtrl);
    let LRCAllowance = await tokens.LRC.allowance(wallet.address, SetCtrl);
    let BNTAllowance = await tokens.BNT.allowance(wallet.address, SetCtrl);
    let MKRAllowance = await tokens.MKR.allowance(wallet.address, SetCtrl);
    let NMRAllowance = await tokens.NMR.allowance(wallet.address, SetCtrl);
    expect(fromWei(MKRAllowance)).toBe("100.0");
    expect(fromWei(COMPAllowance)).toBe("100.0");
    expect(fromWei(LRCAllowance)).toBe("100.0");
    expect(fromWei(BNTAllowance)).toBe("100.0");
    expect(fromWei(RENAllowance)).toBe("100.0");
    expect(fromWei(BALAllowance)).toBe("100.0");
    expect(fromWei(LENDAllowance)).toBe("100.0");
    expect(fromWei(KNCAllowance)).toBe("100.0");
    expect(fromWei(ZRXAllowance)).toBe("100.0");
    expect(fromWei(SNXAllowance)).toBe("100.0");
    expect(fromWei(NMRAllowance)).toBe("100.0");

    let positions = await dfpIndex.getPositions();

    let l = await issueModule.issue(dfpIndex.address, ethers.utils.parseEther("2"), wallet.address);
    let DFIBalance = await dfpIndex.balanceOf(wallet.address);
    expect(fromWei(DFIBalance)).toBe("2.0");
  });

  test("redeem dfp", async () => {
    let DFIBalance = await dfpIndex.balanceOf(wallet.address);
    expect(fromWei(DFIBalance)).toBe("2.0");

    await issueModule.redeem(dfpIndex.address, ethers.utils.parseEther("2"));
    DFIBalance = await dfpIndex.balanceOf(wallet.address);
    expect(fromWei(DFIBalance)).toBe("0.0");
  });

  test("successful flash loans", async () => {
  });

  test("slippage", async () => {
  });

  test("trade results in net profit", async () => {
  });

});
