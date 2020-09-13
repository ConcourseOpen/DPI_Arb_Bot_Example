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
