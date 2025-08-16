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

/**
 * Formats a number with K, M, B, T suffixes for better readability
 * @param num - The number to format
 * @param decimals - Number of decimal places to show (default: 1)
 * @returns Formatted string with appropriate suffix
 */
export const formatNumber = (num: number, decimals: number = 1): string => {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1e12) {
    return `${sign}${(absNum / 1e12).toFixed(decimals)}T`;
  } else if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(decimals)}B`;
  } else if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(decimals)}M`;
  } else if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(decimals)}K`;
  } else {
    return `${sign}${absNum.toFixed(decimals)}`;
  }
};

