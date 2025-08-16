import { ethers } from "ethers";

const getBalanceEVM = async (address: string) =>{
    const provider = new ethers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io");
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}

export {
    getBalanceEVM
}