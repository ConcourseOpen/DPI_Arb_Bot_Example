require("dotenv").config();

const { ethers } = require("ethers");
const Ganache = require("ganache-core");
const NodeEnvironment = require("jest-environment-node");
const Web3 = require('web3');

console.log('sdgfdg');

const startChain = async () => {
  const ganache = Ganache.provider({
    fork: "http://127.0.0.1:8545",
    debug: true,
    network_id: 1,
    accounts: [
      {
        secretKey: process.env.PRIV_KEY_TEST,
        balance: ethers.utils.hexlify(ethers.utils.parseEther("1000")),
      },
    ],
  });

  const provider = new ethers.providers.Web3Provider(ganache);
  const wallet = new ethers.Wallet(process.env.PRIV_KEY_TEST, provider);
  const web3 = new Web3(ganache);

  return { web3, wallet };
};

class CustomEnvironment extends NodeEnvironment {

  constructor(config, context) {
    super(config);
    this.testPath = context.testPath;
    this.docblockPragmas = context.docblockPragmas;
  }

  async setup() {
    await super.setup();
    console.log('sdgfdg');

    const { wallet, web3 } = await startChain();
    this.wallet = wallet;
    this.global.wallet = wallet;
    this.global.web3 = web3;
  }

  async teardown() {
    console.log('sdgfdg');
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = CustomEnvironment;
