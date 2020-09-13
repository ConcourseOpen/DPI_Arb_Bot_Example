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


const { network } = process.env;
const fromWei = (x, u = 18) => ethers.utils.formatUnits(x, u);

let TOKENS, SetCtrl, DFP, SetIssueModule;
if(network == 'KOVAN') {
  const { COMP, MKR, SNX, ZRX, KNC, LEND, BAL, REN, LRC, BNT, NMR, DFPIndex, BasicIssuanceModule, Controller } = addresses;
  TOKENS = { COMP, MKR, SNX, ZRX, KNC, LEND, BAL, REN, LRC, BNT, NMR };
  DFP = DFPIndex;
  IssueModule = BasicIssuanceModule;
  SetCtrl = Controller

}

describe("uniswap", () => {
  let dfpIndex, wallet, uniswapFactory, issueModule, controller, tokens = {};

  beforeAll(async () => {
    wallet = global.wallet;
    web3 = global.web3;
    let network = process.env.network;

    dfpIndex = new ethers.Contract(DFP, setToken.abi, wallet);
    issueModule = new ethers.Contract(IssueModule, abi.issueModule, wallet);
    if(network == 'KOVAN') {
      uniswapFactory = new ethers.Contract(addresses.UniswapFactory, factory.abi, wallet);
    } 
    else /* mainnet */ {
      uniswapFactory = new ethers.Contract(uniswap.factory.address, factory.abi, wallet);
    }
    // Define Token Contracts
    let tokenArray = Object.keys(TOKENS);
    for(let i=0; i<tokenArray.length; i++) {
      let token = tokenArray[i];
      let tokenAddress = addresses[token];
      let contract = new ethers.Contract(tokenAddress, abi.erc20Mock, wallet);
      await contract.greedIsGood(wallet.address, ethers.utils.parseEther("100"));
      await contract.approve(SetCtrl, ethers.utils.parseEther("100"));
      tokens[token] = contract;
    }
  });

  test("verify token balances", async () => {
    const compAmount = await tokens.COMP.balanceOf(wallet.address);
    const mkrAmount = await tokens.MKR.balanceOf(wallet.address);
    const snxAmount = await tokens.SNX.balanceOf(wallet.address);
    const zrxAmount = await tokens.ZRX.balanceOf(wallet.address);
    const kncAmount = await tokens.KNC.balanceOf(wallet.address);
    const lendAmount = await tokens.LEND.balanceOf(wallet.address);
    const balAmount = await tokens.BAL.balanceOf(wallet.address);
    const renAmount = await tokens.REN.balanceOf(wallet.address);
    const lrcAmount = await tokens.LRC.balanceOf(wallet.address);
    const bntAmount = await tokens.BNT.balanceOf(wallet.address);
    const nmrAmount = await tokens.NMR.balanceOf(wallet.address);

    expect(fromWei(compAmount)).toBe("100.0");
    expect(fromWei(mkrAmount)).toBe("100.0");
    expect(fromWei(snxAmount)).toBe("100.0");
    expect(fromWei(zrxAmount)).toBe("100.0");
    expect(fromWei(kncAmount)).toBe("100.0");
    expect(fromWei(lendAmount)).toBe("100.0");
    expect(fromWei(balAmount)).toBe("100.0");
    expect(fromWei(renAmount)).toBe("100.0");
    expect(fromWei(lrcAmount)).toBe("100.0");
    expect(fromWei(bntAmount)).toBe("100.0");
    expect(fromWei(nmrAmount)).toBe("100.0");
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

});
