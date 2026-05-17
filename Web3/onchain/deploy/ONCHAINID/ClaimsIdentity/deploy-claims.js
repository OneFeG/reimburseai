const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../../helper-hardhat-config")
const { verify } = require("../../../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer, investor } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("----------------------------------------------------")
    const claimsIdentity = await deploy("ClaimsIdentity", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    console.log("ClaimsIdentity deployed to:", claimsIdentity.address)

    // Verify the deployment
    if (!developmentChains.includes(network.name)) {
        //log("Verifying...")
        //await verify(claimsIdentity.address, [])
    }
}

module.exports.tags = ["all", "claimsIdentity"]
