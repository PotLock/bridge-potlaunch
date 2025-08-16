import { ChainKind, omniAddress, OmniBridgeAPI } from "omni-bridge-sdk"

const isRegisteredToken = async (
    sender: string,
    mint: string,
    recipient: string,
) =>{
    try{
        const api = new OmniBridgeAPI(
            {
                baseUrl: 'https://testnet.api.bridge.nearone.org',
            }
        )

        const senderAddress = omniAddress(ChainKind.Sol, sender) as any;
        const recipientAddress = omniAddress(ChainKind.Near, recipient) as any;
        const tokenAddress = omniAddress(ChainKind.Sol, mint) as any;

        await api.getFee(senderAddress,recipientAddress, tokenAddress)
        return true
    }catch(error){
        // console.log("error get fee transfer", error)
        // throw error
        return false
    }
}

export {
    isRegisteredToken
}