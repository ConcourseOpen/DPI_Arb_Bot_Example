require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Colors = require("colors");

const block = require("./block-watcher");

Colors.setTheme({
  styleRed: ["red"],
  green: ["green"],
  yellow: ["yellow"],
});

const PORT = process.env.PORT || 3032;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const _startBlock = () => {
  return block
    .start()
    .then(async (success) => {
      if (success) {
        console.log("Block watcher started successfully".green);
      }
    })
    .catch(async (error) => {
      console.log(error);
    });
};

(async () => {
  Promise.resolve()
    .then(_startBlock)
    .catch(async (error) => {
      const message = `An error occurred while registering block listener ${error}`;
      console.error(message);
    });
})();

app.get("/ping", function (req, res) {
  res.status(200).send("pong");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`.green);
});
