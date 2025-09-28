# Medis dApp Contract Deployment Guide

This guide explains how to properly deploy and set up the Medis dApp contracts on the Sui network.

## Prerequisites

1. Sui CLI installed
2. Sui wallet with sufficient SUI tokens for gas fees
3. Environment set up for Sui development

## Deployment Steps

### 1. Publish the Contract

```bash
sui client publish --gas-budget 100000000
```

This will deploy the contract and return several important object IDs that need to be saved.

### 2. Extract Important Object IDs

After deployment, you'll receive output containing object IDs. Save these in your environment variables:

- Package ID
- HospitalRegistry ID
- MedicalRecordRegistry ID
- AdminCap ID

### 3. Set Environment Variables

Create a `.env.local` file in your frontend directory with these values:

```env
NEXT_PUBLIC_PACKAGE_ID=your_package_id_here
NEXT_PUBLIC_HOSPITAL_REGISTRY_ID=your_hospital_registry_id_here
NEXT_PUBLIC_RECORD_REGISTRY_ID=your_record_registry_id_here
NEXT_PUBLIC_ADMIN_CAP_ID=your_admin_cap_id_here
NEXT_PUBLIC_SUI_NETWORK=testnet
```

## Contract Functions

### Admin Functions

1. `register_hospital` - Register a new hospital (admin only)
2. `create_admin` - Create admin capability (initial setup only)

### Hospital Functions

1. `issue_record` - Issue medical records to patients (registered hospitals only)

### Public View Functions

1. `is_registered_hospital` - Check if an address is a registered hospital
2. `get_hospital_info` - Get hospital information
3. `get_record_details` - Get medical record details
4. `get_records_count` - Get total records count
5. `get_admin_address` - Get admin address from registry

## Testing

Run the contract tests to verify everything works correctly:

```bash
sui move test
```

## Common Issues and Solutions

### Issue: "Admin privileges required" error

**Solution**: Ensure you're using the correct admin wallet that owns the AdminCap object.

### Issue: "Hospital already registered" error

**Solution**: The hospital address is already in the registry. Use a different wallet address for registration.

### Issue: "Not registered hospital" error

**Solution**: The hospital hasn't been registered by the admin yet. Register the hospital first.

## Contract Architecture

The Medis dApp contract implements a role-based access control system:

1. **Admin Role**: Can register hospitals
2. **Hospital Role**: Can issue medical records to patients
3. **Patient Role**: Can receive and view medical records

### Objects

1. `AdminCap` - Singleton object that grants admin privileges
2. `HospitalRegistry` - Shared object containing all registered hospitals
3. `MedicalRecordRegistry` - Shared object tracking issued records
4. `MedicalRecord` - Individual medical record objects owned by patients

### Error Codes

- `ENotAdmin = 1` - Operation requires admin privileges
- `ENotRegisteredHospital = 2` - Operation requires hospital registration
- `EHospitalAlreadyRegistered = 3` - Hospital is already registered
- `EAdminAlreadyExists = 4` - Admin already exists (unused in current implementation)

## Security Considerations

1. Only one AdminCap exists per deployment
2. Hospital registration can only be done by the admin
3. Medical records can only be issued by registered hospitals
4. All operations are recorded on-chain with events
5. Patient data is stored as IPFS hashes, not directly on-chain

## Upgrade Considerations

The current contract implementation is not upgradeable. For production deployment, consider:

1. Using upgradeable contract patterns
2. Implementing more granular permission controls
3. Adding expiration dates for hospital registrations
4. Implementing audit trails for all operations
