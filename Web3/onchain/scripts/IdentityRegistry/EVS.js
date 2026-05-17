const hre = require("hardhat")
const { ethers, getNamedAccounts, network } = hre
const { networkConfig } = require("../../helper-hardhat-config")

const ROLES = {
    None: 0,
    Inversor: 1,
    Plataforma: 2,
    GoldenCopy: 3,
    Emisor: 4,
}
const TOPICS = {
    invoice: 1000n,
    valida: 1001n,
    endoso: 1002n,
    recibida: 1003n,
    tokenizada: 1004n,
    UsuarioAcreditado: 1005n,
    investor: 1999n,
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

async function main() {
    const { deployer, investor, entity } = await getNamedAccounts()
    const chainId = network.config.chainId
    // Conectar manualmente con la address del deployer
    const signer = await ethers.getSigner(deployer)
    const contractIdentityAddress = networkConfig[chainId].EVS
    // Conecta tu contrato en Fuji (sin redeploy, solo attach)
    const contract = await ethers.getContractAt("EVS", contractIdentityAddress, signer)

    try {
        const identities = networkConfig[chainId].onchainID.claimsIdentity

        const txTrustedIssuer = await contract.addTrustedIssuer(entity)
        const resTrustedIssuer = await txTrustedIssuer.wait()

        console.log("✅ Transacción confirmada (addTrustedIssuer)")
        console.log("🔍 Hash Tx:", resTrustedIssuer.hash)

        const txTrustedIssuerDeployer = await contract.addTrustedIssuer(deployer)
        const resTrustedIssuerDeployer = await txTrustedIssuerDeployer.wait()

        console.log("✅ Transacción confirmada (addTrustedIssuer)")
        console.log("🔍 Hash Tx:", resTrustedIssuerDeployer.hash)

        const txInvestor = await contract.addIdentityToStorage(
            investor,
            identities.investor,
            ROLES.Inversor,
        )
        const resInvestor = await txInvestor.wait()

        console.log("✅ Transacción confirmada (addIdentityToStorage - Inversor)")
        console.log("🔍 Hash Tx:", resInvestor.hash)

        const txPlataforma = await contract.addIdentityToStorage(
            deployer,
            identities.reembolsoAI,
            ROLES.Plataforma,
        )
        const resPlataforma = await txPlataforma.wait()

        console.log("✅ Transacción confirmada (addIdentityToStorage - Plataforma)")
        console.log("🔍 Hash Tx:", resPlataforma.hash)

        const txGoldenCopy = await contract.addIdentityToStorage(
            identities.invoice,
            identities.invoice, 
            ROLES.GoldenCopy,
        )
        const resGoldenCopy = await txGoldenCopy.wait()

        console.log("✅ Transacción confirmada (addIdentityToStorage - GoldenCopy)")
        console.log("🔍 Hash Tx:", resGoldenCopy.hash)

        // Configura los roles y los topics para cada rol
        const txRoleInversor = await contract.setRoleRequirements(ROLES.Inversor, [
            TOPICS.investor,
            TOPICS.kyc,
            TOPICS.lists,
            TOPICS.jurisdiction,
            TOPICS.aml,
        ])
        const resRoleInversor = await txRoleInversor.wait()

        console.log("✅ Transacción confirmada (setRoleRequirements - Inversor)")
        console.log("🔍 Hash Tx:", resRoleInversor.hash)

        const txRolePlataforma = await contract.setRoleRequirements(ROLES.Plataforma, [
            TOPICS.company,
            TOPICS.kyc,
            TOPICS.lists,
            TOPICS.jurisdiction,
            TOPICS.aml,
            TOPICS.sar_ros,
            TOPICS.risk,
            TOPICS.monitoreo,
            TOPICS.iso_27000,
        ])
        const resRolePlataforma = await txRolePlataforma.wait()

        console.log("✅ Transacción confirmada (setRoleRequirements - Plataforma)")
        console.log("🔍 Hash Tx:", resRolePlataforma.hash)

        const txRoleGoldenCopy = await contract.setRoleRequirements(ROLES.GoldenCopy, [
            TOPICS.invoice,
            TOPICS.valida,
            TOPICS.endoso,
            TOPICS.recibida,
            TOPICS.tokenizada,
            TOPICS.UsuarioAcreditado,
        ])
        const resRoleGoldenCopy = await txRoleGoldenCopy.wait()

        console.log("✅ Transacción confirmada (setRoleRequirements - GoldenCopy)")
        console.log("🔍 Hash Tx:", resRoleGoldenCopy.hash)

        const parsed = []
        for (const receipt of [
            resTrustedIssuer,
            resInvestor,
            resPlataforma,
            resGoldenCopy,
            resRoleInversor,
            resRolePlataforma,
            resRoleGoldenCopy,
        ]) {
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
        }

        for (const event of parsed) {
            console.log("📢 Evento:", event.name)
            console.log("📦 Argumentos:", event.args)
        }
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
