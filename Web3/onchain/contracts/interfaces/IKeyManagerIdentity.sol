// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IKeyManagerIdentity {
    struct Key {
        uint256[] purposes;
        uint256 keyType;
        bytes32 key;
    }

    struct ExecutionRequest {
        address emisor;
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    function MANAGEMENT_KEY() external view returns (uint256);
    function ACTION_KEY() external view returns (uint256);
    function CLAIM_SIGNER_KEY() external view returns (uint256);

    function executionNonce() external view returns (uint256);

    function executionRequests(
        uint256 executionId
    )
        external
        view
        returns (address emisor, address to, uint256 value, bytes memory data, bool executed);

    function getKey(bytes32 _key) external view returns (uint256[] memory purposes, uint256 keyType, bytes32 key);
    function keyHasPurpose(bytes32 _key, uint256 _purpose) external view returns (bool);

    function addKey(bytes32 _key, uint256 _purpose, uint256 _type) external returns (bool success);
    function execute(address _to, uint256 _value, bytes memory _data) external returns (uint256 executionId);
    function approve(uint256 _id, bool _approve) external returns (bool success);

    event KeyAdded(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);
    event KeyRemoved(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);
    event ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 value, bytes data);
    event Approved(uint256 indexed executionId, bool approved);
    event Executed(uint256 indexed executionId, address indexed to, uint256 value, bytes data);
}

