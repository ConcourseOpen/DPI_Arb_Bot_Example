const Web3 = require('web3');

const RECONNECT_MS = 10000;
const PING_TIME = 120000;

class Web3Connection {
  constructor(listener, loggingName) {
    this._listener = listener;
    this._loggingName = loggingName;
    this._pingInterval = null;
    this._provider = null;
    this._web3 = null;
  }

  start() {
    return this._connect(false);
  }

  _log(msg) {
    console.log(`[${this._loggingName}]`, msg);
  }

  async _startPing(web3, onConnectionDead) {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }
    let lastResponseTimestamp = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastResponseTimestamp;
      if (diff > PING_TIME * 2) {
        clearInterval(interval);
        if (onConnectionDead) {
          onConnectionDead(
            new Error(`${this._loggingName} node connection fell behind`),
          );
        }
        return;
      }

      web3.eth
        .getNodeInfo()
        .then(() => {
          lastResponseTimestamp = Date.now();
        })
        .catch(error => {
          clearInterval(interval);
          if (onConnectionDead) {
            onConnectionDead(error);
          }
        });
    }, PING_TIME);
    this._pingInterval = interval;
  }

  cleanUp() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }

    if (this._provider) {
      this._provider.removeAllListeners();
    }
    this._web3 = null;
  }

  _connect(isReconnect) {
    return new Promise((resolve, reject) => {
      const scheduleReconnect = () => {
        setTimeout(() => {
          this._connect(true);
        }, RECONNECT_MS);
      };

      this._provider = new Web3.providers.WebsocketProvider(
        `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_KEY}`
      );
      this._web3 = new Web3(this._provider);

      /* handle web3 connection */
      this._provider.on('connect', () => {
        resolve(true);
        this._log('Connected');
        this._listener(this._web3);

        this._startPing(this._web3, async error => {
          this.cleanUp();
          this._log('Error: Web3 connection lost. Attempting to reconnect');
          scheduleReconnect();
        });

        // End fires when the other side disconnects and when connection fails initially,
        // to only handle the former we bind only after connect.
        this._provider.on('end', async error => {
          this.cleanUp();
          this._log('Error: Web3 connection lost. Attempting to reconnect');
          scheduleReconnect();
        });
      });

      /* handle web3 connection error */
      this._provider.on('error', async error => {
        reject('Error: Unable to connect to web3 socket');
        this.cleanUp();

        if (isReconnect) {
          this._log('Error: Unable to reconnect. Will try again');
          scheduleReconnect();
        } else {
          const errorMsg = 'Error: Unable to connect to web3 socket';
          this._log(errorMsg);
          throw new Error(errorMsg);
        }
      });
    });
  }
}

module.exports = Web3Connection;
