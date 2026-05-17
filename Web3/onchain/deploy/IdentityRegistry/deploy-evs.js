const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { verify } = require("../../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer} = await getNamedAccounts()

    log("----------------------------------------------------")
    const identityRegistry = await deploy("EVS", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    console.log("IdentityRegistry deployed to:", identityRegistry.address)

    // Verify the deployment
    if (!developmentChains.includes(network.name)) {
        //log("Verifying...")
        //await verify(identityRegistry.address, [])
    }
}

module.exports.tags = ["all", "EVS"]