1. Run `npm install`
2. Create a `.env` file with the following contents:

   ```
   KOVAN_NODE_URL=
   PRIV_KEY_TEST=
   PRIV_KEY_DEPLOY=
   ```
3. Run `npm start` to start a local Ganache chain with forked Mainnet state
4. Run `npm run migrate` in order to compile and migrate the project's contracts to this local Ganache chain
5. Run `npm test` in order to run the tests.
