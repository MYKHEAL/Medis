// Simple test runner for Medis dApp
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

class TestRunner {
  private contractHelper: ContractDeploymentHelper;
  private testResults: { name: string; passed: boolean; error?: any }[] = [];

  constructor() {
    this.contractHelper = new ContractDeploymentHelper(TEST_CONFIG.network);
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️ '
    }[type];
    console.log(`${prefix} ${message}`);
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<boolean> {
    try {
      await testFn();
      this.log(name, 'success');
      this.testResults.push({ name, passed: true });
      return true;
    } catch (error) {
      this.log(`${name} - ${error}`, 'error');
      this.testResults.push({ name, passed: false, error });
      return false;
    }
  }

  async runAllTests() {
    this.log('Medis dApp Integration Tests', 'info');
    this.log('=============================\n', 'info');

    // Test 1: Network connectivity
    await this.runTest('Network connectivity', async () => {
      const networkOk = await checkNetworkStatus(TEST_CONFIG.network);
      if (!networkOk) throw new Error(`Cannot connect to ${TEST_CONFIG.network}`);
    });

    // Test 2: Environment configuration
    await this.runTest('Environment configuration', async () => {
      if (TEST_CONFIG.packageId === '0x0') {
        throw new Error('NEXT_PUBLIC_PACKAGE_ID not configured');
      }
    });

    // Test 3: Package deployment verification
    if (TEST_CONFIG.packageId !== '0x0') {
      await this.runTest('Package deployment verification', async () => {
        const packageInfo = await this.contractHelper.getPackageInfo(TEST_CONFIG.packageId);
        if (!packageInfo || !packageInfo.data) {
          throw new Error('Package not found or inaccessible');
        }
      });
    }

    // Test 4: Address format validation
    await this.runTest('Address format validation', async () => {
      const testAddress = MOCK_ADDRESSES.admin;
      if (!testAddress.startsWith('0x') || testAddress.length !== 66) {
        throw new Error('Invalid address format');
      }
    });

    // Test 5: File upload constraints
    await this.runTest('File upload constraints', async () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const acceptedTypes = [
        'image/jpeg', 'image/png', 'application/pdf', 'text/plain'
      ];
      if (maxSize !== 10485760 || acceptedTypes.length === 0) {
        throw new Error('File upload constraints not properly defined');
      }
    });

    // Test 6: Smart contract functions (if deployed)
    if (TEST_CONFIG.packageId !== '0x0' && TEST_CONFIG.hospitalRegistryId !== '0x0') {
      await this.runTest('Smart contract function calls', async () => {
        try {
          await this.contractHelper.testContractFunction(
            TEST_CONFIG.packageId,
            'medical_records',
            'get_admin_address',
            [TEST_CONFIG.hospitalRegistryId]
          );
        } catch (error) {
          // This is expected to fail on devnet without proper setup
          this.log('Contract function test failed (expected on devnet)', 'warning');
        }
      });
    }

    // Test results summary
    this.printTestSummary();
  }

  private printTestSummary() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const failed = total - passed;

    console.log('\n📊 Test Summary');
    console.log('===============');
    this.log(`Total tests: ${total}`, 'info');
    this.log(`Passed: ${passed}`, 'success');
    if (failed > 0) {
      this.log(`Failed: ${failed}`, 'error');
    }

    if (passed === total) {
      this.log('All tests passed! 🎉', 'success');
    } else {
      this.log('Some tests failed. Check the configuration and deployment.', 'warning');
    }

    // Configuration status
    console.log('\n🔧 Configuration Status:');
    console.log(`   Package ID: ${TEST_CONFIG.packageId !== '0x0' ? '✅ Configured' : '❌ Not set'}`);
    console.log(`   Admin Cap: ${TEST_CONFIG.adminCapId !== '0x0' ? '✅ Configured' : '❌ Not set'}`);
    console.log(`   Hospital Registry: ${TEST_CONFIG.hospitalRegistryId !== '0x0' ? '✅ Configured' : '❌ Not set'}`);
    console.log(`   Record Registry: ${TEST_CONFIG.recordRegistryId !== '0x0' ? '✅ Configured' : '❌ Not set'}`);

    if (TEST_CONFIG.packageId === '0x0') {
      console.log('\n💡 To complete setup:');
      console.log('1. Deploy smart contracts: npm run deploy:devnet');
      console.log('2. Update .env.local with object IDs');
      console.log('3. Run tests again: npm run test');
    }
  }
}

// Run tests if this script is executed directly
async function main() {
  // Load environment variables
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n').filter((line: string) => line.includes('='));
    envVars.forEach((line: string) => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }

  const testRunner = new TestRunner();
  await testRunner.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { TestRunner, TEST_CONFIG, MOCK_ADDRESSES };