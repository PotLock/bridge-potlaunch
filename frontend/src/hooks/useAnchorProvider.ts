import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, Transaction } from "@solana/web3.js";


class CustomAnchorProvider extends anchor.AnchorProvider {
  async sendAndConfirm(transaction: Transaction, signers?: Keypair[], opts?: any): Promise<string> {
    return super.sendAndConfirm(transaction, signers, opts);
  }
}

export default function useAnchorProvider() {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  
  // Return null if wallet or connection is not available
  if (!connection || !anchorWallet) {
    return null;
  }

  try {
    if (typeof window !== 'undefined') {
      anchor.setProvider(new anchor.AnchorProvider(
        connection,
        anchorWallet as any,
        {
          preflightCommitment: "confirmed",
          commitment: "confirmed",
        }
      ));
    }

    const providerProgram = new CustomAnchorProvider(
      connection,
      anchorWallet as any,
      {
        preflightCommitment: "confirmed",
        commitment: "confirmed",
      }
    );

    const governanceKeypair = Keypair.generate();
    const mintKeypair = Keypair.generate();
    
    return {
      connection,
      anchorWallet,
      providerProgram,
      governanceKeypair,
      mintKeypair
    };
  } catch (error) {
    console.error('Error creating Anchor provider:', error);
    return null;
  }
}