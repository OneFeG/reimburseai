const hre = require("hardhat")
const { ethers, getNamedAccounts, network } = hre
const { networkConfig } = require("../../../helper-hardhat-config")
const metadataInvestor = require("../../../data/investor")

const topics = {
    investor: 1999n,
    kyc: 2001n,
    lists: 2002n,
    jurisdiction: 2003n,
    aml: 2004n,
}

function normalizeMoney(value) {
    if (typeof value === "number") return value.toFixed(2)
    return String(value)
}

async function main() {
    const { deployer, investor, entity } = await getNamedAccounts()

    const chainId = network.config.chainId

    // Conectar manualmente con la address del deployer
    const signer = await ethers.getSigner(investor)
    const issuer = await ethers.getSigner(entity)
    const issuerAddress = await issuer.getAddress()

    const contractClaimsAddress = networkConfig[chainId].onchainID.claimsIdentity.investor

    // Conecta tu contrato en Fuji (sin redeploy, solo attach)
    const contract = await ethers.getContractAt("ClaimsIdentity", contractClaimsAddress, signer)

    try {
        const investorData = metadataInvestor
        const topic = topics.aml

        const scheme = 1n

        const uri = String(investorData.URL || "")

        const metadataHash = ethers.solidityPackedKeccak256(
            [
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
                "string",
            ],
            [
                String(investorData.nombres),
                String(investorData.apellidos),
                String(investorData.tipo_identificacion),
                String(investorData.numero_identificacion),
                String(investorData.pasaporte_id),
                String(investorData.pais),
                String(investorData.ciudad),
                String(investorData.direccion),
                String(investorData.fecha_nacimiento),
                String(investorData.correo),
                String(investorData.celular),
                String(investorData.estado_civil),
                String(investorData.genero),
                String(investorData.nacionalidad),
                String(investorData.etnia),
                String(investorData.religion),
                String(investorData.idioma),
                uri,
            ],
        )

        const signature = await issuer.signMessage(ethers.getBytes(metadataHash))

        /*
        const data = {topic,scheme,issuerAddress,signature,metadataHash,uri}
        const res = await executeRequest({issuer,to: contractClaimsAddress,value: 0,data})
        */

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
