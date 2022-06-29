pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract Token is ERC20, ERC20Detailed {
    constructor () public ERC20Detailed("Test4", "EFG", 8) {
        _mint(msg.sender, 711130684 * (10 ** uint256(decimals())));
    }
}