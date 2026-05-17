# ReembolsoAI · Onchain (web3-reembolsoai)

Repositorio Hardhat para el módulo on-chain de ReembolsoAI enfocado en **identidad on-chain (ONCHAINID)** y un **sistema de verificación de elegibilidad/cumplimiento (EVS)** basado en *claims* (credenciales firmadas) y roles.

- Red objetivo actual: **Avalanche Fuji (43113)**
- Stack: **Hardhat + hardhat-deploy + ethers v6 + OpenZeppelin**

## Arquitectura

Diagrama: [Architecture.png](./Architecture.png)

La arquitectura modela un flujo de tokenización/verificación de activos (RWA) donde:

- **ONCHAINID** representa el “contenedor” de identidad on-chain, compuesto por:
  - **Key Identity** (gestión de llaves y ejecución/approval de acciones).
  - **Claims Identity** (credenciales firmadas: KYC/KYB, estado de factura, AML, etc.).
- **ReembolsoAI** (plataforma) consume/verifica identidades y claims para operar con el **Activo Financiero** y coordinar con:
  - **Entidad legítima custodial del activo** (custodia/administración).
  - **Entidad de legitimidad regulatoria** (emisión/validación/credenciales y/o cumplimiento).
- En la parte superior se muestran piezas típicas de un stack RWA (p.ej. Token Identity Registry, Compliance Rules, Token Activo RWA). En este repositorio, esas piezas están representadas conceptual­mente en el diagrama, pero **el código implementado se centra en ONCHAINID (Keys/Claims) + EVS**.

## Qué implementa este repositorio

### 1) `ClaimsIdentity` (ERC-735 simplificado)

Contrato para registrar *claims* (credenciales) asociadas a una identidad.

