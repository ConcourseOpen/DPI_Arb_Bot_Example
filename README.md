## DeFi Pulse Index(DPI) ARBITRAGE BOT Explained
If the weights of the assets included in the index become misaligned with the original index weights described in our methodology, there is an opportunity to arbitriage the index. 

The arb bot utilizes flash loans to maintain the index NAV. The use of flash loans allows everyone access and can scale with the size of the arbitrage opporunity. When executed, the arb bot will assess whether the index is outside of the intended +/-5% net asset value (NAV). If it is outside this range, the bot will programatically issue (buy) or redeem (sell) the appropriate underlying assets of the index to keep the index in line with expected NAV and index weights. The current version is optimized to maintain the index weights, not for profit. 



## DPI ARBITRAGE BOT Important Details

Add a .env file to the root of the directory containing:


INFURA_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  //your infura key

PORT=3032  //or whatever port you want to run on

DFP_INDEX_ADDRESS=0x9F295d05bAeE0E95F52aC1db0C2bDc26A226e4BB  //address of the DFP Index token

DFP_TRADE_ADDRESS=0x690317De764D91558A3e23891A5CD843396471B6  //address of the DFP Arbitrage contract

PRICE_THRESHOLD=5  //price percentage difference threshold to trigger arbitrage

MNEMONIC=mnemonic of the wallet you are triggering from


To Run:


`npm install`

`node server.js`

## DPI ARBITRAGE BOT SMART CONTRACT DISCLAIMER
1.) Use at your own risk. The smart contract is currently UNAUDITED and provided as-is in the spirit of transparency and decentralization. So make sure you review and understand the code, and please only use the arb bot if you appreciate the risks and uncertainty inherent in transacting with value on Ethereum, including the volatility of gas and asset prices and the possibility (and implications) of competition for block space.

2.) It is built for the DeFi Pulse Index but can be used for other products.

3.) It uses AAVE for flash loans. However, you can utilize any flash-loan provider. 

