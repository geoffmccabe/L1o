// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Lamina1oracle is Ownable {
    struct CustomPair {
        string description;
        uint256 value; // Scaled to 18 decimals
        uint256 updatedAt;
    }

    mapping(address => uint256) public pricesInUsd; // 18 decimals
    mapping(string => mapping(address => uint256)) public pricesInFiat; // 18 decimals
    string[] public supportedFiats;
    mapping(string => bool) public supportedFiatsMap;
    mapping(string => CustomPair) public customPairs;
    uint256 public priceFee = 0.0001 ether; // Fee in L1 coin
    uint256 public customPairFee = 0.01 ether;

    event PriceUpdated(address token, string currency, uint256 price);
    event TokenAdded(address token, string name, string ticker);
    event FiatCurrencyAdded(string currency);
    event CustomPairAdded(string pairId, string description, uint256 fee);
    event CustomPairUpdated(string pairId, uint256 value);
    event FeeCollected(address user, uint256 amount);
    event PriceFeeUpdated(uint256 newFee);
    event CustomPairFeeUpdated(uint256 newFee);

    constructor() {
        supportedFiats.push("USD");
        supportedFiats.push("KRW");
        supportedFiatsMap["USD"] = true;
        supportedFiatsMap["KRW"] = true;
    }

    function addToken(address token, string memory name, string memory ticker) external onlyOwner {
        emit TokenAdded(token, name, ticker);
    }

    function updateTokenPrice(address token, uint256 priceUsd, uint256 priceKrw) external onlyOwner {
        pricesInUsd[token] = priceUsd; // 18 decimals
        pricesInFiat["KRW"][token] = priceKrw; // 18 decimals
        emit PriceUpdated(token, "USD", priceUsd);
        emit PriceUpdated(token, "KRW", priceKrw);
    }

    function addFiatCurrency(string memory currency) external onlyOwner {
        supportedFiats.push(currency);
        supportedFiatsMap[currency] = true;
        emit FiatCurrencyAdded(currency);
    }

    function addCustomPair(string memory pairId, string memory description, uint256 initialValue) external onlyOwner {
        customPairs[pairId] = CustomPair(description, initialValue, block.timestamp);
        emit CustomPairAdded(pairId, description, 0);
    }

    function updateCustomPair(string memory pairId, uint256 value) external onlyOwner {
        require(bytes(customPairs[pairId].description).length > 0, "Pair does not exist");
        customPairs[pairId].value = value; // 18 decimals
        customPairs[pairId].updatedAt = block.timestamp;
        emit CustomPairUpdated(pairId, value);
    }

    function getPrice(address token, string memory currency) external payable returns (uint256) {
        require(msg.value >= priceFee, "Insufficient fee");
        require(supportedFiatsMap[currency], "Unsupported currency");
        emit FeeCollected(msg.sender, msg.value);
        return pricesInFiat[currency][token] > 0 ? pricesInFiat[currency][token] : pricesInUsd[token];
    }

    function getCustomPair(string memory pairId) external payable returns (uint256) {
        require(msg.value >= priceFee, "Insufficient fee");
        require(bytes(customPairs[pairId].description).length > 0, "Pair does not exist");
        emit FeeCollected(msg.sender, msg.value);
        return customPairs[pairId].value;
    }

    function setPriceFee(uint256 newFee) external onlyOwner {
        priceFee = newFee;
        emit PriceFeeUpdated(newFee);
    }

    function setCustomPairFee(uint256 newFee) external onlyOwner {
        customPairFee = newFee;
        emit CustomPairFeeUpdated(newFee);
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
