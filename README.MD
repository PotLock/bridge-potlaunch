# Bridge Potlaunch

## Overview

Bridge Potlaunch is a comprehensive cross-chain bridge platform designed for the Potlaunch ecosystem. This project provides a complete solution for cross-chain asset transfers, supporting multiple blockchain networks including Ethereum, Solana, and NEAR.

## Project Structure

```
bridge-potlaunch/
├── frontend/          # React-based web application
├── backend/           # Backend services (in development)
└── docs/             # Documentation (in development)
```

## Purpose

Bridge Potlaunch serves as a complete cross-chain bridge solution that enables:

- **Cross-Chain Asset Transfers**: Seamless transfer of assets between different blockchain networks
- **Multi-Chain Support**: Integration with Ethereum, Solana, and NEAR networks
- **User-Friendly Interface**: Modern web interface for bridge operations
- **Development & Testing**: Comprehensive testing environment for bridge operations

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Rsbuild
- **Styling**: Tailwind CSS
- **Routing**: TanStack Router
- **State Management**: React Query + Context API
- **UI Components**: Radix UI + Custom components
- **Blockchain Integration**: 
  - Ethereum: wagmi + RainbowKit
  - Solana: @solana/web3.js + Wallet Adapter
  - NEAR: NEAR Wallet Selector
  - Bridge SDK: omni-bridge-sdk


## Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PotLock/bridge-potlaunch
   cd bridge-potlaunch
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - The bridge interface will be available for testing

### Environment Setup

Create environment configuration files as needed for different blockchain networks and API endpoints.

## Development Status

⚠️ **Development Version** - This is currently in active development and testing phase.

## Testing Guidelines

### Bridge Testing
- Use only testnet assets and networks for development
- Follow established testing protocols
- Test across all supported blockchain networks
- Validate transaction flows and error handling
- Report issues through designated channels

## Contributing

### Development Team
This project is maintained by the Potlaunch development team and authorized contributors.

### Guidelines
- Follow TypeScript best practices
- Maintain code quality and documentation
- Test thoroughly before submitting changes
- Follow the established coding standards
- Coordinate with the team for major changes

### Contact
For questions, issues, or contributions, please contact the development team.

## Architecture

### Bridge Flow
1. **Wallet Connection**: User connects their wallet (Ethereum/Solana/NEAR)
2. **Asset Selection**: Choose source and destination chains/assets
3. **Transaction Initiation**: Initiate cross-chain transfer
4. **Validation**: System validates transaction parameters
5. **Execution**: Bridge executes the cross-chain transfer
6. **Confirmation**: User receives confirmation and transaction details

## License

This project is proprietary software developed for the Potlaunch ecosystem.

---

**Note**: This is the Bridge Potlaunch platform - a comprehensive cross-chain bridge solution for the Potlaunch ecosystem. For production use, ensure all security measures are properly implemented and tested.
