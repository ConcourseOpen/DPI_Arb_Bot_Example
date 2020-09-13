const DFPTrader = artifacts.require("DefiPulseIndexTrade");

let { Controller, SetTokenCreator, BasicIssuanceModule, DPI } = require('../addresses.json');

let UniswapFactory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
let UniswapRouter = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
let aaveProvider = '0x24a42fD28C976A61Df5D00D0599C34c4f90748c8'

module.exports = function (deployer) {
  deployer.deploy(DFPTrader, UniswapFactory, UniswapRouter, Controller, BasicIssuanceModule, aaveProvider, {gasPrice: web3.utils.toWei("85", "gwei"), gasLimit: "4303151"});
};
