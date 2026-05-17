const networkConfig = {
    default: {
        name: "hardhat",
        erc20: "0x0000000000000000000000000000000000000000",
    },
    31337: {
        name: "localhost",
        erc20: "0x0000000000000000000000000000000000000000",
    },
    43113: {
        name: "fuji",
        onchainID: {
            claimsIdentity: {
                investor: "0xda09BD6914938eD89D306A4311CDAa932826d1Fc",
                invoice: "0x4E665C3C4B8b9e99Db6d1CAf56b70Aef28BC1487",
                bl: "",
                salary: "",
                equity: "",
                reembolsoAI: "0xF86294e229A57482E5Bd87a6E07A068b4b469dff",
            },
            keyManagerIdentity: {
                investor: "0x235CA26aDDE8eF0Fedf4C7Af0018D8fd1e10B7Fc",
                invoiceProvider: "0x3994BC456C6A3F2Aa48A9cdCd8DC086602B97d5d",
                blProvider: "",
                salaryProvider: "",
                equityProvider: "",
                reembolsoAI: "0xF933dF603e8108766a86caBfECB80351Dd1BBA49",
            }
        },
        EVS: "0x8e0B44e4fD64508CcD7F5DA50F95882C1001c5a6",
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 2
const frontEndContractsFile = "../hooks/contracts/contracts.json"
const frontEndAbiLocation = "../hooks/contracts"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiLocation,
}
