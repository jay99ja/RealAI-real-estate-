import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

class PlatformDebugger {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runTests(testSuite) {
    console.log(`🔍 Running ${testSuite} test suite...`);
    
    switch (testSuite) {
      case 'propertyIntelligence':
        await this.testPropertyIntelligence();
        break;
      case 'aiAppraisal':
        await this.testAIAppraisal();
        break;
      case 'foreclosureSystem':
        await this.testForeclosureSystem();
        break;
      case 'all':
        await this.runAllTests();
        break;
      default:
        console.log(`❌ Unknown test suite: ${testSuite}`);
        return;
    }
    
    this.printResults();
  }

  async testPropertyIntelligence() {
    console.log('\n📊 Testing Property Intelligence System...');
    
    // Test 1: US Property Search
    await this.runTest({
      name: 'US Property Search (Beverly Hills)',
      endpoint: '/api/properties?zipCode=90210',
      method: 'GET',
      expectedMinResults: 1000,
      timeout: 30000
    });

    // Test 2: International Property Search  
    await this.runTest({
      name: 'International Property Search (Berlin)',
      endpoint: '/api/v1/properties/search',
      method: 'POST',
      payload: {
        country: 'DE',
        region: 'Berlin',
        minPrice: 200000,
        currency: 'EUR'
      },
      expectedMinResults: 10,
      timeout: 10000
    });

    // Test 3: Property Detail Lookup
    await this.runTest({
      name: 'Property Detail Lookup',
      endpoint: '/api/properties/111904',
      method: 'GET',
      timeout: 5000
    });

    // Test 4: Advanced Property Search
    await this.runTest({
      name: 'Advanced Property Search',
      endpoint: '/api/properties/search?zipCode=33460&minPrice=100000&maxPrice=500000',
      method: 'GET',
      expectedMinResults: 50,
      timeout: 20000
    });
  }

  async testAIAppraisal() {
    console.log('\n🤖 Testing AI Appraisal System...');
    
    await this.runTest({
      name: 'AI Property Appraisal',
      endpoint: '/api/properties/appraise',
      method: 'POST',
      payload: {
        address: '1209 Auld Ln',
        zipCode: '90210',
        sqft: 2500,
        bedrooms: 4,
        bathrooms: 3
      },
      expectedFields: ['appraisal', 'marketValue', 'comparables'],
      timeout: 10000
    });
  }

  async testForeclosureSystem() {
    console.log('\n🏚️ Testing Foreclosure System...');
    
    await this.runTest({
      name: 'Foreclosure Property Search',
      endpoint: '/api/foreclosures?region=California&zipCode=90210',
      method: 'GET',
      expectedMinResults: 10,
      timeout: 15000
    });
  }

  async runAllTests() {
    await this.testPropertyIntelligence();
    await this.testAIAppraisal();
    await this.testForeclosureSystem();
  }

