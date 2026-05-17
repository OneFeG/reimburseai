// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InvoiceIdentity (Asset Golden Copy)
 * @dev Basado en ERC-735 para la identidad de activos RWA.
 */
contract ClaimsIdentity is Ownable {
    
    struct Claim {
        uint256 topic;      
        uint256 scheme;     // 1 para firmas ECDSA
        address issuer;     // Dirección del Claim Issuer (ej. Plataforma de Factoring)
        bytes signature;    // Firma que valida los datos
        bytes data;         // HASH de los metadatos privados (CUFE, Total, etc.)
        string uri;         // Link opcional a la factura cifrada en IPFS/Vault
    }

    mapping(bytes32 => Claim) private _claims;
    mapping(uint256 => bytes32[]) private _claimsByTopic;

    event ClaimAdded(bytes32 indexed claimId, uint256 indexed topic, address indexed issuer);

    
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registra el reclamo que contiene el hash de los metadatos de la factura.
     * El parámetro '_data' debe ser el keccak256 de los campos privados.
     */
    function addClaim(
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    ) public onlyOwner returns (bytes32 claimId) {

        claimId = keccak256(abi.encodePacked(issuer, topic));
        
        _claims[claimId] = Claim(topic, scheme, issuer, signature, data, uri);
        _claimsByTopic[topic].push(claimId);

        emit ClaimAdded(claimId, topic, issuer);
    }

    function getClaim(bytes32 claimId) public view returns (
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    ) {
        Claim memory c = _claims[claimId];
        return (c.topic, c.scheme, c.issuer, c.signature, c.data, c.uri);
    }

    function getClaimsByTopic(uint256 topic) public view returns (bytes32[] memory) {
        return _claimsByTopic[topic];
    }
}