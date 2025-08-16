import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import { nearWalletConfig } from "../configs/nearWalletConfig";
import WalletContextProvider from "../contexts/WalletProviderContext";
import Header from "../components/Header";
import { Footer } from "../components/Footer";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
    return (
        <QueryClientProvider client={queryClient}>
            <WalletSelectorProvider config={nearWalletConfig}>
                <WalletContextProvider> 
                    <Header/>
                    <Outlet />
                    <Footer/>
                </WalletContextProvider>
            </WalletSelectorProvider>
        </QueryClientProvider>
    );
}

export default RootComponent;