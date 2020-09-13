pragma solidity >=0.5.0;

interface ISetModule {
  function issue(ISetToken _setToken, uint256 _quantity) external;
  function redeem(ISetToken _setToken, uint256 _quantity) external;
  function getPositions() public view returns (Position[] memory);
}
