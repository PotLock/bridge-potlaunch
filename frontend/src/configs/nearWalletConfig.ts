import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import type { SetupParams } from "@near-wallet-selector/react-hook";


export const nearWalletConfig: SetupParams = {
  network: 'testnet',
  modules: [
    setupMeteorWallet()
  ],
  languageCode: "en",
  debug: true,
  createAccessKeyFor:{
    contractId: "v1.social08.testnet",
    methodNames: []
  },
}; 