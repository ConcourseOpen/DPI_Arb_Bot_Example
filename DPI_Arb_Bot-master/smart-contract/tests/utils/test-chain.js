require("dotenv").config();

const { ethers } = require("ethers");
const ganache = require("ganache-core");

const PORT = 7545;

// fork off mainnet with a specific account preloaded with 1000 ETH
const network = (process.env.network || 'MAINNET').toUpperCase();

const fork = (() => {
  switch(network) {
//    case 'KOVAN': return process.env.KOVAN_NODE_URL;
    case 'MAINNET': return process.env.MAINNET_NODE_URL;
    default: return process.env.MAINNET_NODE_URL;
  }
})()

let unlocked_accounts = [];

console.log(`unlocked accounts: ${unlocked_accounts}`);

const server = ganache.server({
  port: PORT,
  fork,
  debug: true,
  network_id: 1,
  unlocked_accounts: [],
  accounts: [
    {
      secretKey: process.env.PRIV_KEY_TEST,
      balance: ethers.utils.hexlify(ethers.utils.parseEther("1000")),
    },
    {
      secretKey: process.env.PRIV_KEY_DEPLOY,
      balance: ethers.utils.hexlify(ethers.utils.parseEther("1000")),
    },
  ],
});

server.listen(PORT, (err, chain) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Forked off of node: ${fork}\n`);
    console.log(`Test private key:\n`);
    console.log(`\t${process.env.PRIV_KEY_TEST}`);
    console.log(`\nTest chain started on port ${PORT}, listening...`);
  }
});
