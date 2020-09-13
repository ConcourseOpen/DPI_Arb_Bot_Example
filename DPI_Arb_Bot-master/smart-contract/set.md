https://docs.aave.com/developers/deployed-contracts/deployed-contract-instances


Issuing Sets:

In order to issue Sets you must call issue on the IssuanceModule, the interface for issue is as follows:

function issue(ISetToken _setToken, uint256 _quantity) external

Simply input the address of the Set you wish to issue and the amount you wish to issue. In order for issuance to work ALL of the components must be owned by the calling address in the correct proportions (whether it's a wallet or smart contract address). Additionally, all components must be approved for transfer by the Controller contract. In order to figure out the correct token amounts needed for issuance you must access and parse the positions array of the Set by calling the following function:

function getPositions() public view returns (ISetToken.Position[] memory)

This will return an array of position structs defined as such:

    /**
     * The base definition of a SetToken Position
     *
     * @param component           Address of token in the Position
     * @param module              If not in default state, the address of associated module
     * @param unit                Each unit is the # of components per 10^18 of a SetToken
     * @param positionState       The type of position denoted as a uint8
     * @param data                Arbitrary data
     */
    struct Position {
        address component;
        address module;
        int256 unit;
        uint8 positionState;
        bytes data;
    }

For purposes of issuance of the DFP Set you will want to access the unit field which says how many units of the component are needed per full SetToken issued (10 ** 18 units of SetToken). For example, if there is one WETH per SetToken, the units field would have 10**18 in it and if you tried to issue 5 SetTokens, (5 * 10 ** 18 units) you would need to be holding 5 ether (or 5 * 10 ** 18 units of Wrapped Ether). Similarly let's say there are .01 WBTC per Set (10 ** 6 WBTC units) if we were to issue 10 Set Tokens we would need .1 WBTC or 10 ** 7 units of WBTC.

Once you confirm you have all the required components to collateralize each position of the Set you will be able to issue which transfers those components to the SetToken and mint's the passed _quantity to the calling address.

A quick issuance example:
positions = [
    {
        component: WETH;
        module: address(0);
        unit: 2.5 * 10 ** 17;
        positionState: 0;
        data: '';
    },
    {
        component: WBTC;
        module: address(0);
        unit: 2 * 10 ** 5;
        positionState: 0;
        data: '';
    },
]
Let's say you are issuing 2.3 SetTokens (2.3 * 10 ** 18 units). The general formula for determining the amount of units required is (issueQuantity) * (position.unit) / (SetToken preciseUnit), where SetToken preciseUnit = 10 ** 18. Applying to the example above you get the following required component amounts:

WETH units required = (2.3 * 10 ** 18)*(2.5 * 10 ** 17) / (10 ** 18) = 5.75 * 10 ** 17 WETH units = 5.75 WETH
WBTC units required = (2.3 * 10 ** 18)*(2 * 10 ** 5) / (10 ** 18) = 4.6 * 10 ** 5 WBTC units = .0046 WBTC (since WBTC has 8 decimals).

To Redeem:

The logic is very similar just in reverse. The interface for redeem is as follows:

redeem(ISetToken _setToken, uint256 _quantity) external

You specify the amount of Sets you want to redeem (and ensure you have approved the Controller to transfer your Sets) and then those Sets are burned and the components are transferred to the calling address. The amount of components transferred follows the same logic as above where if a Set is collateralized by 1 WETH (10 ** 18 units of WETH) and you redeem 5 Sets (5 * 10 ** 18 units) you would receive 5 WETH (5 * 10 ** 18 units) back in exchange for redeeming your Set.
