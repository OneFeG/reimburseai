const hre = require("hardhat")
const { ethers, getNamedAccounts, network } = hre
const { networkConfig } = require("../../helper-hardhat-config")

const ROLE_NAMES = {
    0: "None",
    1: "Inversor",
    2: "Plataforma",
    3: "GoldenCopy",
    4: "Emisor",
}

function getRevertData(error) {
    if (!error) return null
    if (typeof error.data === "string") return error.data
    if (error.data && typeof error.data.data === "string") return error.data.data
    if (error.error && typeof error.error.data === "string") return error.error.data
    if (error.error && error.error.data && typeof error.error.data.data === "string")
        return error.error.data.data
    if (error.info && error.info.error && typeof error.info.error.data === "string")
        return error.info.error.data
    return null
}

async function main() {
    const { deployer, investor, entity } = await getNamedAccounts()
    const chainId = network.config.chainId
    // Conectar manualmente con la address del deployer
    const signer = await ethers.getSigner(deployer)
    const contractIdentityAddress = networkConfig[chainId].EVS
    // Conecta tu contrato en Fuji (sin redeploy, solo attach)
    const contract = await ethers.getContractAt("EVS", contractIdentityAddress, signer)
    try {

        const checks = [
            { label: "deployer", userAddress: deployer },
            { label: "investor", userAddress: investor },
            { label: "invoice", userAddress:  networkConfig[chainId].onchainID.claimsIdentity.invoice},
            { label: "entity", userAddress: entity }, //ES ISSUER
        ]

        for (const check of checks) {
            console.log("🔎 isVerified.staticCall:", check.label, check.userAddress)
            try {

                const tx = await contract.isVerified(check.userAddress)
                const receipt = await tx.wait()

                console.log("✅ Transacción confirmada (isVerified): ", check.label)
                console.log("🔍 Hash Tx:", receipt.hash)

                const parsed = []
                for (const log of receipt.logs || []) {
                    if (
                        !log.address ||
                        log.address.toLowerCase() !== contractIdentityAddress.toLowerCase()
                    )
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
            } catch (error) {
                console.error("❌ Revert (isVerified)", check.label)
                if (error.code) console.error("🔍 Code:", error.code)
                if (error.errorName) {
                    console.error("🔍 Error personalizado:", error.errorName)
                    console.error("📦 Args:", error.errorArgs)
                    continue
                }

                const revertData = getRevertData(error)
                if (revertData) {
                    try {
                        const decoded = contract.interface.parseError(revertData)
                        console.error("🔍 Error personalizado:", decoded.name)
                        console.error("📦 Args:", decoded.args)
                        continue
                    } catch (_) {}
                    console.error("🔍 Revert data:", revertData)
                } else {
                    console.error("🔍 Revert data:", null)
                }

                if (error.reason) console.error("📜 Reason:", error.reason)
                else if (error.shortMessage) console.error("📜 Message:", error.shortMessage)
                else if (error.message) console.error("📜 Message:", error.message)
                else console.error("⛔ Error completo:", error)
            }
        }
    } catch (error) {
        console.error("❌ Error en isVerified.js")
        if (error.errorName) {
            console.error("🔍 Error personalizado:", error.errorName)
            console.error("📦 Args:", error.errorArgs)
            return
        }

        const revertData = getRevertData(error)
        if (revertData) {
            try {
                const decoded = contract.interface.parseError(revertData)
                console.error("🔍 Error personalizado:", decoded.name)
                console.error("📦 Args:", decoded.args)
                return
            } catch (_) {}
        }

        if (error.reason) console.error("📜 Reason:", error.reason)
        else if (error.shortMessage) console.error("📜 Message:", error.shortMessage)
        else if (error.message) console.error("📜 Message:", error.message)
        else console.error("⛔ Error completo:", error)
    }
}

main().catch((error) => {
    console.error("❌ Error en el script:", error)
    process.exit(1)
})
