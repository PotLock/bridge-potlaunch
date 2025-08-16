import { NEAR_NETWORK } from "../configs/env.config";

function getRpcEndpoint(): string {  
    switch (NEAR_NETWORK) {
      case 'mainnet':
        return 'https://api.nearblocks.io/v1';
      case 'testnet':
        return 'https://api-testnet.nearblocks.io/v1';
      default:
        return 'https://api-testnet.nearblocks.io/v1';
    }
  }

const getNearBalance = async (walletAddress: string) => {
    const accountRes = await fetch(`${getRpcEndpoint()}/account/${walletAddress}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const accountInfo = await accountRes.json()

    const balance = accountInfo.account[0].amount

    return (Number(balance)/(10**24)).toFixed(5);
}

export {
    getNearBalance
}