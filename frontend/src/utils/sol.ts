import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { SOL_NETWORK } from "../configs/env.config";

export const solNetwork = () => {
  switch (SOL_NETWORK) {
    case "mainnet":
      return WalletAdapterNetwork.Mainnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
};