- Archivo: [ERC-735.sol](./contracts/ONCHAINID/ERC-735.sol#L1-L65)
- Nombre de contrato: `ClaimsIdentity`
- Modelo de claim:
  - `topic`: tipo de claim (ej. KYC, AML, invoice valida, etc.)
  - `scheme`: esquema de firma (en scripts se usa `1`)
  - `issuer`: address que firma (emisor/validador)
  - `signature`: firma del `data`
  - `data`: hash (idealmente `bytes32`) de metadata privada
  - `uri`: referencia opcional (IPFS/Vault) a contenido cifrado

Punto clave:
- `addClaim(...)` está protegido por `onlyOwner`. El “dueño” de cada `ClaimsIdentity` es quien puede escribir claims.

### 2) `KeyManagerIdentity` (ERC-734 simplificado)

Contrato de gestión de llaves con un patrón de ejecución directa o por solicitud/aprobación.

- Archivo: [ERC-734.sol](./contracts/ONCHAINID/ERC-734.sol#L1-L121)
- Nombre de contrato: `KeyManagerIdentity`
- Propósitos (constantes):
  - `MANAGEMENT_KEY = 1`
  - `ACTION_KEY = 2`
  - `CLAIM_SIGNER_KEY = 3`

Comportamiento:
- Si el caller tiene `MANAGEMENT_KEY` o `ACTION_KEY`, `execute(...)` realiza la llamada inmediatamente.
- Si no tiene permisos, `execute(...)` crea una `ExecutionRequest` pendiente; luego una clave autorizada puede `approve(...)` para ejecutar.

### 3) `EVS` (Eligibility Verification System)

Contrato “orquestador” que:
- registra qué address (wallet) tiene qué **rol**,
- asocia esa wallet a una `ClaimsIdentity` (la identidad a consultar),
- define *requirements* (lista de `topics`) por rol,
- valida que para cada topic exista al menos un claim emitido por un `trusted issuer` y cuya firma sea correcta.

- Archivo: [IdentityRegistry.sol](./contracts/EligibilityVerificationSystem/IdentityRegistry.sol#L1-L137)
- Nombre de contrato: `EVS`
- Roles (`EntityType`):
  - `Inversor`, `Plataforma`, `GoldenCopy`, `Emisor`
- Admin:
  - `setRoleRequirements(role, topics[])` (solo owner)
  - `addIdentityToStorage(user, identity, role)` (solo owner)
  - `addTrustedIssuer(issuer)` (solo owner)

Verificación (`isVerified(user)`):
- Obtiene la `ClaimsIdentity` del usuario.
- Recorre los topics requeridos para el rol.
- Para cada topic:
  - `identity.getClaimsByTopic(topic)` debe devolver al menos un claim.
  - Debe existir un claim cuyo `issuer` esté marcado como trusted.
  - La firma debe validar contra `issuer` usando `ECDSA.recover` sobre:
    - `keccak256("\x19Ethereum Signed Message:\n32" || data)`
  - Nota: el contrato exige `data.length == 32` para validar.

## Topics/Claims usados en los scripts

Los scripts definen los siguientes topics (BigInt):

- Factura / estado del activo (RWA):
  - `1000` invoice
  - `1001` valida
  - `1002` endoso
  - `1003` recibida
  - `1004` tokenizada
  - `1005` UsuarioAcreditado
- Identidad / cumplimiento:
  - `1999` investor
  - `2000` company
  - `2001` kyc
  - `2002` lists
  - `2003` jurisdiction
  - `2004` aml
  - `2005` sar_ros
  - `2006` risk
  - `2007` monitoreo
  - `2008` iso_27000

Implementación de referencia:
- [EVS.js](./scripts/IdentityRegistry/EVS.js#L5-L29)

## Estructura del proyecto

- `contracts/`
  - `ONCHAINID/`
    - `ERC-734.sol` (`KeyManagerIdentity`)
    - `ERC-735.sol` (`ClaimsIdentity`)
  - `EligibilityVerificationSystem/`
    - `IdentityRegistry.sol` (`EVS`)
  - `interfaces/`
    - `IClaimsIdentity.sol`, `IKeyManagerIdentity.sol`
- `deploy/` (hardhat-deploy)
  - `IdentityRegistry/deploy-evs.js`
  - `ONCHAINID/ClaimsIdentity/deploy-claims.js`
  - `ONCHAINID/KeyManagerIdentity/deploy-key.js`
- `scripts/` (operación/configuración en red)
  - `IdentityRegistry/EVS.js` (config inicial del EVS)
  - `IdentityRegistry/isVerified.js` (ejecuta verificación)
  - `ONCHAINID/ClaimsIdentity/*` (emisión de claims)
  - `ONCHAINID/KeyManagerIdentity/*` (alta de keys)
- `data/` (metadata ejemplo para hash + URI)
  - `invoice.js`, `company.js`, `investor.js`
- `deployments/` (artefactos hardhat-deploy, incluye addresses en Fuji)
- `helper-hardhat-config.js` (config de red y addresses)

## Configuración

### Requisitos

- Node.js (recomendado: LTS)
- Yarn
- Wallets/keys con AVAX de testnet si usas Fuji

### Variables de entorno

Este proyecto lee variables desde `.env` (vía `dotenv`).

Claves:
- `PRIVATE_KEY_DEPLOYER`
- `PRIVATE_KEY_INVESTOR`
- `PRIVATE_KEY_ENTITY`

RPC:
- `AVALANCHE_FUJI_RPC` (default: `https://rpc.ankr.com/avax_fuji`)
- `AVALANCHE_MAINNET_RPC` (default: `https://rpc.ankr.com/avax`)

Verificación:
- `ETHERSCAN_API_KEY` (Snowtrace testnet en config como `avalancheFujiTestnet`)

Config de referencia:
- [hardhat.config.js](./hardhat.config.js#L17-L113)

### Addresses (Fuji)

El archivo [helper-hardhat-config.js](./helper-hardhat-config.js#L1-L31) mantiene addresses preconfiguradas para Fuji:

- EVS: `0x8e0B44e4fD64508CcD7F5DA50F95882C1001c5a6`
- ClaimsIdentity
  - investor: `0xda09BD6914938eD89D306A4311CDAa932826d1Fc`
  - invoice: `0x4E665C3C4B8b9e99Db6d1CAf56b70Aef28BC1487`
  - reembolsoAI: `0xF86294e229A57482E5Bd87a6E07A068b4b469dff`
- KeyManagerIdentity
  - investor: `0x235CA26aDDE8eF0Fedf4C7Af0018D8fd1e10B7Fc`
  - invoiceProvider: `0x3994BC456C6A3F2Aa48A9cdCd8DC086602B97d5d`
  - reembolsoAI: `0xF933dF603e8108766a86caBfECB80351Dd1BBA49`

Notas importantes:
- En `deployments/fuji/` existen artefactos con nombres como `ClaimsIdentity_Investor.json` y `KeyManagerIdentity_Investor.json`. Los scripts actuales de deploy despliegan instancias genéricas (`ClaimsIdentity`, `KeyManagerIdentity`); si quieres reproducir múltiples instancias con nombres/roles, debes adaptar los deploy scripts a esos nombres (o mantener el esquema actual y actualizar `helper-hardhat-config.js`).

## Instalación

```bash
yarn install
```

## Deploy (hardhat-deploy)

Scripts declarados en [package.json](./package.json#L7-L20).

Despliegue a Fuji:

```bash
yarn deploy:claims
yarn deploy:key
yarn deploy:identity
```

## Operación / Flujos

### A) Emitir un claim (off-chain → on-chain)

Patrón usado en los scripts:

1) Construyes el `metadataHash` (hash de campos sensibles + `uri`):
   - ejemplo en [claimsInvoice.js](./scripts/ONCHAINID/ClaimsIdentity/claimsInvoice.js#L50-L73)
2) El issuer firma ese `metadataHash`:
   - `signature = issuer.signMessage(getBytes(metadataHash))`
3) El owner de la `ClaimsIdentity` registra el claim:
   - `addClaim(topic, scheme, issuerAddress, signature, metadataHash, uri)`

Ejecutables:

```bash
yarn run:claims:invoice
yarn run:claims:reembolso
yarn run:claims:investor
```

Notas:
- `ClaimsIdentity.addClaim` es `onlyOwner`. Los scripts asumen que el signer que ejecuta el script es el owner del contrato objetivo. Si no coincide, la transacción revertirá.
- `EVS.getSigner` valida firmas con prefijo “Ethereum Signed Message” y espera que `data` sea de longitud 32 (un `bytes32`). Usa exactamente el mismo método al firmar (`signMessage(bytes32)`), para que el digest coincida.

### B) Dar de alta keys (KeyManagerIdentity)

Scripts para agregar `ACTION_KEY` a una key (hash de la address):

```bash
yarn run:key:reembolso
yarn run:key:investor
yarn run:key:entity
```

Referencia:
- [keyReembolsoAI.js](./scripts/ONCHAINID/KeyManagerIdentity/keyReembolsoAI.js#L1-L67)

### C) Configurar EVS (trusted issuers, identidades, requirements)

Este script configura el EVS con:
- `addTrustedIssuer(...)`
- `addIdentityToStorage(user → ClaimsIdentity, role)`
- `setRoleRequirements(role → topics[])`

```bash
yarn run:identity
```

Referencia:
- [EVS.js](./scripts/IdentityRegistry/EVS.js#L31-L169)

### D) Verificar elegibilidad/cumplimiento

Ejecuta `isVerified` para varias identidades (deployer, investor, invoice, entity):

```bash
yarn run:isVerified
```

Referencia:
- [isVerified.js](./scripts/IdentityRegistry/isVerified.js#L25-L120)

## Seguridad y consideraciones de diseño

- Privacidad: el repositorio almacena en cadena únicamente un `hash` (`metadataHash`) y opcionalmente un `uri`. Asegura que el contenido real referenciado por `uri` esté cifrado y que el hash se compute de manera determinística.
- Confianza: EVS sólo acepta claims de `trusted issuers`. La lista de trusted issuers y el registro `user → ClaimsIdentity` es `onlyOwner`, por lo que el owner del EVS es un punto crítico.
- Firma: el esquema actual valida `signMessage` (EIP-191) sobre `bytes32`. Si migras a EIP-712 (Typed Data), debes actualizar la verificación on-chain para usar el digest correcto.
- Estado mutante en verificación: `EVS.isVerified` emite evento y no es `view`. Si quieres verificación “gratuita”, considera exponer una función `view` equivalente que no emita eventos.

## Lint / estilo

Configuración incluida:
- `.prettierrc`, `prettier-plugin-solidity`
- `.solhint.json`

## Licencia

ISC (según `package.json`).
