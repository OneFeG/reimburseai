const hre = require("hardhat")
const { ethers, getNamedAccounts, network } = hre
const { networkConfig } = require("../../../helper-hardhat-config")

const keyTypes = {
    MANAGEMENT_KEY: 1, // Permite añadir/eliminar otras claves y reclamos
    ACTION_KEY: 2,     // Permite ejecutar transacciones (Proxy)
    CLAIM_SIGNER_KEY: 3,   // Permite firmar reclamos
}

async function main() {
    const { deployer, investor, entity } = await getNamedAccounts()

    const chainId = network.config.chainId

    // Conectar manualmente con la address del deployer
    const signer = await ethers.getSigner(entity)
    const issuer = await signer.getAddress()

    const contractKeysAddress = networkConfig[chainId].onchainID.keyManagerIdentity.invoiceProvider

    // Conecta tu contrato en Fuji (sin redeploy, solo attach)
    const contract = await ethers.getContractAt("KeyManagerIdentity", contractKeysAddress, signer)

    try {

        const keyHash = ethers.solidityPackedKeccak256(["address"], [issuer])
        console.log("🧾 keyHash:", keyHash)

        const tx = await contract.addKey(keyHash, keyTypes.ACTION_KEY, 1)
        const receipt = await tx.wait()

        console.log("✅ Transacción confirmada")
        console.log("🔍 Hash Tx:", receipt.hash)

        const parsed = []
        for (const log of receipt.logs || []) {
            if (!log.address || log.address.toLowerCase() !== contractKeysAddress.toLowerCase())
                continue
            try {
                const parsedLog = contract.interface.parseLog(log)
                parsed.push(parsedLog)
            } catch (_) {}
        }

        for (const event of parsed) {
            console.log("📢 Evento:", event.name)
            console.log("📦 Argumentos:", event.args)
        }


        const key = await contract.getKey(keyHash)
        console.log("🧾 Get onchain key:", key)
    } catch (error) {
        console.error("❌ Transacción revertida")
        // Decodificar error personalizado
        if (error.errorName) {
            console.error("🔍 Error personalizado:", error.errorName)
            console.error("📦 Args:", error.errorArgs)
        }
        // En caso de fallback
        if (error.reason) {
            console.error("📜 Reason:", error.reason)
        } else if (error.message) {
            console.error("📜 Message:", error.message)
        } else {
            console.error("⛔ Error completo:", error)
        }
    }
}

main().catch((error) => {
    console.error("❌ Error en el script:", error)
    process.exit(1)
})