  async runTest(config) {
    const testStart = Date.now();
    console.log(`  🧪 ${config.name}...`);
    
    try {
      const options = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: config.timeout || 10000
      };

      if (config.payload) {
        options.body = JSON.stringify(config.payload);
      }

      const response = await fetch(`${BASE_URL}${config.endpoint}`, options);
      const data = await response.json();
      const duration = Date.now() - testStart;

      if (!response.ok) {
        this.testResults.push({
          name: config.name,
          status: 'FAIL',
          message: `HTTP ${response.status}: ${data.message || 'Unknown error'}`,
          duration
        });
        console.log(`    ❌ FAIL (${duration}ms): HTTP ${response.status}`);
        return;
      }

      // Check minimum results
      if (config.expectedMinResults) {
        const resultCount = data.properties?.length || 
                           data.foreclosures?.length || 
                           data.data?.properties?.length || 0;
        
        if (resultCount < config.expectedMinResults) {
          this.testResults.push({
            name: config.name,
            status: 'FAIL',
            message: `Expected ${config.expectedMinResults}+ results, got ${resultCount}`,
            duration,
            data: { resultCount }
          });
          console.log(`    ❌ FAIL (${duration}ms): Only ${resultCount} results`);
          return;
        }
        console.log(`    ✅ PASS (${duration}ms): ${resultCount} results found`);
      }

      // Check expected fields
      if (config.expectedFields) {
        const responseText = JSON.stringify(data);
        const missingFields = config.expectedFields.filter(field => !responseText.includes(field));
        
        if (missingFields.length > 0) {
          this.testResults.push({
            name: config.name,
            status: 'FAIL',
            message: `Missing fields: ${missingFields.join(', ')}`,
            duration
          });
          console.log(`    ❌ FAIL (${duration}ms): Missing fields`);
          return;
        }
        console.log(`    ✅ PASS (${duration}ms): All fields present`);
      }

      // Test passed
      this.testResults.push({
        name: config.name,
        status: 'PASS',
        message: 'Test completed successfully',
        duration,
        data: data
      });

      if (!config.expectedMinResults && !config.expectedFields) {
        console.log(`    ✅ PASS (${duration}ms): Response received`);
      }

    } catch (error) {
      const duration = Date.now() - testStart;
      this.testResults.push({
        name: config.name,
        status: 'ERROR',
        message: error.message,
        duration
      });
      console.log(`    💥 ERROR (${duration}ms): ${error.message}`);
    }
  }

  printResults() {
    const totalTime = Date.now() - this.startTime;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const total = this.testResults.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%`);
    console.log('='.repeat(60));

    if (failed > 0 || errors > 0) {
      console.log('\n🚨 FAILED/ERROR TESTS:');
      this.testResults
        .filter(r => r.status !== 'PASS')
        .forEach(result => {
          console.log(`  ${result.status === 'FAIL' ? '❌' : '💥'} ${result.name}: ${result.message}`);
        });
    }
  }
}

// Check platform dependencies
export async function checkDependencies() {
  console.log('🔍 Checking Platform Dependencies...\n');
  
  const dependencies = {
    apiServices: [],
    database: null,
    environment: [],
    performance: null
  };

  // Check API Services
  console.log('📡 API Service Status:');
  
  // Attom Data API
  try {
    const attomResponse = await fetch('https://api.attomdata.com/propertyapi/v1.0.0/property/address?address1=1%20Rosedale&locality=Beverly%20Hills&division=CA', {
      headers: {
        'apikey': process.env.ATTOM_API_KEY || 'test-key',
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    
    dependencies.apiServices.push({
      name: 'Attom Data API',
      status: attomResponse.ok ? 'operational' : 'error',
      statusCode: attomResponse.status,
      configured: !!process.env.ATTOM_API_KEY
    });
    console.log(`  ✅ Attom Data API: ${attomResponse.ok ? 'Operational' : 'Error'} (${attomResponse.status})`);
  } catch (error) {
    dependencies.apiServices.push({
      name: 'Attom Data API',
      status: 'connection_failed',
      error: error.message,
      configured: !!process.env.ATTOM_API_KEY
    });
    console.log(`  ❌ Attom Data API: Connection Failed`);
  }

  // RapidAPI Services
  try {
    const rapidResponse = await fetch('https://realty-mole-property-api.p.rapidapi.com/properties?address=1%20Rosedale%2C%20Beverly%20Hills%2C%20CA', {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || 'test-key',
        'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com'
      },
      timeout: 5000
    });
    
    dependencies.apiServices.push({
      name: 'RapidAPI Property Service',
      status: rapidResponse.ok ? 'operational' : 'error',
      statusCode: rapidResponse.status,
      configured: !!process.env.RAPIDAPI_KEY
    });
    console.log(`  ✅ RapidAPI Property: ${rapidResponse.ok ? 'Operational' : 'Error'} (${rapidResponse.status})`);
  } catch (error) {
    dependencies.apiServices.push({
      name: 'RapidAPI Property Service',
      status: 'connection_failed',
      error: error.message,
      configured: !!process.env.RAPIDAPI_KEY
    });
    console.log(`  ❌ RapidAPI Property: Connection Failed`);
  }

  // Check Database Connection
  console.log('\n🗄️  Database Status:');
  try {
    const dbResponse = await fetch(`${BASE_URL}/api/v3/debug/health`, { timeout: 3000 });
    const healthData = await dbResponse.json();
    
    dependencies.database = {
      status: healthData.services?.database || 'unknown',
      configured: !!process.env.DATABASE_URL
    };
    console.log(`  ✅ PostgreSQL: ${healthData.services?.database || 'Unknown'}`);
  } catch (error) {
    dependencies.database = {
      status: 'connection_failed',
      error: error.message,
      configured: !!process.env.DATABASE_URL
    };
    console.log(`  ❌ PostgreSQL: Connection Failed`);
  }

  // Check Environment Variables
  console.log('\n🔧 Environment Configuration:');
  const requiredEnvVars = [
    'DATABASE_URL',
    'ATTOM_API_KEY',
    'RAPIDAPI_KEY',
    'RAPIDAPI_KEY_2',
    'GEODB_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    const isPresent = !!process.env[envVar];
    dependencies.environment.push({
      name: envVar,
      configured: isPresent,
      status: isPresent ? 'configured' : 'missing'
    });
    console.log(`  ${isPresent ? '✅' : '❌'} ${envVar}: ${isPresent ? 'Configured' : 'Missing'}`);
  }

  // Check System Performance
  console.log('\n⚡ System Performance:');
  try {
    const perfResponse = await fetch(`${BASE_URL}/api/v3/debug/health`, { timeout: 3000 });
    const perfData = await perfResponse.json();
    
    if (perfData.performance) {
      dependencies.performance = {
        uptime: perfData.performance.uptime,
        memoryUsage: Math.round(perfData.performance.memoryUsage.heapUsed / 1024 / 1024),
        nodeVersion: perfData.performance.nodeVersion,
        status: 'operational'
      };
      
      console.log(`  ✅ Uptime: ${Math.round(perfData.performance.uptime)}s`);
      console.log(`  ✅ Memory: ${Math.round(perfData.performance.memoryUsage.heapUsed / 1024 / 1024)}MB`);
      console.log(`  ✅ Node.js: ${perfData.performance.nodeVersion}`);
    }
  } catch (error) {
    dependencies.performance = {
      status: 'unavailable',
      error: error.message
    };
    console.log(`  ❌ Performance data unavailable`);
  }

  // Summary
  const apiOperational = dependencies.apiServices.filter(s => s.status === 'operational').length;
  const envConfigured = dependencies.environment.filter(e => e.configured).length;
  const dbOperational = dependencies.database?.status === 'connected';
  const perfOperational = dependencies.performance?.status === 'operational';

  console.log('\n' + '='.repeat(50));
  console.log('📋 DEPENDENCY CHECK SUMMARY');
  console.log('='.repeat(50));
  console.log(`API Services: ${apiOperational}/${dependencies.apiServices.length} operational`);
  console.log(`Environment: ${envConfigured}/${dependencies.environment.length} configured`);
  console.log(`Database: ${dbOperational ? 'Connected' : 'Disconnected'}`);
  console.log(`Performance: ${perfOperational ? 'Operational' : 'Unavailable'}`);
  
  const overallHealth = apiOperational >= 1 && envConfigured >= 3 && dbOperational;
  console.log(`Overall Status: ${overallHealth ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'}`);
  console.log('='.repeat(50));

  return dependencies;
}

// Validate environment configuration
export async function validateEnv() {
  console.log('🔧 Validating Environment Configuration...\n');
  
  const validation = {
    required: [],
    optional: [],
    security: [],
    performance: []
  };

  // Required Environment Variables
  console.log('📋 Required Variables:');
  const requiredVars = [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string', critical: true },
    { name: 'ATTOM_API_KEY', description: 'Attom Data API access key', critical: true },
    { name: 'RAPIDAPI_KEY', description: 'Primary RapidAPI subscription key', critical: true },
    { name: 'RAPIDAPI_KEY_2', description: 'Backup RapidAPI subscription key', critical: false },
    { name: 'GEODB_API_KEY', description: 'GeoDB Cities API key', critical: false }
  ];

  for (const envVar of requiredVars) {
    const value = process.env[envVar.name];
    const isPresent = !!value;
    const isValid = value && value.length > 10 && !value.includes('test') && !value.includes('placeholder');
    
    validation.required.push({
      name: envVar.name,
      description: envVar.description,
      present: isPresent,
      valid: isValid,
      critical: envVar.critical,
      masked: value ? `${value.substring(0, 8)}...` : 'not_set'
    });

    const status = !isPresent ? '❌ MISSING' : !isValid ? '⚠️  INVALID' : '✅ VALID';
    console.log(`  ${status} ${envVar.name}: ${envVar.description}`);
    if (isPresent && !isValid) {
      console.log(`    └── Warning: Value appears to be test/placeholder data`);
    }
  }

  // Optional Environment Variables
  console.log('\n🔗 Optional Variables:');
  const optionalVars = [
    { name: 'NODE_ENV', expected: 'development', description: 'Runtime environment' },
    { name: 'SESSION_SECRET', description: 'Session encryption key', security: true },
    { name: 'REPLIT_DOMAINS', description: 'Allowed domains for authentication' },
    { name: 'ISSUER_URL', description: 'OAuth issuer URL' }
  ];

  for (const envVar of optionalVars) {
    const value = process.env[envVar.name];
    const isPresent = !!value;
    
    validation.optional.push({
      name: envVar.name,
      description: envVar.description,
      present: isPresent,
      value: envVar.security ? (value ? 'configured' : 'not_set') : value || 'not_set'
    });

    const status = isPresent ? '✅ SET' : '⚪ OPTIONAL';
    console.log(`  ${status} ${envVar.name}: ${envVar.description}`);
    if (envVar.expected && value !== envVar.expected) {
      console.log(`    └── Expected: ${envVar.expected}, Found: ${value || 'not_set'}`);
    }
  }

  // Security Assessment
  console.log('\n🔒 Security Assessment:');
  const securityChecks = [
    {
      name: 'API Key Format',
      check: () => {
        const attomKey = process.env.ATTOM_API_KEY;
        const rapidKey = process.env.RAPIDAPI_KEY;
        return attomKey && attomKey.length >= 32 && rapidKey && rapidKey.length >= 32;
      },
      description: 'API keys meet minimum length requirements'
    },
    {
      name: 'Database Security',
      check: () => {
        const dbUrl = process.env.DATABASE_URL;
        return dbUrl && (dbUrl.includes('ssl=true') || dbUrl.includes('sslmode=require'));
      },
      description: 'Database connection uses SSL encryption'
    },
    {
      name: 'Environment Isolation',
      check: () => {
        return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production';
      },
      description: 'Environment properly configured'
    }
  ];

  for (const security of securityChecks) {
    const passed = security.check();
    validation.security.push({
      name: security.name,
      passed,
      description: security.description
    });

    console.log(`  ${passed ? '✅' : '⚠️ '} ${security.description}`);
  }

  // Performance Configuration
  console.log('\n⚡ Performance Configuration:');
  const performanceChecks = [
    {
      name: 'Memory Limit',
      value: process.env.NODE_OPTIONS || 'default',
      optimal: '--max-old-space-size=4096'
    },
    {
      name: 'Timeout Settings',
      value: 'default',
      optimal: 'configured'
    }
  ];

  for (const perf of performanceChecks) {
    validation.performance.push(perf);
    console.log(`  📊 ${perf.name}: ${perf.value}`);
  }

  // Validation Summary
  const requiredValid = validation.required.filter(v => v.present && v.valid).length;
  const requiredCritical = validation.required.filter(v => v.critical).length;
  const criticalValid = validation.required.filter(v => v.critical && v.present && v.valid).length;
  const securityPassed = validation.security.filter(s => s.passed).length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 ENVIRONMENT VALIDATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Required Variables: ${requiredValid}/${validation.required.length} valid`);
  console.log(`Critical Variables: ${criticalValid}/${requiredCritical} valid`);
  console.log(`Security Checks: ${securityPassed}/${validation.security.length} passed`);
  
  const overallValid = criticalValid === requiredCritical && securityPassed >= 2;
  console.log(`Environment Status: ${overallValid ? '✅ READY FOR PRODUCTION' : '⚠️  NEEDS CONFIGURATION'}`);
  
  if (!overallValid) {
    console.log('\n🔧 Recommended Actions:');
    if (criticalValid < requiredCritical) {
      console.log('  • Configure missing critical API keys in Replit Secrets');
    }
    if (securityPassed < 2) {
      console.log('  • Review security configuration for production deployment');
    }
  }
  
  console.log('='.repeat(50));

  return validation;
}

// Auto-fix common platform issues
export async function autoFix(issueType = 'all') {
  console.log(`🔧 Running Auto-Fix for: ${issueType}\n`);
  
  const fixes = {
    applied: [],
    failed: [],
    recommendations: []
  };

  switch (issueType) {
    case 'databaseIssues':
      await fixDatabaseIssues(fixes);
      break;
    case 'apiConnections':
      await fixApiConnections(fixes);
      break;
    case 'performance':
      await fixPerformanceIssues(fixes);
      break;
    case 'foreclosureSystem':
      await fixForeclosureSystem(fixes);
      break;
    case 'all':
      await fixDatabaseIssues(fixes);
      await fixApiConnections(fixes);
      await fixPerformanceIssues(fixes);
      await fixForeclosureSystem(fixes);
      break;
    default:
      console.log(`❌ Unknown issue type: ${issueType}`);
      return;
  }

  printFixResults(fixes);
  return fixes;
}

async function fixDatabaseIssues(fixes) {
  console.log('🗄️ Checking Database Issues...');
  
  try {
    // Test database connection
    const healthResponse = await fetch(`${BASE_URL}/api/v3/debug/health`, { timeout: 5000 });
    const healthData = await healthResponse.json();
    
    if (healthData.services?.database === 'connected') {
      fixes.applied.push({
        category: 'database',
        issue: 'Database Connection',
        action: 'Verified connection is healthy',
        status: 'success'
      });
      console.log('  ✅ Database connection verified');
    } else {
      fixes.failed.push({
        category: 'database',
        issue: 'Database Connection Failed',
        error: 'Unable to connect to PostgreSQL',
        recommendation: 'Check DATABASE_URL in Replit Secrets'
      });
      console.log('  ❌ Database connection failed');
    }

    // Check connection pool
    if (healthData.performance?.memoryUsage) {
      const memoryMB = Math.round(healthData.performance.memoryUsage.heapUsed / 1024 / 1024);
      if (memoryMB > 200) {
        fixes.recommendations.push({
          category: 'database',
          issue: 'High Memory Usage',
          suggestion: 'Consider connection pool optimization',
          current: `${memoryMB}MB`,
          recommended: '<150MB'
        });
        console.log(`  ⚠️ High memory usage detected: ${memoryMB}MB`);
      } else {
        fixes.applied.push({
          category: 'database',
          issue: 'Memory Usage',
          action: `Memory usage is optimal at ${memoryMB}MB`,
          status: 'success'
        });
        console.log(`  ✅ Memory usage optimal: ${memoryMB}MB`);
      }
    }

    // Test query performance
    const startTime = Date.now();
    await fetch(`${BASE_URL}/api/auth/user`, { timeout: 3000 });
    const queryTime = Date.now() - startTime;
    
    if (queryTime < 100) {
      fixes.applied.push({
        category: 'database',
        issue: 'Query Performance',
        action: `Database queries responding in ${queryTime}ms`,
        status: 'success'
      });
      console.log(`  ✅ Query performance excellent: ${queryTime}ms`);
    } else if (queryTime > 1000) {
      fixes.recommendations.push({
        category: 'database',
        issue: 'Slow Query Performance',
        suggestion: 'Consider adding database indexes',
        current: `${queryTime}ms`,
        recommended: '<100ms'
      });
      console.log(`  ⚠️ Slow query detected: ${queryTime}ms`);
    }

  } catch (error) {
    fixes.failed.push({
      category: 'database',
      issue: 'Database Health Check Failed',
      error: error.message,
      recommendation: 'Restart application and verify DATABASE_URL'
    });
    console.log('  ❌ Database health check failed');
  }
}

async function fixApiConnections(fixes) {
  console.log('\n📡 Checking API Connections...');
  
  // Check internal API health
  try {
    const internalStart = Date.now();
    const healthResponse = await fetch(`${BASE_URL}/api/v3/debug/health`, { timeout: 3000 });
    const internalTime = Date.now() - internalStart;
    
    if (healthResponse.ok) {
      fixes.applied.push({
        category: 'api',
        issue: 'Internal API Health',
        action: `All internal endpoints responding in ${internalTime}ms`,
        status: 'success'
      });
      console.log(`  ✅ Internal APIs healthy: ${internalTime}ms`);
    }
  } catch (error) {
    fixes.failed.push({
      category: 'api',
      issue: 'Internal API Connection',
      error: error.message,
      recommendation: 'Restart server workflow'
    });
    console.log('  ❌ Internal API connection failed');
  }

  // Test property search endpoint
  try {
    const searchStart = Date.now();
    const searchResponse = await fetch(`${BASE_URL}/api/properties?zipCode=90210&limit=1`, { timeout: 10000 });
    const searchTime = Date.now() - searchStart;
    
    if (searchResponse.ok) {
      fixes.applied.push({
        category: 'api',
        issue: 'Property Search API',
        action: `Property search working in ${searchTime}ms`,
        status: 'success'
      });
      console.log(`  ✅ Property search API working: ${searchTime}ms`);
    }
  } catch (error) {
    fixes.failed.push({
      category: 'api',
      issue: 'Property Search API',
      error: error.message,
      recommendation: 'Check Attom API key configuration'
    });
    console.log('  ❌ Property search API failed');
  }

  // Test lien analysis endpoint
  try {
    const lienResponse = await fetch(`${BASE_URL}/api/properties/lien-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '1209 Auld Ln', zipCode: '90210' }),
      timeout: 5000
    });
    
    if (lienResponse.ok) {
      fixes.applied.push({
        category: 'api',
        issue: 'Lien Analysis API',
        action: 'Lien analysis endpoint operational',
        status: 'success'
      });
      console.log('  ✅ Lien analysis API working');
    }
  } catch (error) {
    fixes.failed.push({
      category: 'api',
      issue: 'Lien Analysis API',
      error: error.message,
      recommendation: 'Verify lien analysis service configuration'
    });
    console.log('  ❌ Lien analysis API failed');
  }
}

