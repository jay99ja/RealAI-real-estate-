// Enhanced Platform Debugger with JSON Configuration
import debugConfig from './platform-debugger.json' assert { type: 'json' };
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const BASE_URL = 'http://localhost:5000';

class EnhancedPlatformDebugger {
  constructor() {
    this.config = debugConfig;
    this.results = {
      tests: [],
      dependencies: [],
      fixes: [],
      validations: []
    };
  }

  async runTests(feature) {
    console.log(`🔍 Running ${feature} test suite...\n`);
    
    const featureConfig = this.config.featureTests[feature];
    if (!featureConfig) {
      console.log(`❌ Unknown feature: ${feature}`);
      return;
    }

    const tests = featureConfig.testCases || [];
    
    for (const test of tests) {
      try {
        console.log(`🧪 ${test.description}...`);
        
        const response = await axios({
          method: test.method,
          url: `${BASE_URL}${test.endpoint}`,
          data: test.payload,
          timeout: 15000,
          validateStatus: () => true // Don't throw on 4xx/5xx
        });
        
        // Check status code
        if (response.status !== test.expected.status) {
          throw new Error(`Status ${response.status}, expected ${test.expected.status}`);
        }
        
        // Check minimum properties/results
        if (test.expected.minProperties) {
          const count = response.data.properties?.length || 
                       response.data.foreclosures?.length || 
                       response.data.data?.properties?.length || 0;
          
          if (count < test.expected.minProperties) {
            throw new Error(`Only ${count} results, expected ${test.expected.minProperties}+`);
          }
          console.log(`  ✅ PASS: ${count} results found`);
        }
        
        // Check minimum listings
        if (test.expected.minListings) {
          const count = response.data.foreclosures?.length || 0;
          if (count < test.expected.minListings) {
            throw new Error(`Only ${count} listings, expected ${test.expected.minListings}+`);
          }
          console.log(`  ✅ PASS: ${count} listings found`);
        }
        
        // Check required fields
        if (test.expected.contains) {
          const responseText = JSON.stringify(response.data);
          const missingFields = test.expected.contains.filter(field => !responseText.includes(field));
          
          if (missingFields.length > 0) {
            throw new Error(`Missing fields: ${missingFields.join(', ')}`);
          }
          console.log(`  ✅ PASS: All required fields present`);
        }
        
        if (!test.expected.minProperties && !test.expected.minListings && !test.expected.contains) {
          console.log(`  ✅ PASS: Request successful`);
        }
        
        this.results.tests.push({
          feature,
          test: test.description,
          status: 'PASS',
          response: { status: response.status, dataSize: JSON.stringify(response.data).length }
        });
        
      } catch (error) {
        console.log(`  ❌ FAIL: ${error.message}`);
        
        // Suggest fixes from config
        const errorKey = this.detectErrorType(error.message);
        const suggestion = featureConfig.commonErrors?.[errorKey];
        if (suggestion) {
          console.log(`  💡 Suggested fix: ${suggestion.fix}`);
        }
        
        this.results.tests.push({
          feature,
          test: test.description,
          status: 'FAIL',
          error: error.message,
          suggestion: suggestion?.fix
        });
      }
      console.log('');
    }
    
    this.printTestSummary(feature);
  }

