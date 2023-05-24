// SPDX-License-Identifier: MIT
pragma solidity <=0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ERC20MaticToken is
    ERC20,
    ERC20Snapshot,
    ERC20Burnable,
    ERC20Pausable,
    Ownable
{
    event TokenTransfer(
        address indexed from,
        address indexed to,
        uint256 value
    );
    string public constant NAME = "MATIC Token";
    string public constant SYMBOL = "MATIC";
    uint8 public constant DECIMALS = 5;
    uint256 public constant INITIAL_SUPPLY =
        10_000_000_000 * 10 ** uint256(DECIMALS);

    constructor() ERC20(NAME, SYMBOL) {
        address owner = msg.sender;
        _mint(owner, type(uint256).max);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Snapshot, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