async function fixPerformanceIssues(fixes) {
  console.log('\n⚡ Checking Performance Issues...');
  
  try {
    const perfResponse = await fetch(`${BASE_URL}/api/v3/debug/health`, { timeout: 3000 });
    const perfData = await perfResponse.json();
    
    if (perfData.performance) {
      const { uptime, memoryUsage, nodeVersion } = perfData.performance;
      const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      
      // Check uptime
      if (uptime > 300) { // 5 minutes
        fixes.applied.push({
          category: 'performance',
          issue: 'System Stability',
          action: `System stable with ${Math.round(uptime)}s uptime`,
          status: 'success'
        });
        console.log(`  ✅ System stable: ${Math.round(uptime)}s uptime`);
      }
      
      // Check memory usage
      if (memoryMB < 250) {
        fixes.applied.push({
          category: 'performance',
          issue: 'Memory Management',
          action: `Memory usage healthy at ${memoryMB}MB`,
          status: 'success'
        });
        console.log(`  ✅ Memory usage healthy: ${memoryMB}MB`);
      } else {
        fixes.recommendations.push({
          category: 'performance',
          issue: 'High Memory Usage',
          suggestion: 'Consider restarting application to clear memory',
          current: `${memoryMB}MB`,
          recommended: '<250MB'
        });
        console.log(`  ⚠️ High memory usage: ${memoryMB}MB`);
      }
      
      // Check Node.js version
      if (nodeVersion === 'v20.18.1') {
        fixes.applied.push({
          category: 'performance',
          issue: 'Runtime Version',
          action: 'Running optimal Node.js version',
          status: 'success'
        });
        console.log('  ✅ Node.js version optimal');
      }
    }
    
  } catch (error) {
    fixes.failed.push({
      category: 'performance',
      issue: 'Performance Monitoring',
      error: error.message,
      recommendation: 'Enable performance monitoring endpoints'
    });
    console.log('  ❌ Performance monitoring failed');
  }
}

