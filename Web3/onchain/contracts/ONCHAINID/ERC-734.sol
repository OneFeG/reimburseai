// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title ONCHAINID (ERC-734)
 * @dev Contrato para la gestión de identidades y claves en el ecosistema ERC-3643.
 */
contract KeyManagerIdentity {
    // Propósitos de las claves definidos por el estándar
    uint256 public constant MANAGEMENT_KEY = 1; // Permite añadir/eliminar otras claves y reclamos
    uint256 public constant ACTION_KEY = 2;     // Permite ejecutar transacciones (Proxy)
    uint256 public constant CLAIM_SIGNER_KEY = 3; // Utilizado por Claim Issuers para firmar credenciales

    struct Key {
        uint256[] purposes; // Lista de propósitos (ej: [5, 6])
        uint256 keyType;    // Generalmente 1 para ECDSA
        bytes32 key;        // Hash de la dirección de la billetera
    }
    struct ExecutionRequest {
        address emisor;
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    mapping(bytes32 => Key) private _keys;
    mapping(uint256 => bytes32[]) private _keysByPurpose;

    mapping(uint256 => ExecutionRequest) public executionRequests;
    uint256 public executionNonce;

    event KeyAdded(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);
    event KeyRemoved(bytes32 indexed key, uint256 indexed purpose, uint256 indexed keyType);

    event ExecutionRequested(uint256 indexed executionId, address indexed to, uint256 value, bytes data);
    event Approved(uint256 indexed executionId, bool approved);

    event Executed(uint256 indexed executionId, address indexed to, uint256 value, bytes data);

    constructor() {
        // La dirección que despliega el contrato recibe automáticamente el rol de MANAGEMENT
        bytes32 initialKey = keccak256(abi.encodePacked(msg.sender));
        _addKey(initialKey, MANAGEMENT_KEY, 1);
    }

    function getKey(bytes32 _key) public view returns (uint256[] memory purposes, uint256 keyType, bytes32 key) {
        Key memory k = _keys[_key];
        return (k.purposes, k.keyType, k.key);
    }

    function keyHasPurpose(bytes32 _key, uint256 _purpose) public view returns (bool) {
        Key memory k = _keys[_key];
        if (k.key == 0) return false;
        for (uint256 i = 0; i < k.purposes.length; i++) {
            if (k.purposes[i] == _purpose) return true;
        }
        return false;
    }

    function addKey(bytes32 _key, uint256 _purpose, uint256 _type) public returns (bool success) {
        // Solo una clave con propósito MANAGEMENT puede añadir nuevas claves
        require(keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), MANAGEMENT_KEY), "No autorizado");
        return _addKey(_key, _purpose, _type);
    }

    function _addKey(bytes32 _key, uint256 _purpose, uint256 _type) internal returns (bool) {
        if (keyHasPurpose(_key, _purpose)) return false;
        _keys[_key].key = _key;
        _keys[_key].purposes.push(_purpose);
        _keys[_key].keyType = _type;
        _keysByPurpose[_purpose].push(_key);
        emit KeyAdded(_key, _purpose, _type);
        return true;
    }

    /**
     * @dev Si el emisor (sin clave Management) llama a esta función, 
     * se crea una solicitud de ejecución pendiente [2].
     */
    function execute(address _to, uint256 _value, bytes memory _data) public returns (uint256 executionId) {
        bytes32 senderKey = keccak256(abi.encodePacked(msg.sender));
        
        if (keyHasPurpose(senderKey, MANAGEMENT_KEY) || keyHasPurpose(senderKey, ACTION_KEY)) {
            // Ejecución inmediata si el emisor tiene permisos
            (bool success, ) = _to.call{value: _value}(_data);
            require(success, "Error en ejecucion");
            emit Executed(0, _to, _value, _data);
            return 0;
        } else {
            // Crea solicitud de aprobación para terceros (Claim Issuers) [2]
            executionId = executionNonce++;
            executionRequests[executionId] = ExecutionRequest(msg.sender, _to, _value, _data, false);
            emit ExecutionRequested(executionId, _to, _value, _data);
            return executionId;
        }
    }

    /**
     * @dev El dueño aprueba el ID generado por el Claim Issuer para registrar el reclamo [2].
     */
    function approve(uint256 _id, bool _approve) public returns (bool success) {
        require(keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), MANAGEMENT_KEY) 
        || keyHasPurpose(keccak256(abi.encodePacked(msg.sender)), ACTION_KEY), "No autorizado");
        ExecutionRequest storage request = executionRequests[_id];
        require(!request.executed, "Ya ejecutado");

        if (_approve) {
            request.executed = true;
            (success, ) = request.to.call{value: request.value}(request.data);
            require(success, "Error en aprobacion");
            emit Executed(_id, request.to, request.value, request.data);
        }
        
        emit Approved(_id, _approve);
        return success;
    }
}