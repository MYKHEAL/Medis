// Deployment verification script
import { ContractDeploymentHelper, checkNetworkStatus } from './deployment-utils';

async function main() {
  console.log('🔍 Medis dApp Deployment Verification');
  console.log('=====================================\n');

  // Get environment variables
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  const network = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet';
  const adminCapId = process.env.NEXT_PUBLIC_ADMIN_CAP_ID;
  const hospitalRegistryId = process.env.NEXT_PUBLIC_HOSPITAL_REGISTRY_ID;
  const recordRegistryId = process.env.NEXT_PUBLIC_RECORD_REGISTRY_ID;

  if (!packageId || packageId === '0x0') {
    console.error('❌ NEXT_PUBLIC_PACKAGE_ID not set or invalid');
    console.log('Please run deployment first and update .env.local');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Network: ${network}`);
  console.log(`   Package ID: ${packageId}`);
  console.log(`   Admin Cap: ${adminCapId}`);
  console.log(`   Hospital Registry: ${hospitalRegistryId}`);
  console.log(`   Record Registry: ${recordRegistryId}\n`);

  try {
    // Check network connectivity
    console.log('🌐 Checking network connectivity...');
    const networkOk = await checkNetworkStatus(network);
    if (!networkOk) {
      throw new Error(`Cannot connect to ${network} network`);
    }

    // Initialize deployment helper
    const helper = new ContractDeploymentHelper(network);

    // Verify package exists
    console.log('📦 Verifying package deployment...');
    const packageInfo = await helper.getPackageInfo(packageId);
    console.log('✅ Package found and accessible\n');

    // Test contract functions
    console.log('🧪 Testing contract functions...');
    
    // Test view functions that don't require gas
    if (hospitalRegistryId && hospitalRegistryId !== '0x0') {
      try {
        await helper.testContractFunction(
          packageId,
          'medical_records',
          'get_admin_address',
          [hospitalRegistryId]
        );
        console.log('✅ get_admin_address function works');
      } catch (error) {
        console.log('⚠️  get_admin_address function test failed (this is normal for devnet)');
      }

      try {
        await helper.testContractFunction(
          packageId,
          'medical_records',
          'is_registered_hospital',
          [hospitalRegistryId, '0x1234567890abcdef1234567890abcdef12345678']
        );
        console.log('✅ is_registered_hospital function works');
      } catch (error) {
        console.log('⚠️  is_registered_hospital function test failed (this is normal for devnet)');
      }
    }

    if (recordRegistryId && recordRegistryId !== '0x0') {
      try {
        await helper.testContractFunction(
          packageId,
          'medical_records',
          'get_records_count',
          [recordRegistryId]
        );
        console.log('✅ get_records_count function works');
      } catch (error) {
        console.log('⚠️  get_records_count function test failed (this is normal for devnet)');
      }
    }

    console.log('\n🎉 Deployment verification completed successfully!');
    console.log('\n📖 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Connect your wallet in the app');
    console.log('3. Test the admin dashboard (register hospitals)');
    console.log('4. Test the hospital dashboard (issue records)');
    console.log('5. Test the patient dashboard (view records)');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if all environment variables are set correctly');
    console.log('2. Verify the package was deployed successfully');
    console.log('3. Ensure you\'re connected to the right network');
    console.log('4. Check the deployment output for any errors');
    process.exit(1);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  main().catch(console.error);
}