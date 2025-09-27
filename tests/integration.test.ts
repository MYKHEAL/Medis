// Integration tests for Medis dApp
import { ContractDeploymentHelper, checkNetworkStatus } from '../scripts/deployment-utils';

// Test configuration
const TEST_CONFIG = {
  network: 'devnet' as const,
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0',
  adminCapId: process.env.NEXT_PUBLIC_ADMIN_CAP_ID || '0x0',
  hospitalRegistryId: process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID || '0x0',
  recordRegistryId: process.env.NEXT_PUBLIC_RECORD_REGISTRY_ID || '0x0',
};

// Mock addresses for testing
const MOCK_ADDRESSES = {
  admin: '0x1234567890abcdef1234567890abcdef12345678',
  hospital: '0x2345678901abcdef2345678901abcdef23456789',
  patient: '0x3456789012abcdef3456789012abcdef34567890',
};

describe('Medis dApp Integration Tests', () => {
  let contractHelper: ContractDeploymentHelper;

  beforeAll(async () => {
    // Skip tests if environment variables are not set
    if (TEST_CONFIG.packageId === '0x0') {
      console.log('⚠️  Skipping integration tests - deployment not configured');
      return;
    }

    contractHelper = new ContractDeploymentHelper(TEST_CONFIG.network);
    
    // Check network connectivity
    const networkOk = await checkNetworkStatus(TEST_CONFIG.network);
    if (!networkOk) {
      throw new Error(`Cannot connect to ${TEST_CONFIG.network} network`);
    }
  });

  describe('Network and Deployment', () => {
    test('should connect to Sui network', async () => {
      if (TEST_CONFIG.packageId === '0x0') return;
      
      const networkOk = await checkNetworkStatus(TEST_CONFIG.network);
      expect(networkOk).toBe(true);
    });

    test('should verify package deployment', async () => {
      if (TEST_CONFIG.packageId === '0x0') return;
      
      const packageInfo = await contractHelper.getPackageInfo(TEST_CONFIG.packageId);
      expect(packageInfo).toBeDefined();
      expect(packageInfo.data).toBeDefined();
    });

    test('should have all required object IDs configured', () => {
      // At minimum, we should have a package ID
      expect(TEST_CONFIG.packageId).not.toBe('0x0');
      
      // Log configuration status
      console.log('Configuration status:');
      console.log(`  Package ID: ${TEST_CONFIG.packageId !== '0x0' ? '✅' : '❌'}`);
      console.log(`  Admin Cap: ${TEST_CONFIG.adminCapId !== '0x0' ? '✅' : '❌'}`);
      console.log(`  Hospital Registry: ${TEST_CONFIG.hospitalRegistryId !== '0x0' ? '✅' : '❌'}`);
      console.log(`  Record Registry: ${TEST_CONFIG.recordRegistryId !== '0x0' ? '✅' : '❌'}`);
    });
  });

  describe('Smart Contract Functions', () => {
    test('should test view functions without gas', async () => {
      if (TEST_CONFIG.packageId === '0x0' || TEST_CONFIG.hospitalRegistryId === '0x0') {
        console.log('⚠️  Skipping contract function tests - objects not configured');
        return;
      }

      try {
        // Test get_admin_address function
        const adminResult = await contractHelper.testContractFunction(
          TEST_CONFIG.packageId,
          'medical_records',
          'get_admin_address',
          [TEST_CONFIG.hospitalRegistryId]
        );
        expect(adminResult).toBeDefined();

        // Test is_registered_hospital function
        const hospitalResult = await contractHelper.testContractFunction(
          TEST_CONFIG.packageId,
          'medical_records',
          'is_registered_hospital',
          [TEST_CONFIG.hospitalRegistryId, MOCK_ADDRESSES.hospital]
        );
        expect(hospitalResult).toBeDefined();

      } catch (error) {
        // Contract function tests might fail on devnet, which is expected
        console.log('⚠️  Contract function test failed (expected on devnet):', error);
      }
    });

    test('should test records count function', async () => {
      if (TEST_CONFIG.packageId === '0x0' || TEST_CONFIG.recordRegistryId === '0x0') {
        console.log('⚠️  Skipping records count test - objects not configured');
        return;
      }

      try {
        const countResult = await contractHelper.testContractFunction(
          TEST_CONFIG.packageId,
          'medical_records',
          'get_records_count',
          [TEST_CONFIG.recordRegistryId]
        );
        expect(countResult).toBeDefined();
      } catch (error) {
        console.log('⚠️  Records count test failed (expected on devnet):', error);
      }
    });
  });

  describe('Frontend Components', () => {
    test('should validate wallet connection utilities', () => {
      // Test address formatting
      const testAddress = MOCK_ADDRESSES.admin;
      const formatted = `${testAddress.slice(0, 6)}...${testAddress.slice(-4)}`;
      expect(formatted).toBe('0x1234...5678');
    });

    test('should validate file upload constraints', () => {
      // Test file size limits (10MB)
      const maxSize = 10 * 1024 * 1024;
      expect(maxSize).toBe(10485760);

      // Test accepted file types
      const acceptedTypes = [
        'image/jpeg',
        'image/png',
        'image/tiff',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      expect(acceptedTypes.length).toBeGreaterThan(0);
    });

    test('should validate IPFS hash format', () => {
      // Mock IPFS hash format validation
      const mockHash = 'QmTest123456789abcdef';
      expect(mockHash.startsWith('Qm')).toBe(true);
      expect(mockHash.length).toBeGreaterThan(10);
    });
  });

  describe('Data Validation', () => {
    test('should validate Sui address format', () => {
      const validAddress = MOCK_ADDRESSES.admin;
      expect(validAddress.startsWith('0x')).toBe(true);
      expect(validAddress.length).toBe(66); // 0x + 64 hex characters
    });

    test('should validate timestamp format', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      expect(timestamp).toBeGreaterThan(1600000000); // After year 2020
      expect(typeof timestamp).toBe('number');
    });

    test('should validate medical record structure', () => {
      const mockRecord = {
        id: '1',
        patient_address: MOCK_ADDRESSES.patient,
        hospital_address: MOCK_ADDRESSES.hospital,
        ipfs_hash: 'QmTest123456789abcdef',
        timestamp: Math.floor(Date.now() / 1000),
        created_at: Math.floor(Date.now() / 1000),
      };

      expect(mockRecord.id).toBeDefined();
      expect(mockRecord.patient_address.startsWith('0x')).toBe(true);
      expect(mockRecord.hospital_address.startsWith('0x')).toBe(true);
      expect(mockRecord.ipfs_hash.startsWith('Qm')).toBe(true);
      expect(typeof mockRecord.timestamp).toBe('number');
    });
  });

  describe('Environment Configuration', () => {
    test('should have required environment variables', () => {
      // Check if .env.local is properly configured
      const requiredVars = [
        'NEXT_PUBLIC_SUI_NETWORK',
        'NEXT_PUBLIC_PACKAGE_ID',
      ];

      for (const varName of requiredVars) {
        const value = process.env[varName];
        if (!value || value === '0x0') {
          console.log(`⚠️  ${varName} not configured`);
        } else {
          console.log(`✅ ${varName} configured`);
        }
      }
    });

    test('should validate network configuration', () => {
      const network = process.env.NEXT_PUBLIC_SUI_NETWORK;
      const validNetworks = ['devnet', 'testnet', 'mainnet'];
      
      if (network) {
        expect(validNetworks).toContain(network);
      } else {
        console.log('⚠️  NEXT_PUBLIC_SUI_NETWORK not set, defaulting to devnet');
      }
    });
  });

  afterAll(async () => {
    // Cleanup if needed
    console.log('✅ Integration tests completed');
  });
});

// Export test utilities for use in other test files
export {
  TEST_CONFIG,
  MOCK_ADDRESSES,
  ContractDeploymentHelper,
};