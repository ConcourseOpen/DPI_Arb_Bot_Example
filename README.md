## DFP INDEX ARBITRAGE BOT Explained
If the weights of the assets included in the index become miss aligned with the original index weights described in our methodology there is an opportunity to arbitriage the index. This arbitrage bot is built to watch for these miss alignments and issue(buy) or redeem(sell) the underlying assets of the index to keep the Index in line with expected weights of each token. 


## DFP INDEX ARBITRAGE BOT

Add a .env file to the root of the directory containing:


INFURA_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  //your infura key

PORT=3032  //or whatever port you want to run on

DFP_INDEX_ADDRESS=0x9F295d05bAeE0E95F52aC1db0C2bDc26A226e4BB  //address of the DFP Index token

DFP_TRADE_ADDRESS=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee  //address of the DFP Arbitrage contract

PRICE_THRESHOLD=5  //price percentage difference threshold to trigger arbitrage

MNEMONIC=mnemonic of the wallet you are triggering from


To Run:


`npm install`

`node server.js`

## DFP INDEX ARBITRAGE BOT SMART CONTRACT DISCLAIMER
1.) The Smart Contract is UNAUDITTED Please review code
2.) It is built for the DeFi Pulse Index but can be used for other products
3.) It uses AAVE for flashlaons and 
4.) The SC was not optimize for higher profitability but to complete the arb. Optimizations can be made to increase profitablity. 
