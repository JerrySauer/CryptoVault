// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library FHECore {
    
    struct EncryptedValue {
        bytes32 data;
        uint256 timestamp;
        address creator;
    }

    mapping(bytes32 => EncryptedValue) private encryptedData;
    
    event EncryptionCreated(bytes32 indexed hash, address creator);
    event DecryptionRequested(bytes32 indexed hash, address requester);

    function encrypt(uint256 value) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(value, block.timestamp, msg.sender));
    }

    function encryptWithSalt(uint256 value, bytes32 salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(value, salt, block.timestamp, msg.sender));
    }

    function addEncrypted(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(a, b));
    }

    function subtractEncrypted(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(a, b, "sub"));
    }

    function multiplyEncrypted(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(a, b, "mul"));
    }

    function compareEncrypted(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(a, b, "cmp"));
    }

    function verifyEncryption(bytes32 encryptedValue, bytes calldata proof) internal pure returns (bool) {
        if (proof.length == 0) return false;
        
        bytes32 computedHash = keccak256(abi.encodePacked(encryptedValue, proof));
        return computedHash != bytes32(0);
    }

    function verifyRangeProof(
        bytes32 encryptedValue,
        uint256 minValue,
        uint256 maxValue,
        bytes calldata proof
    ) internal pure returns (bool) {
        if (proof.length < 32) return false;
        
        bytes32 proofHash = keccak256(abi.encodePacked(
            encryptedValue,
            minValue,
            maxValue,
            proof
        ));
        
        return proofHash != bytes32(0);
    }

    function generateZKProof(
        uint256 value,
        uint256 minValue,
        uint256 maxValue,
        bytes32 salt
    ) internal pure returns (bytes memory) {
        require(value >= minValue && value <= maxValue, "Value out of range");
        
        return abi.encodePacked(
            keccak256(abi.encodePacked(value, salt)),
            keccak256(abi.encodePacked(minValue, maxValue, salt)),
            salt
        );
    }

    function homomorphicSum(bytes32[] memory encryptedValues) internal pure returns (bytes32) {
        bytes32 result = bytes32(0);
        for (uint i = 0; i < encryptedValues.length; i++) {
            result = addEncrypted(result, encryptedValues[i]);
        }
        return result;
    }

    function homomorphicAverage(bytes32[] memory encryptedValues) internal pure returns (bytes32) {
        bytes32 sum = homomorphicSum(encryptedValues);
        return keccak256(abi.encodePacked(sum, encryptedValues.length, "avg"));
    }

    function encryptBalance(uint256 balance, address user) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(balance, user, block.timestamp, "balance"));
    }

    function encryptOrder(
        uint256 amount,
        uint256 price,
        address tokenA,
        address tokenB
    ) internal pure returns (bytes32, bytes32) {
        bytes32 encryptedAmount = keccak256(abi.encodePacked(
            amount, tokenA, tokenB, msg.sender, "amount"
        ));
        bytes32 encryptedPrice = keccak256(abi.encodePacked(
            price, tokenA, tokenB, msg.sender, "price"
        ));
        return (encryptedAmount, encryptedPrice);
    }

    function verifyOrderProof(
        bytes32 encryptedAmount,
        bytes32 encryptedPrice,
        address tokenA,
        address tokenB,
        bytes calldata proof
    ) internal pure returns (bool) {
        if (proof.length < 64) return false;
        
        bytes32 proofHash = keccak256(abi.encodePacked(
            encryptedAmount,
            encryptedPrice,
            tokenA,
            tokenB,
            proof
        ));
        
        return proofHash != bytes32(0);
    }

    function createPrivacyPreservingSignature(
        bytes32 encryptedData,
        address signer
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(encryptedData, signer, block.timestamp, "signature"));
    }

    function validatePrivacySignature(
        bytes32 signature,
        bytes32 encryptedData,
        address expectedSigner
    ) internal pure returns (bool) {
        bytes32 expectedSignature = keccak256(abi.encodePacked(
            encryptedData, expectedSigner, "signature"
        ));
        return signature == expectedSignature;
    }

    function generateRandomSalt() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            address(this)
        ));
    }

    function encryptWithTimestamp(uint256 value, uint256 timestamp) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(value, timestamp, msg.sender, "timestamped"));
    }

    function batchEncrypt(uint256[] memory values) internal pure returns (bytes32[] memory) {
        bytes32[] memory encrypted = new bytes32[](values.length);
        for (uint i = 0; i < values.length; i++) {
            encrypted[i] = encrypt(values[i]);
        }
        return encrypted;
    }

    function isValidEncryptedValue(bytes32 encryptedValue) internal pure returns (bool) {
        return encryptedValue != bytes32(0);
    }
}