// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IClaimsIdentity {
    struct Claim {
        uint256 topic;
        uint256 scheme;
        address issuer;
        bytes signature;
        bytes data;
        string uri;
    }

    function addClaim(
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    ) external returns (bytes32 claimId);

    function getClaim(
        bytes32 claimId
    )
        external
        view
        returns (
            uint256 topic,
            uint256 scheme,
            address issuer,
            bytes memory signature,
            bytes memory data,
            string memory uri
        );

    function getClaimsByTopic(uint256 topic) external view returns (bytes32[] memory);

    event ClaimAdded(bytes32 indexed claimId, uint256 indexed topic, address indexed issuer);
}