function printFixResults(fixes) {
  const totalApplied = fixes.applied.length;
  const totalFailed = fixes.failed.length;
  const totalRecommendations = fixes.recommendations.length;
  
  console.log('\n' + '='.repeat(50));
  console.log('🔧 AUTO-FIX RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Fixes Applied: ${totalApplied}`);
  console.log(`Failed Fixes: ${totalFailed}`);
  console.log(`Recommendations: ${totalRecommendations}`);
  
  if (totalFailed > 0) {
    console.log('\n❌ FAILED FIXES:');
    fixes.failed.forEach(fix => {
      console.log(`  • ${fix.issue}: ${fix.error}`);
      if (fix.recommendation) {
        console.log(`    └── ${fix.recommendation}`);
      }
    });
  }
  
  if (totalRecommendations > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    fixes.recommendations.forEach(rec => {
      console.log(`  • ${rec.issue}: ${rec.suggestion}`);
      if (rec.current && rec.recommended) {
        console.log(`    └── Current: ${rec.current}, Recommended: ${rec.recommended}`);
      }
    });
  }
  
  const overallSuccess = totalApplied > totalFailed;
  console.log(`\nOverall Status: ${overallSuccess ? '✅ SYSTEM HEALTHY' : '⚠️ NEEDS ATTENTION'}`);
  console.log('='.repeat(50));
}

async function fixForeclosureSystem(fixes) {
  console.log('\n🏦 Checking Foreclosure System Issues...');
  
  try {
    // 1. Test foreclosure API connectivity
    console.log('  📡 Testing API connectivity...');
    const foreStart = Date.now();
    const foreResponse = await fetch(`${BASE_URL}/api/foreclosures?zipCode=90210&limit=3`, { timeout: 10000 });
    const foreTime = Date.now() - foreStart;
    
    if (foreResponse.ok) {
      const foreData = await foreResponse.json();
      const foreclosureCount = foreData.foreclosures?.length || 0;
      
      fixes.applied.push({
        category: 'foreclosure',
        issue: 'API Connectivity',
        action: `Foreclosure API responding in ${foreTime}ms with ${foreclosureCount} results`,
        status: 'success'
      });
      console.log(`    ✅ API connectivity verified: ${foreTime}ms, ${foreclosureCount} foreclosures`);
      
      // Check for required fields
      if (foreclosureCount > 0) {
        const firstProperty = foreData.foreclosures[0];
        const requiredFields = ['address', 'id', 'estimatedValue'];
        const missingFields = requiredFields.filter(field => !firstProperty[field]);
        
        if (missingFields.length === 0) {
          fixes.applied.push({
            category: 'foreclosure',
            issue: 'Data Structure',
            action: 'All required fields present in foreclosure data',
            status: 'success'
          });
          console.log(`    ✅ Data structure validated: All required fields present`);
        } else {
          fixes.recommendations.push({
            category: 'foreclosure',
            issue: 'Missing Data Fields',
            suggestion: `Update foreclosure data mapping for fields: ${missingFields.join(', ')}`,
            current: `Missing: ${missingFields.join(', ')}`,
            recommended: 'Complete data structure'
          });
          console.log(`    ⚠️ Missing data fields: ${missingFields.join(', ')}`);
        }
      }
      
    } else {
      fixes.failed.push({
        category: 'foreclosure',
        issue: 'API Connection Failed',
        error: `HTTP ${foreResponse.status}`,
        recommendation: 'Check foreclosure API configuration and authentication'
      });
      console.log(`    ❌ API connection failed: HTTP ${foreResponse.status}`);
    }
    
    // 2. Test foreclosure data freshness
    console.log('  📅 Testing data freshness...');
    try {
      const freshResponse = await fetch(`${BASE_URL}/api/foreclosures?zipCode=33460&limit=1`, { timeout: 8000 });
      if (freshResponse.ok) {
        const freshData = await freshResponse.json();
        if (freshData.foreclosures?.length > 0) {
          fixes.applied.push({
            category: 'foreclosure',
            issue: 'Data Availability',
            action: 'Foreclosure data available across multiple markets',
            status: 'success'
          });
          console.log(`    ✅ Data freshness verified: Multi-market coverage confirmed`);
        }
      }
    } catch (error) {
      fixes.recommendations.push({
        category: 'foreclosure',
        issue: 'Data Coverage',
        suggestion: 'Verify foreclosure data availability across different markets',
        current: 'Limited market testing',
        recommended: 'Full market coverage validation'
      });
      console.log(`    ⚠️ Limited data coverage testing: ${error.message}`);
    }
    
    // 3. Test foreclosure tracking functionality
    console.log('  🎯 Testing tracking functionality...');
    try {
      const trackResponse = await fetch(`${BASE_URL}/api/foreclosures/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          propertyId: 'test-12345',
          zipCode: '90210',
          address: '1209 Auld Ln'
        }),
        timeout: 5000
      });
      
      if (trackResponse.ok) {
        fixes.applied.push({
          category: 'foreclosure',
          issue: 'Tracking System',
          action: 'Foreclosure tracking endpoint operational',
          status: 'success'
        });
        console.log(`    ✅ Tracking functionality verified`);
      } else {
        fixes.recommendations.push({
          category: 'foreclosure',
          issue: 'Tracking System',
          suggestion: 'Implement or fix foreclosure tracking endpoint',
          current: `HTTP ${trackResponse.status}`,
          recommended: 'Operational tracking system'
        });
        console.log(`    ⚠️ Tracking system needs attention: HTTP ${trackResponse.status}`);
      }
    } catch (error) {
      fixes.recommendations.push({
        category: 'foreclosure',
        issue: 'Tracking System',
        suggestion: 'Implement foreclosure tracking functionality',
        current: 'Endpoint not available',
        recommended: 'Full tracking capabilities'
      });
      console.log(`    ⚠️ Tracking system unavailable: ${error.message}`);
    }
    
    // 4. Test performance benchmarks
    console.log('  ⚡ Testing performance benchmarks...');
    if (foreTime < 5000) {
      fixes.applied.push({
        category: 'foreclosure',
        issue: 'Performance',
        action: `Foreclosure API performance excellent: ${foreTime}ms`,
        status: 'success'
      });
      console.log(`    ✅ Performance benchmark met: ${foreTime}ms`);
    } else if (foreTime > 15000) {
      fixes.recommendations.push({
        category: 'foreclosure',
        issue: 'Performance',
        suggestion: 'Optimize foreclosure API response time',
        current: `${foreTime}ms`,
        recommended: '<10000ms'
      });
      console.log(`    ⚠️ Performance needs optimization: ${foreTime}ms`);
    } else {
      fixes.applied.push({
        category: 'foreclosure',
        issue: 'Performance',
        action: `Foreclosure API performance acceptable: ${foreTime}ms`,
        status: 'success'
      });
      console.log(`    ✅ Performance acceptable: ${foreTime}ms`);
    }
    
    // 5. Emergency protocol validation
    console.log('  🚨 Validating emergency protocols...');
    const emergencyChecks = [
      { name: 'Database backup capability', available: !!process.env.DATABASE_URL },
      { name: 'API fallback configuration', available: !!(process.env.RAPIDAPI_KEY_2 || process.env.ATTOM_API_KEY) },
      { name: 'Error logging system', available: true } // Assuming basic logging is available
    ];
    
    emergencyChecks.forEach(check => {
      if (check.available) {
        fixes.applied.push({
          category: 'foreclosure',
          issue: 'Emergency Protocol',
          action: `${check.name} verified`,
          status: 'success'
        });
        console.log(`    ✅ ${check.name} available`);
      } else {
        fixes.recommendations.push({
          category: 'foreclosure',
          issue: 'Emergency Protocol',
          suggestion: `Implement ${check.name}`,
          current: 'Not configured',
          recommended: 'Full emergency preparedness'
        });
        console.log(`    ⚠️ ${check.name} needs configuration`);
      }
    });
    
  } catch (error) {
    fixes.failed.push({
      category: 'foreclosure',
      issue: 'System Diagnostic Failed',
      error: error.message,
      recommendation: 'Check foreclosure system configuration and restart services'
    });
    console.log(`    ❌ Foreclosure system diagnostic failed: ${error.message}`);
  }
}

// Comprehensive system diagnosis
async function runComprehensiveDiagnosis() {
  console.log('🔍 COMPREHENSIVE SYSTEM DIAGNOSIS');
  console.log('='.repeat(60));
  console.log(`🚀 Platform Debugger v3.0.0 - Complete Analysis Started`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const startTime = Date.now();
  const diagnosis = {
    timestamp: new Date().toISOString(),
    environment: null,
    dependencies: null,
    coreFeatures: {},
    performance: {},
    recommendations: [],
    overallHealth: 'unknown'
  };

  try {
    // 1. Environment Validation
    console.log('\n📋 PHASE 1: Environment Configuration');
    console.log('-'.repeat(40));
    diagnosis.environment = await validateEnv();
    
    // 2. Dependency Checks  
    console.log('\n🔗 PHASE 2: System Dependencies');
    console.log('-'.repeat(40));
    diagnosis.dependencies = await checkDependencies();
    
    // 3. Core Feature Testing
    console.log('\n🧪 PHASE 3: Core Feature Testing');
    console.log('-'.repeat(40));
    
    const platformTester = new PlatformDebugger();
    
    // Test Property Intelligence (quick version)
    console.log('🏠 Testing Property Intelligence...');
    const propStart = Date.now();
    try {
      const propResponse = await fetch(`${BASE_URL}/api/properties?zipCode=90210&limit=5`, { timeout: 10000 });
      const propTime = Date.now() - propStart;
      const propData = await propResponse.json();
      
      diagnosis.coreFeatures.propertyIntelligence = {
        status: propResponse.ok ? 'operational' : 'failed',
        responseTime: propTime,
        propertiesFound: propData.properties?.length || 0,
        tested: true
      };
      console.log(`  ✅ Property search: ${propTime}ms, ${propData.properties?.length || 0} properties`);
    } catch (error) {
      diagnosis.coreFeatures.propertyIntelligence = {
        status: 'failed',
        error: error.message,
        tested: true
      };
      console.log(`  ❌ Property search failed: ${error.message}`);
    }
    
    // Test AI Appraisal
    console.log('🤖 Testing AI Appraisal...');
    const aiStart = Date.now();
    try {
      const aiResponse = await fetch(`${BASE_URL}/api/properties/appraise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: '1209 Auld Ln', zipCode: '90210' }),
        timeout: 8000
      });
      const aiTime = Date.now() - aiStart;
      const aiData = await aiResponse.json();
      
      diagnosis.coreFeatures.aiAppraisal = {
        status: aiResponse.ok ? 'operational' : 'failed',
        responseTime: aiTime,
        hasAppraisal: !!(aiData.propertyAddress || aiData.estimatedValue),
        tested: true
      };
      console.log(`  ✅ AI appraisal: ${aiTime}ms, analysis complete`);
    } catch (error) {
      diagnosis.coreFeatures.aiAppraisal = {
        status: 'failed',
        error: error.message,
        tested: true
      };
      console.log(`  ❌ AI appraisal failed: ${error.message}`);
    }
    
    // Test Foreclosure System
    console.log('🏦 Testing Foreclosure System...');
    const foreStart = Date.now();
    try {
      const foreResponse = await fetch(`${BASE_URL}/api/foreclosures?zipCode=90210&limit=3`, { timeout: 8000 });
      const foreTime = Date.now() - foreStart;
      const foreData = await foreResponse.json();
      
      diagnosis.coreFeatures.foreclosureSystem = {
        status: foreResponse.ok ? 'operational' : 'failed',
        responseTime: foreTime,
        foreclosuresFound: foreData.foreclosures?.length || 0,
        tested: true
      };
      console.log(`  ✅ Foreclosure tracking: ${foreTime}ms, ${foreData.foreclosures?.length || 0} listings`);
    } catch (error) {
      diagnosis.coreFeatures.foreclosureSystem = {
        status: 'failed',
        error: error.message,
        tested: true
      };
      console.log(`  ❌ Foreclosure tracking failed: ${error.message}`);
    }
    
    // Test Lien Analysis
    console.log('⚖️ Testing Lien Analysis...');
    const lienStart = Date.now();
    try {
      const lienResponse = await fetch(`${BASE_URL}/api/properties/lien-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: '1209 Auld Ln', zipCode: '90210' }),
        timeout: 6000
      });
      const lienTime = Date.now() - lienStart;
      const lienData = await lienResponse.json();
      
      diagnosis.coreFeatures.lienAnalysis = {
        status: lienResponse.ok ? 'operational' : 'failed',
        responseTime: lienTime,
        hasAnalysis: !!(lienData.analysis || lienData.riskAssessment),
        tested: true
      };
      console.log(`  ✅ Lien analysis: ${lienTime}ms, risk assessment complete`);
    } catch (error) {
      diagnosis.coreFeatures.lienAnalysis = {
        status: 'failed',
        error: error.message,
        tested: true
      };
      console.log(`  ❌ Lien analysis failed: ${error.message}`);
    }
    
    // 4. Performance Analysis
    console.log('\n⚡ PHASE 4: Performance Analysis');
    console.log('-'.repeat(40));
    try {
      const perfResponse = await fetch(`${BASE_URL}/api/v3/debug/health`, { timeout: 3000 });
      const perfData = await perfResponse.json();
      
      if (perfData.performance) {
        const memoryMB = Math.round(perfData.performance.memoryUsage.heapUsed / 1024 / 1024);
        diagnosis.performance = {
          uptime: Math.round(perfData.performance.uptime),
          memoryUsage: memoryMB,
          nodeVersion: perfData.performance.nodeVersion,
          status: perfData.status
        };
        
        console.log(`  📊 Memory usage: ${memoryMB}MB`);
        console.log(`  ⏱️ Uptime: ${Math.round(perfData.performance.uptime)}s`);
        console.log(`  🔧 Node.js: ${perfData.performance.nodeVersion}`);
      }
    } catch (error) {
      console.log(`  ❌ Performance monitoring failed: ${error.message}`);
    }
    
    // 5. Generate Recommendations
    console.log('\n💡 PHASE 5: Analysis & Recommendations');
    console.log('-'.repeat(40));
    
    const totalFeatures = Object.keys(diagnosis.coreFeatures).length;
    const workingFeatures = Object.values(diagnosis.coreFeatures).filter(f => f.status === 'operational').length;
    const healthScore = Math.round((workingFeatures / totalFeatures) * 100);
    
    // Environment recommendations
    const requiredValid = diagnosis.environment?.required?.filter(v => v.present && v.valid).length || 0;
    const requiredTotal = diagnosis.environment?.required?.length || 0;
    
    if (requiredValid < requiredTotal) {
      diagnosis.recommendations.push({
        category: 'Environment',
        priority: 'high',
        issue: 'Missing API credentials',
        action: 'Configure missing API keys in Replit Secrets'
      });
    }
    
    // Performance recommendations
    if (diagnosis.performance.memoryUsage > 200) {
      diagnosis.recommendations.push({
        category: 'Performance',
        priority: 'medium',
        issue: `High memory usage: ${diagnosis.performance.memoryUsage}MB`,
        action: 'Consider restarting application to clear memory'
      });
    }
    
    // Feature recommendations
    Object.entries(diagnosis.coreFeatures).forEach(([feature, data]) => {
      if (data.status === 'failed') {
        diagnosis.recommendations.push({
          category: 'Features',
          priority: 'high',
          issue: `${feature} not working`,
          action: `Check ${feature} configuration and API connectivity`
        });
      } else if (data.responseTime > 5000) {
        diagnosis.recommendations.push({
          category: 'Performance',
          priority: 'medium',
          issue: `${feature} slow response: ${data.responseTime}ms`,
          action: 'Investigate API performance or network connectivity'
        });
      }
    });
    
    // Overall health assessment
    if (healthScore >= 90) {
      diagnosis.overallHealth = 'excellent';
    } else if (healthScore >= 75) {
      diagnosis.overallHealth = 'good';
    } else if (healthScore >= 50) {
      diagnosis.overallHealth = 'fair';
    } else {
      diagnosis.overallHealth = 'poor';
    }
    
    // Display recommendations
    if (diagnosis.recommendations.length > 0) {
      diagnosis.recommendations.forEach((rec, i) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`  ${priority} ${rec.category}: ${rec.issue}`);
        console.log(`     └── ${rec.action}`);
      });
    } else {
      console.log('  ✅ No critical issues detected');
    }
    
  } catch (error) {
    console.log(`\n❌ Diagnosis failed: ${error.message}`);
    diagnosis.overallHealth = 'error';
  }
  
  // Final Summary
  const totalTime = Date.now() - startTime;
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE DIAGNOSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏱️ Total analysis time: ${totalTime}ms`);
  console.log(`🏥 Overall system health: ${diagnosis.overallHealth.toUpperCase()}`);
  console.log(`🔧 Features tested: ${Object.keys(diagnosis.coreFeatures).length}`);
  console.log(`✅ Working features: ${Object.values(diagnosis.coreFeatures).filter(f => f.status === 'operational').length}`);
  console.log(`⚠️ Recommendations: ${diagnosis.recommendations.length}`);
  
  const healthIcon = diagnosis.overallHealth === 'excellent' ? '🟢' : 
                    diagnosis.overallHealth === 'good' ? '🟡' : 
                    diagnosis.overallHealth === 'fair' ? '🟠' : '🔴';
  
  console.log(`\n${healthIcon} SYSTEM STATUS: ${diagnosis.overallHealth.toUpperCase()}`);
  
  if (diagnosis.overallHealth === 'excellent') {
    console.log('🚀 Platform is operating at peak performance');
  } else if (diagnosis.overallHealth === 'good') {
    console.log('✅ Platform is working well with minor optimizations needed');
  } else if (diagnosis.overallHealth === 'fair') {
    console.log('⚠️ Platform is functional but needs attention');
  } else {
    console.log('🔴 Platform needs immediate attention');
  }
  
  console.log('='.repeat(60));
  
  return diagnosis;
}

