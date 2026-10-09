// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
contract Token258 is ERC1155, Ownable {
    using Strings for uint256;
    uint256 public constant ZNZ_FRIKIPUNTOS = 0;
    uint256 public constant LARGO_DURO_MASTER = 1;
    uint256 public constant CYBER_SKULL_PASS = 2;
    uint256 private constant INITIAL_ZNZ_SUPPLY = 1000000 * 10**18;
    string private _baseTokenURI;
    constructor(string memory initialURI) ERC1155(initialURI) Ownable(msg.sender) {
        _baseTokenURI = initialURI;
        _mint(msg.sender, ZNZ_FRIKIPUNTOS, INITIAL_ZNZ_SUPPLY, "");
    }
    function setURI(string memory newuri) public onlyOwner { _setURI(newuri); _baseTokenURI = newuri; }
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString(), ".json"));
    }
}