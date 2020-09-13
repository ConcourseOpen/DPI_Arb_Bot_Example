pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import '@uniswap/lib/contracts/libraries/Babylonian.sol';

import "./aave/FlashLoanReceiverBase.sol";
import "./aave/ILendingPoolAddressesProvider.sol";
import "./aave/ILendingPool.sol";

import './libraries/UniswapV2Library.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IERC20.sol';
import './interfaces/IWETH.sol';
import './interfaces/IBasicIssuanceModule.sol';
import './interfaces/ISetToken.sol';



contract DefiPulseIndexTrade is FlashLoanReceiverBase {
  address immutable factory;
  address immutable setController;
  address immutable issueModule;
  address immutable WETH;
  IUniswapV2Router02 immutable router;
  uint256 MAX_INT = 2**256 - 1;


  constructor(address _factory, address _router,  address _setController, address _issueModule, address _addressProvider) 
  FlashLoanReceiverBase(_addressProvider) public {
    factory = _factory; // Uniswap Factory V02
    router = IUniswapV2Router02(_router);  // Uniswap Router
    setController = _setController;        // Set Controller
    issueModule = _issueModule;            // Set Token Issue Module
    WETH = IUniswapV2Router01(_router).WETH();
  }


  function initiateArbitrage(address _indexToken, uint256 _targetPriceInEther) public payable {
    if(msg.value > 0) IWETH(WETH).deposit{value: msg.value}();
    (bool aToB, uint256 indexAmount, address pairAddress) = getIndexAmountToBuyOrSell(_indexToken, _targetPriceInEther);
    if(aToB) {
      buyIndex(_indexToken, indexAmount, pairAddress);
    } else {
      require(indexAmount > 1 ether, "issue amount must be > 0");
      sellIndex(_indexToken, indexAmount, pairAddress);
    }
    msg.sender.transfer(address(this).balance);
  }

  function approveToken(address _token) public {
    IERC20(_token).approve(address(router), MAX_INT); //  Set Max Approval for neccessary tokens;
    IERC20(_token).approve(setController, MAX_INT); //  Set Max Approval for neccessary tokens;
    IERC20(_token).approve(issueModule, MAX_INT); //  Set Max Approval for neccessary tokens;
  }

  function approveSetToken(address _index) public {
    IERC20(_index).approve(address(router), MAX_INT); //  Set Max Approval for neccessary tokens;
    ISetToken.Position[] memory positions = ISetToken(_index).getPositions();

    for(uint256 i=0; i<positions.length; i++) {
      IERC20(positions[i].component).approve(setController, MAX_INT); // Set Max Approval for Set Contract;
      IERC20(positions[i].component).approve(issueModule, MAX_INT); // Set Max Approval for Set Contract;
      IERC20(positions[i].component).approve(address(router), MAX_INT); //  Set Max Approval for neccessary tokens;
    }

  }

  function issueSetToken(address _index, uint256 _amount) private {
    IBasicIssuanceModule(issueModule).issue(ISetToken(_index), _amount, address(this));
  }

  function redeemSetToken(address _index, uint256 _amount) private {
    IBasicIssuanceModule(issueModule).redeem(ISetToken(_index), _amount, address(this));
  }

  function getIndexAmountToBuyOrSell(address _index, uint256 _targetPriceInEther) public view returns (bool isBuy, uint256 amountIn, address pairAddress_) {
    address pairAddress = IUniswapV2Factory(factory).getPair(WETH, _index);

    (uint256 reserveA, uint256 reserveB) = UniswapV2Library.getReserves(factory, WETH, _index);
    (bool aToB, uint256 _amount) = computeProfitMaximizingTrade(_targetPriceInEther, 1000000000, reserveA, reserveB);

    uint256 maxAmount = _amount < reserveB ? _amount : reserveB;

    return (aToB, maxAmount, pairAddress);
  }

  //  Loan WETH and trade for individual parts, then redeem and sell Index (will trigger executeOperation);
  function sellIndex(address _index, uint256 amountIndexToSell, address pairAddress) internal {
    ISetToken.Position[] memory positions = ISetToken(_index).getPositions();

    // Second calculate amount of ETH needed to get individual tokens
    uint256 totalEthNeeded = 0;
    uint256[] memory tokenAmounts = new uint256[](positions.length);
    address[] memory tokens = new address[](positions.length);

    {
      for(uint256 i=0; i<positions.length; i++) {
        (uint256 tokenReserveA, uint256 tokenReserveB) = UniswapV2Library.getReserves(factory, WETH, positions[i].component);
        uint256 tokensNeeded =  preciseMulCeil(uint256(positions[i].unit), amountIndexToSell);
        tokenAmounts[i] = tokensNeeded;
        tokens[i] = positions[i].component;

        uint256 ethNeeded = router.getAmountIn(tokensNeeded, tokenReserveA, tokenReserveB);
        totalEthNeeded = totalEthNeeded.add(ethNeeded).mul(1000) / 950;
      }
    }
    bytes memory data = abi.encode(_index, amountIndexToSell, tokenAmounts, tokens);

    // Third get Flash Loan, and execute rest once funds are received from aave (executeOperation) 
    ILendingPool lendingPool = ILendingPool(addressesProvider.getLendingPool());
    lendingPool.flashLoan(address(this), 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, totalEthNeeded, data);
  }

  function executeOperation(address _reserve, uint256 _amount, uint256 _fee, bytes calldata _params)
        external override {
        require(_amount <= getBalanceInternal(address(this), _reserve), "Invalid balance, was the flashLoan successful?");
        uint totalDebt = _amount.add(_fee);

        // Wrap Ether
        IWETH(WETH).deposit{value: address(this).balance}();

        (address _index, uint256 _indexAmount, uint256[] memory tokenAmounts, address[] memory tokens) = abi.decode(_params, (address, uint256, uint256[], address[]));


        acquireTokensOfSet(tokens, tokenAmounts);

        // issue Set Token
        issueSetToken(_index, _indexAmount * (1 ether));

        
        address[] memory path = new address[](2);
        path[0] = _index;
        path[1] = WETH;

        router.swapExactTokensForTokens(_indexAmount * (1 ether), 0, path, address(this), block.timestamp);


        IWETH(WETH).withdraw(IERC20(WETH).balanceOf(address(this)));

        transferFundsBackToPoolInternal(_reserve, totalDebt);

    }

        


  // Loan Index and Sell for Individual Parts
  function buyIndex(address _index, uint256 amountIndexToBuy, address pairAddress) internal returns (address t0, address t1, uint256 a0, uint256 a1) {
    
    bytes memory data = abi.encode(_index, amountIndexToBuy, pairAddress);

    address token0 = IUniswapV2Pair(pairAddress).token0();
    address token1 = IUniswapV2Pair(pairAddress).token1();
    uint amount0Out = _index == token0 ? amountIndexToBuy : 0;
    uint amount1Out = _index == token1 ? amountIndexToBuy : 0;

    IUniswapV2Pair(pairAddress).swap(amount0Out, amount1Out, address(this), data);

    return (token0, token1, amount0Out, amount1Out);
  }

  function completeBuyIndex(address _index, uint256 _amountIndexToBuy) private {
    redeemSetToken(_index, _amountIndexToBuy);

    liquidateSetPositions(_index);
  }

  function uniswapV2Call(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external {
      address token0 = IUniswapV2Pair(msg.sender).token0(); // fetch the address of token0
      address token1 = IUniswapV2Pair(msg.sender).token1(); // fetch the address of token1
      assert(msg.sender == IUniswapV2Factory(factory).getPair(token0, token1));

      (address _index, uint256 _indexAmount) = abi.decode(_data, (address, uint256));

      completeBuyIndex(_index, _indexAmount);

      uint256 amount = token0 == address(WETH) ? _amount1 : _amount0;


      address[] memory path = new address[](2);
      path[0] = _amount0 == 0 ? token0 : token1;
      path[1] = _amount0 == 0 ? token1 : token0;

      IERC20(WETH).transfer(msg.sender, amount);
      IWETH(WETH).withdraw(IERC20(WETH).balanceOf(address(this)));
  }

  function acquireTokensOfSet(address[] memory tokens, uint256[] memory tokenAmounts) private {

    for(uint256 i=0; i<tokens.length; i++) {
      address[] memory path = new address[](2);
      path[0] = WETH;
      path[1] = tokens[i];
      router.swapTokensForExactTokens(tokenAmounts[i], MAX_INT, path, address(this), block.timestamp); 
    }

  }

  function liquidateSetPositions(address _index) private {
    ISetToken.Position[] memory positions = ISetToken(_index).getPositions();

    for(uint256 i=0; i<positions.length; i++) {
      uint256 tokenBalance = IERC20(positions[i].component).balanceOf(address(this));
      address[] memory path = new address[](2);
      path[0] = positions[i].component;
      path[1] = WETH;
      router.swapExactTokensForTokens(IERC20(positions[i].component).balanceOf(address(this)), 0, path, address(this), block.timestamp); 
    }
  }

  // computes the direction and magnitude of the profit-maximizing trade
  // https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleSwapToPrice.sol
  function computeProfitMaximizingTrade(
    uint256 truePriceTokenA,
    uint256 truePriceTokenB,
    uint256 reserveA,
    uint256 reserveB
  ) private pure returns (bool aToB, uint256 amountIn) {
    aToB = reserveA.mul(truePriceTokenB) / reserveB < truePriceTokenA;

    uint256 invariant = reserveA.mul(reserveB);

    uint256 leftSide = Babylonian.sqrt(
      invariant.mul(aToB ? truePriceTokenA : truePriceTokenB).mul(1000) /
      uint256(aToB ? truePriceTokenB : truePriceTokenA).mul(997)
    );
    uint256 rightSide = (aToB ? reserveA.mul(1000) : reserveB.mul(1000)) / 997;

    // compute the amount that must be sent to move the price to the profit-maximizing price
    amountIn = leftSide.sub(rightSide);
  }


  // From Precise Unit SafeMath
  function preciseMulCeil(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0 || b == 0) {
      return 0;
    }
    return a.mul(b).sub(1).div(10 ** 18).add(1);
  }

}
