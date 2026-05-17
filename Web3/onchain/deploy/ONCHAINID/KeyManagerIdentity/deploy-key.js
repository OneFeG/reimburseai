const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../../helper-hardhat-config")
const { verify } = require("../../../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer, investor, entity } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("----------------------------------------------------")
    const claimsIdentity = await deploy("KeyManagerIdentity", {
        from: entity,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    console.log("KeyManagerIdentity deployed to:", claimsIdentity.address)
    networkConfig[chainId].onchainID.keyManagerIdentity.invoice = claimsIdentity.address

    // Verify the deployment
    if (!developmentChains.includes(network.name)) {
        //log("Verifying...")
        //await verify(claimsIdentity.address, [])
    }
}

module.exports.tags = ["all", "KeyManagerIdentity"]
