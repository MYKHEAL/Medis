# Medis dApp Demo Guide

This guide will help you properly demonstrate the Medis decentralized medical records system, ensuring the correct role-based access control flow works as intended.

## System Architecture Overview

The Medis dApp implements a strict role-based access control system:

1. **Admin** - Can register hospitals
2. **Hospital** - Can issue medical records to patients
3. **Patient** - Can view their medical records

Each role has a dedicated dashboard with specific functionalities.

## Prerequisites for Demo

1. Sui Wallets (preferably Sui Wallet or Suiet Wallet)
2. Testnet SUI tokens for gas fees (get from Sui Discord faucet)
3. Environment variables properly configured (see .env.example)

## Demo Flow

### Step 1: Admin Registration and Hospital Setup

1. Connect with the hardcoded admin wallet:

   - Address: `0x1752472acb1d642828805f8276710ce57b82c471a429f8af1a889d487f5cf29e`
   - This address automatically gets admin privileges

2. Navigate to the Admin Dashboard (`/admin`)

3. Register a hospital:
   - Fill in hospital name and wallet address
   - Click "Register Hospital"
   - Confirm transaction in wallet
   - Success message should appear

### Step 2: Hospital Access

1. Disconnect the admin wallet
2. Connect with the registered hospital wallet
3. The system should automatically detect the hospital role
4. User will be redirected to Hospital Dashboard (`/hospital`)
5. If not redirected automatically, manually navigate to `/hospital`

### Step 3: Issuing Medical Records

1. In the Hospital Dashboard:
   - Enter patient wallet address
   - Add record description
   - Upload a medical file
   - Click "Issue Medical Record"
   - Confirm transaction in wallet

### Step 4: Patient Access

1. Disconnect the hospital wallet
2. Connect with the patient wallet (address used in Step 3)
3. The system should automatically detect the patient role (based on owning medical records)
4. User will be redirected to Patient Dashboard (`/patient`)
5. Patient can view and download their medical records

## Troubleshooting Common Issues

### Issue: Hospital Registration Fails

**Solutions:**

1. Check network connection - ensure stable internet
2. Verify hospital address format (must be valid Sui address starting with 0x)
3. Ensure you're using the correct admin wallet
4. Check environment variables are properly set

### Issue: Registered Hospital Redirects to Patient Dashboard

**Solutions:**

1. Refresh the page - role detection may need a retry
2. Check browser console for errors (F12)
3. Verify the hospital registry ID in environment variables
4. Ensure the hospital was successfully registered (check admin dashboard)

### Issue: Slush Account Connection Problems

**Solutions:**

1. Ensure you're using a supported Sui wallet
2. Check that the wallet is connected to Sui Testnet
3. Verify the wallet has sufficient SUI for gas fees
4. Try disconnecting and reconnecting the wallet

## Environment Variables Required

Create a `.env.local` file with these variables:

```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=your_package_id
NEXT_PUBLIC_HOSPITAL_REGISTRY_ID=your_hospital_registry_id
NEXT_PUBLIC_RECORD_REGISTRY_ID=your_record_registry_id
NEXT_PUBLIC_ADMIN_CAP_ID=your_admin_cap_id
```

## Key Features Demonstrated

1. **Role-based Access Control** - Users automatically directed to appropriate dashboards
2. **Hospital Registration** - Only admins can register new hospitals
3. **Medical Record Issuance** - Hospitals can issue encrypted records to patients
4. **Patient Record Access** - Patients can view all their medical records in one place
5. **Blockchain Security** - All operations are secured and recorded on the Sui blockchain

## Best Practices for Demo

1. Prepare multiple wallet addresses in advance
2. Have testnet SUI tokens ready in each wallet
3. Test the flow beforehand to ensure environment is properly configured
4. Show the browser console during demo to illustrate system checks
5. Explain the security benefits of the decentralized approach

## Technical Notes

- Role detection uses smart contract calls to verify permissions
- All medical records are stored on IPFS with encryption
- The system implements retry mechanisms for network resilience
- Auto-redirection has a slight delay to allow users to see their role information
