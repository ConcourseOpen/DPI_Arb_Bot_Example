const Arb = artifacts.require("DefiPulseIndexTrade");
const IWETH = artifacts.require('IWETH');
const ERC20 = artifacts.require('IERC20');
const ISET = artifacts.require('ISetToken');

let { DPIUniswapPool, Controller, SetTokenCreator, BasicIssuanceModule, DPI, WETH } = require('../addresses.json');

contract('DefiPulseIndexTrade', (accounts) => {
  let dfp;
  let arb;
  let weth;

  it("should call a function that depends on a linked library", async ()=> {
    return Arb.deployed().then(function(instance) {
      dfp = instance;
      return dfp.getIndexAmountToBuyOrSell.call(
        DPI,
        "1000"
      );
    }).then(function(result) {
      return ERC20.at(WETH)
      //assert.equal(parseInt(balance), 5555);
    }).then((result) => {
      return result.balanceOf(accounts[0])
    }).then((result) => {
      console.log(result.toString());
    });
  });

  it("should caluclte best price`", async() => {
    let k =  await dfp.getIndexAmountToBuyOrSell(DPI, "340180000")
    console.log(k.amountIn.toString());
    console.log('-----------');
    k =  await dfp.getIndexAmountToBuyOrSell(DPI, "300180000")
    console.log(k.amountIn.toString());
    console.log('-----------');
    k =  await dfp.getIndexAmountToBuyOrSell(DPI, "99999317000000")
    console.log(k.amountIn.toString());
    console.log('-----------');


  });
  it("should buy  Index333", async() => {
    let arb = await Arb.deployed();
    await arb.approveToken(DPI)
    await arb.approveToken(WETH)
    //let allowance = await arb.getAllowance(WETH);
    weth = await IWETH.at(WETH)
    wetherc = await ERC20.at(WETH)
    await weth.deposit({value: "1200000000000000000"});
    await wetherc.transfer(arb.address, "1200000000000000000");
    await dfp.approveSetToken(DPI);
    let wethBalance = await wetherc.balanceOf(arb.address);
    console.log(web3.utils.fromWei(await web3.eth.getBalance(accounts[0])));
    let b = await  dfp.initiateArbitrage(
      DPI,
      "100180000",
      {value:web3.utils.toWei("1", "ether")}
    );
    let dpi = await ISET.at(DPI);
    let positions = await dpi.getPositions();
    for(let i=0; i < positions.length; i++) {
      let p = positions[i];
      let snx = await ERC20.at(p.component)
      let balance = await snx.balanceOf(dfp.address);
      console.log(`${p.component} has balance of ${balance} of ${p.unit}`);
    };
    let dpis = await ERC20.at(DPI)
    let balance = await dpis.balanceOf(dfp.address);
    console.log(balance);
    //console.log(web3.utils.fromWei(await web3.eth.getBalance(accounts[0])));
  });
//
});
