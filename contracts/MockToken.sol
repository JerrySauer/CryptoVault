// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockToken is ERC20, Ownable {
    uint8 private _tokenDecimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _tokenDecimals = decimals_;
        _mint(msg.sender, initialSupply * (10 ** decimals_));
    }

    function decimals() public view virtual override returns (uint8) {
        return _tokenDecimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function faucet(uint256 amount) external {
        require(amount <= 1000 * (10 ** _tokenDecimals), "Amount too large");
        _mint(msg.sender, amount);
    }
}