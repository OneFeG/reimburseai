const hre = require("hardhat")
const { ethers, getNamedAccounts, network } = hre
const { networkConfig } = require("../../../helper-hardhat-config")
const metadataInvoice = require("../../../data/invoice")

// 1001 para "Factura a Credito(Valida Actualmente - Titulo Valor) - Firma DIAN o Tercero Autorizado"
// 1002 para "Factura a Credito(Endoso Trasladado a ReembolsoAI - Titulo Valor) - Firma DIAN o Tercero Autorizado"
// 1003 para "Factura a Credito(Recibida y Aceptada por ReembolsoAI - Titulo Valor) - Firma ReembolsoAI"
// 1004 para "Factura a Credito Tokenizada(Negociada por ReembolsoAI e Inversor Servido - Titulo Valor) - Firma ReembolsoAI"
// 1005 para "Factura a Credito(Usuario Acreditado por ReembolsoAI - Titulo Valor) - Firma ReembolsoAI"
const topics = {
    invoice: 1000n,
    valida: 1001n,
    endoso: 1002n,
    recibida: 1003n,
    tokenizada: 1004n,
    UsuarioAcreditado: 1005n,
}

function normalizeMoney(value) {
    if (typeof value === "number") return value.toFixed(2)
    return String(value)
}

async function main() {
    const { deployer, investor, entity } = await getNamedAccounts()

    const chainId = network.config.chainId

    // Conectar manualmente con la address del deployer
    const signer = await ethers.getSigner(deployer)
    const issuer = await ethers.getSigner(entity)
    const issuerAddress = await issuer.getAddress()

    const contractClaimsAddress = networkConfig[chainId].onchainID.claimsIdentity.invoice

    // Conecta tu contrato en Fuji (sin redeploy, solo attach)
    const contract = await ethers.getContractAt("ClaimsIdentity", contractClaimsAddress, signer)

    try {
        const invoice = metadataInvoice

        const topic = topics.invoice
        const scheme = 1n

        const iva = normalizeMoney(invoice.IVA)
        const total = normalizeMoney(invoice.Total)
        const uri = String(invoice.URL || "")

        const metadataHash = ethers.solidityPackedKeccak256(
            [
                "string",
                "uint256",
                "string",
                "string",
                "uint256",
                "string",
                "string",
                "string",
                "string",
            ],
            [
                String(invoice.CUFE_CUDE),
                BigInt(invoice.Folio),
                String(invoice.Prefijo),
                String(invoice.Fecha_Emision),
                BigInt(invoice.NIT_Emisor),
                String(invoice.Nombre_Emisor),
                iva,
                total,
                uri,
            ],
        )

        const signature = await issuer.signMessage(ethers.getBytes(metadataHash))

        const tx = await contract.addClaim(topic, scheme, issuerAddress, signature, metadataHash, uri)
        const receipt = await tx.wait()

        console.log("✅ Transacción confirmada")
        console.log("🔍 Hash Tx:", receipt.hash)

        const parsed = []
        for (const log of receipt.logs || []) {
            if (!log.address || log.address.toLowerCase() !== contractClaimsAddress.toLowerCase())
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

        const claimId = ethers.solidityPackedKeccak256(["address", "uint256"], [issuerAddress, topic])
        console.log("🧾 issuer:", issuerAddress)
        console.log("🧾 topic:", topic.toString())
        console.log("🧾 data (metadataHash):", metadataHash)
        console.log("🧾 signature:", signature)
        console.log("🧾 uri:", uri)
        console.log("🧾 claimId:", claimId)

        const claim = await contract.getClaim(claimId)
        console.log("🧾 Get onchain claim:", claim)
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
