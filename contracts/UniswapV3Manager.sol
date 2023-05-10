// SPDX-License-Identifier: BUSL-1.1
pragma solidity = 0.7.6;

import "./UniswapV3Pool.sol";


contract UniswapV3Manager {
    
    address private poolAddress;
    address private sender;
    
    modifier withPool(address poolAddress_) {
        poolAddress = poolAddress_;
        _;
        poolAddress = address(0x0);
    }
    
    modifier withSender() {
        sender = msg.sender;
        _;
        sender = address(0x0);
    }
    
    /// @notice Calls the pool's mint function from UniswapV3Manager
    /// @param poolAddress_ Address of the pool where we want to mint liquidity
    /// @param lowerTick The lower tick of the position in which to add liquidity
    /// @param upperTick The upper tick of the position in which to add liquidity
    /// @param liquidity The amount of liquidity to mint
    /// @param data Any data that should be passed through to the callback
    function executeMint(
        address poolAddress_,
        int24 lowerTick,
        int24 upperTick,        
        uint128 liquidity,
        bytes calldata data
    ) public withPool(poolAddress_) withSender {
        UniswapV3Pool(poolAddress_).mint(
            msg.sender,
            lowerTick,
            upperTick,
            liquidity,
            data
        );
    }
}