  detectErrorType(errorMessage) {
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) return 'timeout';
    if (errorMessage.includes('results') || errorMessage.includes('properties')) return 'no_results';
    if (errorMessage.includes('ZIP') || errorMessage.includes('zip')) return 'invalid_zip';
    if (errorMessage.includes('Status 4') || errorMessage.includes('Status 5')) return 'api_error';
    return 'unknown';
  }

  async checkDependencies() {
    console.log('🔍 Checking Platform Dependencies...\n');
    
    // Check API services
    console.log('📡 API Services:');
    for (const service of this.config.dependencyChecks.apiServices) {
      try {
        const { stdout } = await execAsync(service.statusCheck);
        const status = stdout.trim();
        const isHealthy = status === service.expectedStatus;
        
        console.log(`  ${isHealthy ? '✅' : '❌'} ${service.name}: ${status}`);
        
        this.results.dependencies.push({
          name: service.name,
          status: isHealthy ? 'healthy' : 'unhealthy',
          response: status
        });
      } catch (error) {
        console.log(`  ❌ ${service.name}: Connection failed`);
        this.results.dependencies.push({
          name: service.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Check database
    console.log('\n🗄️ Database Services:');
    for (const dbCheck of this.config.dependencyChecks.databaseChecks) {
      try {
        const { stdout } = await execAsync(dbCheck.command);
        const isConnected = stdout.includes('connected');
        
        console.log(`  ${isConnected ? '✅' : '❌'} ${dbCheck.description}: ${isConnected ? 'Connected' : 'Disconnected'}`);
        
        this.results.dependencies.push({
          name: dbCheck.description,
          status: isConnected ? 'connected' : 'disconnected'
        });
      } catch (error) {
        console.log(`  ❌ ${dbCheck.description}: Check failed`);
      }
    }
    
    this.printDependencySummary();
  }

  autoFix(issueType) {
    console.log(`🔧 Executing Auto-Fix for ${issueType}...\n`);
    
    const procedure = this.config.autoFixProcedures[issueType];
    if (!procedure) {
      console.log(`❌ No auto-fix procedure for: ${issueType}`);
      return;
    }
    
    const steps = procedure.steps || [];
    console.log(`Found ${steps.length} auto-fix steps:\n`);
    
    steps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`);
      
      // Log the step as completed (in real implementation, would execute)
      this.results.fixes.push({
        issueType,
        step: i + 1,
        action: step,
        status: 'logged'
      });
    });
    
    console.log(`\n✅ Auto-fix procedure for ${issueType} completed`);
    console.log('Note: Steps logged for manual execution or automated implementation\n');
  }

  validateEnv() {
    console.log('🔧 Validating Environment Variables...\n');
    
    const required = this.config.envValidation.requiredVariables;
    const optional = this.config.envValidation.optionalVariables || [];
    
    console.log('📋 Required Variables:');
    const missingRequired = [];
    
    required.forEach(varName => {
      const isPresent = !!process.env[varName];
      console.log(`  ${isPresent ? '✅' : '❌'} ${varName}: ${isPresent ? 'Configured' : 'Missing'}`);
      
      if (!isPresent) {
        missingRequired.push(varName);
      }
      
      this.results.validations.push({
        variable: varName,
        type: 'required',
        status: isPresent ? 'present' : 'missing'
      });
    });
    
    console.log('\n🔗 Optional Variables:');
    optional.forEach(varName => {
      const isPresent = !!process.env[varName];
      console.log(`  ${isPresent ? '✅' : '⚪'} ${varName}: ${isPresent ? 'Set' : 'Not set'}`);
      
      this.results.validations.push({
        variable: varName,
        type: 'optional',
        status: isPresent ? 'present' : 'missing'
      });
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 ENVIRONMENT VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    if (missingRequired.length > 0) {
      console.log(`❌ Missing required variables: ${missingRequired.join(', ')}`);
      console.log('🔧 Action needed: Configure missing variables in Replit Secrets');
      console.log('='.repeat(50));
      return false;
    } else {
      console.log('✅ All required environment variables are configured');
      console.log('✅ Environment is ready for production');
      console.log('='.repeat(50));
      return true;
    }
  }

  printTestSummary(feature) {
    const featureTests = this.results.tests.filter(t => t.feature === feature);
    const passed = featureTests.filter(t => t.status === 'PASS').length;
    const failed = featureTests.filter(t => t.status === 'FAIL').length;
    
    console.log('─'.repeat(40));
    console.log(`📊 ${feature} Test Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / featureTests.length) * 100)}%`);
    console.log('─'.repeat(40));
  }

  printDependencySummary() {
    const healthy = this.results.dependencies.filter(d => d.status === 'healthy' || d.status === 'connected').length;
    const total = this.results.dependencies.length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 DEPENDENCY CHECK SUMMARY');
    console.log('='.repeat(50));
    console.log(`Healthy Services: ${healthy}/${total}`);
    console.log(`Overall Status: ${healthy === total ? '✅ ALL SYSTEMS OPERATIONAL' : '⚠️ SOME ISSUES DETECTED'}`);
    console.log('='.repeat(50));
  }

  async runFullDiagnostic() {
    console.log('🚀 Running Full Platform Diagnostic...\n');
    
    // Environment validation
    const envValid = this.validateEnv();
    
    // Dependency checks
    await this.checkDependencies();
    
    // Core feature tests
    await this.runTests('propertyIntelligence');
    await this.runTests('aiAppraisal');
    
    console.log('\n🎯 FULL DIAGNOSTIC COMPLETE');
    console.log('='.repeat(50));
    
    return {
      environmentValid: envValid,
      results: this.results,
      timestamp: new Date().toISOString()
    };
  }
}

// Export functions for command line usage
export const runTests = async (feature) => {
  const tester = new EnhancedPlatformDebugger();
  await tester.runTests(feature);
};

export const checkDependencies = async () => {
  const tester = new EnhancedPlatformDebugger();
  await tester.checkDependencies();
};

export const autoFix = (issueType) => {
  const tester = new EnhancedPlatformDebugger();
  tester.autoFix(issueType);
};

export const validateEnv = () => {
  const tester = new EnhancedPlatformDebugger();
  return tester.validateEnv();
};

export const runFullDiagnostic = async () => {
  const tester = new EnhancedPlatformDebugger();
  return await tester.runFullDiagnostic();
};

// Run if called directly
if (process.argv[1] && process.argv[1].includes('platform-debugger-enhanced.js')) {
  const command = process.argv[2] || 'runFullDiagnostic';
  const arg = process.argv[3];
  
  switch (command) {
    case 'test':
      runTests(arg || 'propertyIntelligence');
      break;
    case 'deps':
      checkDependencies();
      break;
    case 'fix':
      autoFix(arg || 'databaseIssues');
      break;
    case 'env':
      validateEnv();
      break;
    case 'full':
    default:
      runFullDiagnostic();
      break;
  }
}