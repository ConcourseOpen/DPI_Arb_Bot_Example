/*
    Copyright 2020 Set Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    SPDX-License-Identifier: Apache License, Version 2.0
*/
pragma solidity >=0.6.10 <0.7;
pragma experimental "ABIEncoderV2";


import { IERC20 } from "./IERC20.sol";

/**
 * @title ISetToken
 * @author Set Protocol
 *
 * Interface for operating with SetTokens.
 */
interface ISetToken is IERC20 {

    /* ============ Enums ============ */

    enum ModuleState {
        NONE,
        PENDING,
        INITIALIZED
    }

    /* ============ Structs ============ */
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

    /* ============ Functions ============ */

    function invoke(address _target, uint256 _value, bytes calldata _data) external returns(bytes memory);

    function pushPosition(Position memory _position) external;
    function popPosition() external;
    function editPosition(uint256 _index, Position memory _position) external;
    function batchEditPositions(uint256[] memory _indices, ISetToken.Position[] memory _positions) external;
    function setPositions(ISetToken.Position[] memory _positions) external;

    function editPositionUnit(uint256 _index, int256 _newUnit) external;
    function batchEditPositionUnits(uint256[] memory _indices, int256[] memory _newUnits) external;

    function mint(address _account, uint256 _quantity) external;
    function burn(address _account, uint256 _quantity) external;

    function lock() external;
    function unlock() external;

    function addModule(address _module) external;
    function removeModule(address _module) external;
    function initializeModule() external;

    function setManager(address _manager) external;

    function manager() external view returns(address);
    function getModules() external view returns (address[] memory);
    function getPositions() external view returns (Position[] memory);

    function isModule(address _module) external view returns(bool);
    function isPendingModule(address _module) external view returns(bool);
    function isLocked() external view returns (bool);
}
