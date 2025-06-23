// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Lamina1oracle is Ownable {
    struct CustomPair {
        string description;
        uint256 value;
        uint256 updatedAt;
    }

    mapping(address => uint256) public pricesInUsd;
    mapping(string => mapping(address => uint256)) public pricesInFiat;
    string[] public supportedFiats;
    mapping(string => CustomPair) public customPairs;
    uint256 public priceFee = 0.0001 ether; // Fee in L1 coin
    uint256 public customPairFee = 0.01 ether;

    event PriceUpdated(address token, string currency, uint256 price);
    event TokenAdded(address token, string name, string ticker);
    event FiatCurrencyAdded(string currency);
    event CustomPairAdded(string pairId, string description, uint256 fee);
    event CustomPairUpdated(string pairId, uint256 value);
    event FeeCollected(address user, uint256 amount);

    constructor() {
        supportedFiats.push("USD");
        supportedFiats.push("KRW");
    }

    function addToken(address token, string memory name, string memory ticker) external onlyOwner {
        emit TokenAdded(token, name, ticker);
    }

    function updateTokenPrice(address token, uint256 priceUsd, uint256 priceKrw) external onlyOwner {
        pricesInUsd[token] = priceUsd;
        pricesInFiat["KRW"][token] = priceKrw;
        emit PriceUpdated(token, "USD", priceUsd);
        emit PriceUpdated(token, "KRW", priceKrw);
    }

    function addFiatCurrency(string memory currency) external onlyOwner {
        supportedFiats.push(currency);
        emit FiatCurrencyAdded(currency);
    }

    function addCustomPair(string memory pairId, string memory description, uint256 initialValue) external payable onlyOwner {
        require(msg.value >= customPairFee, "Insufficient fee");
        customPairs[pairId] = CustomPair(description, initialValue, block.timestamp);
        emit CustomPairAdded(pairId, description, msg.value);
        emit FeeCollected(msg.sender, msg.value);
    }

    function updateCustomPair(string memory pairId, uint256 value) external onlyOwner {
        require(customPairs[pairId].updatedAt > 0, "Pair does not exist");
        customPairs[pairId].value = value;
        customPairs[pairId].updatedAt = block.timestamp;
        emit CustomPairUpdated(pairId, value);
    }

    function getPrice(address token, string memory currency) external payable returns (uint256) {
        require(msg.value >= priceFee, "Insufficient fee");
        if (keccak256(bytes(currency)) == keccak256(bytes("USD"))) {
            emit FeeCollected(msg.sender, msg.value);
            return pricesInUsd[token];
        }
        emit FeeCollected(msg.sender, msg.value);
        return pricesInFiat[currency][token];
    }

    function getCustomPair(string memory pairId) external payable returns (uint256) {
        require(msg.value >= priceFee, "Insufficient fee");
        require(customPairs[pairId].updatedAt > 0, "Pair does not exist");
        emit FeeCollected(msg.sender, msg.value);
        return customPairs[pairId].value;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