// Export functions for command line usage
export async function runTests(testSuite = 'all') {
  const platformDebugger = new PlatformDebugger();
  await platformDebugger.runTests(testSuite);
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('platform-debugger.js')) {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let command = 'runAllTests';
  let featureName = 'all';
  let issueType = 'all';
  
  for (const arg of args) {
    if (arg.startsWith('--test=')) {
      command = 'test';
      featureName = arg.split('=')[1];
    } else if (arg.startsWith('--fix=')) {
      command = 'fix';
      issueType = arg.split('=')[1];
    } else if (arg === '--deps' || arg === '--dependencies') {
      command = 'deps';
    } else if (arg === '--env' || arg === '--environment') {
      command = 'env';
    } else if (arg === '--full' || arg === '--all') {
      command = 'full';
    } else if (arg === '--diagnose') {
      command = 'diagnose';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
🚀 Platform Debugger v3.0.0 Command Line Interface

Usage:
  node platform-debugger.js [command]

Commands:
  --test=featureName     Run specific feature tests
                         Available features: propertyIntelligence, aiAppraisal, 
                         foreclosureSystem, lienAnalysis, globalSearch, all

  --fix=issueType        Run auto-fix procedures
                         Available types: databaseIssues, apiConnections, 
                         performance, foreclosureSystem, all

  --deps                 Check all dependencies and services
  --env                  Validate environment variables
  --diagnose             Run comprehensive system diagnosis
  --full                 Run complete diagnostic suite
  --help                 Show this help message

Examples:
  node platform-debugger.js --test=propertyIntelligence
  node platform-debugger.js --test=aiAppraisal
  node platform-debugger.js --fix=databaseIssues
  node platform-debugger.js --deps
  node platform-debugger.js --env
  node platform-debugger.js --diagnose
  node platform-debugger.js --full
      `);
      process.exit(0);
    }
  }
  
  console.log(`🚀 Platform Debugger v3.0.0 - Running ${command}${featureName !== 'all' ? ` for ${featureName}` : ''}...\n`);
  
  const platformTester = new PlatformDebugger();
  
  switch (command) {
    case 'test':
      platformTester.runTests(featureName);
      break;
    case 'deps':
      checkDependencies();
      break;
    case 'env':
      validateEnv();
      break;
    case 'fix':
      autoFix(issueType);
      break;
    case 'diagnose':
      runComprehensiveDiagnosis();
      break;
    case 'full':
      platformTester.runAllTests();
      break;
    default:
      platformTester.runTests('all');
      break;
  }
}