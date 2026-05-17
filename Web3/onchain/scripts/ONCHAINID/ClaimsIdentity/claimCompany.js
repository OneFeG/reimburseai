const hre = require("hardhat")
const { ethers, getNamedAccounts, network } = hre
const { networkConfig } = require("../../../helper-hardhat-config")
const metadataCompany = require("../../../data/company")

const topics = {
    company: 2000n,
    kyc: 2001n,
    lists: 2002n,
    jurisdiction: 2003n,
    aml: 2004n,
    sar_ros: 2005n,
    risk: 2006n,
    monitoreo: 2007n,
    iso_27000: 2008n,
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

    const contractClaimsAddress = networkConfig[chainId].onchainID.claimsIdentity.reembolsoAI

    // Conecta tu contrato en Fuji (sin redeploy, solo attach)
    const contract = await ethers.getContractAt("ClaimsIdentity", contractClaimsAddress, signer)

    try {
        const companyData = metadataCompany
        const topic = topics.company

        const scheme = 1n

        const uri = String(companyData.URL || "")

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
            ],
            [
                String(companyData.razon_social),
                String(companyData.nit),
                String(companyData.rut),
                String(companyData.pais),
                String(companyData.ciudad),
                String(companyData.direccion),
                String(companyData.celular),
                String(companyData.correo),
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
