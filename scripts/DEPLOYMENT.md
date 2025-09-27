# Medis dApp Deployment Guide

## Prerequisites

1. **Install Sui CLI**

   ```bash
   # Follow the official Sui installation guide
   # https://docs.sui.io/guides/developer/getting-started/sui-install
   ```

2. **Set up Sui Wallet**

   ```bash
   # Create or import a wallet
   sui client new-address ed25519

   # Get devnet gas tokens
   sui client faucet

   # Check your address
   sui client active-address
   ```

3. **Configure Network**

   ```bash
   # Switch to devnet (recommended for testing)
   sui client switch --env devnet

   # Verify connection
   sui client envs
   ```

## Deployment Steps

### Step 1: Deploy Smart Contracts

**Option A: Using Bash (Linux/Mac/WSL)**

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh devnet
```

**Option B: Using PowerShell (Windows)**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\deploy.ps1 devnet
```

**Option C: Manual Deployment**

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

### Step 2: Extract Object IDs

After successful deployment, you'll see output like this:

```
╭─────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                                                    │
│  ┌──                                                                                               │
│  │ ObjectID: 0x123...abc (Package)                                                                 │
│  │ Sender: 0x456...def                                                                             │
│  │ Owner: Immutable                                                                                 │
│  │ ObjectType: 0x2::package::Package                                                               │
│  └──                                                                                               │
│  ┌──                                                                                               │
│  │ ObjectID: 0x789...ghi (AdminCap)                                                                │
│  │ Sender: 0x456...def                                                                             │
│  │ Owner: Account Address ( 0x456...def )                                                          │
│  │ ObjectType: 0x123...abc::medical_records::AdminCap                                              │
│  └──                                                                                               │
│  ┌──                                                                                               │
│  │ ObjectID: 0xabc...123 (HospitalRegistry)                                                        │
│  │ Sender: 0x456...def                                                                             │
│  │ Owner: Shared                                                                                    │
│  │ ObjectType: 0x123...abc::medical_records::HospitalRegistry                                      │
│  └──                                                                                               │
│  ┌──                                                                                               │
│  │ ObjectID: 0xdef...456 (MedicalRecordRegistry)                                                   │
│  │ Sender: 0x456...def                                                                             │
│  │ Owner: Shared                                                                                    │
│  │ ObjectType: 0x123...abc::medical_records::MedicalRecordRegistry                                 │
│  └──                                                                                               │
╰─────────────────────────────────────────────────────────────────────────────────────────────────╯
```

### Step 3: Update Environment Variables

Copy the Object IDs to your `.env.local` file:

```bash
# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=devnet
NEXT_PUBLIC_PACKAGE_ID=0x123...abc

# Contract Object IDs
NEXT_PUBLIC_ADMIN_CAP_ID=0x789...ghi
NEXT_PUBLIC_HOSPITAL_REGISTRY_ID=0xabc...123
NEXT_PUBLIC_RECORD_REGISTRY_ID=0xdef...456

# IPFS Configuration
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_IPFS_API=https://api.pinata.cloud

# Encryption Key (generate a secure key)
NEXT_PUBLIC_ENCRYPTION_KEY=your-secure-encryption-key-here
```

### Step 4: Verify Deployment

```bash
# Run the verification script
npm run verify-deployment
```

Or manually verify using TypeScript:

```typescript
import { ContractDeploymentHelper } from "./scripts/deployment-utils";

const helper = new ContractDeploymentHelper("devnet");
const result = await helper.verifyDeployment(
  "YOUR_PACKAGE_ID",
  "YOUR_ADMIN_ADDRESS"
);
console.log(result);
```

### Step 5: Test the Application

1. **Restart the development server**

   ```bash
   npm run dev
   ```

2. **Test each role:**
   - **Admin**: Register hospitals
   - **Hospital**: Issue medical records
   - **Patient**: View records

## Network Deployment

### Devnet (Recommended for Testing)

```bash
./scripts/deploy.sh devnet
```

### Testnet (Pre-production Testing)

```bash
./scripts/deploy.sh testnet
```

### Mainnet (Production)

```bash
./scripts/deploy.sh mainnet
```

## Troubleshooting

### Common Issues

1. **Insufficient Gas**

   ```bash
   # Get more gas tokens
   sui client faucet
   ```

2. **Build Errors**

   ```bash
   cd contracts
   sui move build --verbose
   ```

3. **Network Connection Issues**

   ```bash
   # Check network status
   sui client envs

   # Switch network
   sui client switch --env devnet
   ```

4. **Object Not Found**
   - Verify object IDs in `.env.local`
   - Check if objects are on the correct network
   - Ensure shared objects are properly deployed

### Verification Commands

```bash
# Check your address and balance
sui client active-address
sui client gas

# List owned objects
sui client objects

# Get object info
sui client object <OBJECT_ID>

# Check package functions
sui client package <PACKAGE_ID>
```

## Deployment Checklist

- [ ] Sui CLI installed and configured
- [ ] Wallet has sufficient gas tokens
- [ ] Smart contracts build successfully
- [ ] Deployment completed without errors
- [ ] Object IDs copied to `.env.local`
- [ ] Environment variables updated
- [ ] Application restarts successfully
- [ ] Admin can register hospitals
- [ ] Hospital can issue records
- [ ] Patient can view records

## Security Notes

1. **Admin Capabilities**: The AdminCap object gives full control over hospital registration. Keep it secure.

2. **Environment Variables**: Never commit real object IDs to version control.

3. **Gas Management**: Monitor gas usage in production deployments.

4. **Network Selection**: Use devnet for development, testnet for staging, mainnet for production.

## Support

For deployment issues:

1. Check the [Sui Documentation](https://docs.sui.io)
2. Verify your Move code syntax
3. Ensure network connectivity
4. Check gas balance and permissions
