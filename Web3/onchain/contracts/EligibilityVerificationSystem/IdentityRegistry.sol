// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IClaimsIdentity.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract EVS is Ownable {
    // --- VARIABLES DE ESTADO ---

    // --- IDENTIFICACIÓN DE ROLES ---
    enum EntityType {
        None,
        Inversor,
        Plataforma,
        GoldenCopy,
        Emisor
    }

    mapping(address => EntityType) private _entityTypes;
    mapping(EntityType => uint256[]) private _roleRequirements;
    // Mapeos de ClaimTopicsRegistry
    uint256[] private _claimTopics;

    // Mapeos de IdentityRegistryStorage
    mapping(address => address) private _storedIdentities; // Billetera -> ONCHAINID
    // Mapeos de TrustedIssuersRegistry
    mapping(address => bool) private _trustedIssuers; // ONCHAINID del Emisor -> Autorizado

    error InvalidEntityType();
    error UserNotRegistered(address userAddress);
    error NotSignedByIssuer(address issuerAddress, address userAddress, uint256 topic);
    error NotMetRequirements(address userAddress, EntityType role, uint256 topic);

    event RoleRequirementsSet(address indexed userAddress, EntityType role, uint256[] topics);
    event newIdentityRegistered(address indexed userAddress, address identityAddress);
    event newTrustedIssuer(address indexed issuerAddress, bool trusted);
       
    constructor() Ownable(msg.sender) {}

    function _validateEntityType(EntityType entityType) internal pure {
        if (entityType == EntityType.None || uint8(entityType) > uint8(EntityType.Emisor))
            revert InvalidEntityType();
    }

    // --- GESTIÓN DE DATOS (Funciones Administrativas) ---

    /**
     * @dev Configura qué claims (topics) son obligatorios para cada rol.
     */
    function setRoleRequirements(EntityType _type, uint256[] memory _topics) external onlyOwner {
        _validateEntityType(_type);
        _roleRequirements[_type] = _topics;
    }

    function addIdentityToStorage(
        address _user,
        address _identity,
        EntityType _role
    ) external onlyOwner {
        _validateEntityType(_role);
        _storedIdentities[_user] = _identity;
        _entityTypes[_user] = _role;
        emit newIdentityRegistered(_user, _identity);
    }

    function addTrustedIssuer(address _issuer) external onlyOwner {
        _trustedIssuers[_issuer] = true;
        emit newTrustedIssuer(_issuer, true);
    }

    // --- IMPLEMENTACIÓN DE FUNCIONES DE CUMPLIMIENTO ---

    /**
     * @dev Implementación de isVerified que orquesta la consulta a los datos internos [9], [10].
     */
    function isVerified(
        address _userAddress
    ) public returns (EntityType role, bool verified) {
        address identityAdress = _storedIdentities[_userAddress];
        if (identityAdress == address(0)) revert UserNotRegistered(_userAddress);
        EntityType roleUser = _entityTypes[_userAddress];
        _validateEntityType(roleUser);
        uint256[] memory requirements = _roleRequirements[roleUser];

        IClaimsIdentity identity = IClaimsIdentity(identityAdress);

        for (uint256 i = 0; i < requirements.length; i++) {
            _verifyTopic(identity, _userAddress, roleUser, requirements[i]);
        }
        emit RoleRequirementsSet(_userAddress, roleUser, requirements);
        return (roleUser, true);
    }
    function _verifyTopic(
        IClaimsIdentity identity,
        address userAddress,
        EntityType roleUser,
        uint256 topic
    ) internal view {
        bytes32[] memory claimIds = identity.getClaimsByTopic(topic);
        if (claimIds.length == 0) revert NotMetRequirements(userAddress, roleUser, topic);

        for (uint256 j = 0; j < claimIds.length; j++) {
            (, , address issuer, bytes memory signature, bytes memory data, ) = identity.getClaim(
                claimIds[j]
            );

            if (_trustedIssuers[issuer]) {
                bool isValid = getSigner(issuer, data, signature);
                if (!isValid) revert NotSignedByIssuer(issuer, userAddress, topic);
                return;
            }
        }

        revert NotMetRequirements(userAddress, roleUser, topic);
    }

    // --- FUNCIONES SOPORTE ---
    function getSigner(
        address _expectedAddress,
        bytes memory data,
        bytes memory signature
    ) internal pure returns (bool) {
        if (data.length != 32) return false;
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", data));
        address recovered = ECDSA.recover(digest, signature);
        return recovered == _expectedAddress;
    }

    function addClaimTopic(uint256 _topic) external onlyOwner {
        _claimTopics.push(_topic);
    }

    function getClaimTopics() external view returns (uint256[] memory) {
        return _claimTopics;
    }
}
