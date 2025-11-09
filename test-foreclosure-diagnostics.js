import debugConfig from './foreclosure-debugger.json' assert { type: 'json' };
import { execSync } from 'child_process';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function runForeclosureDiagnostics() {
  console.log('🏦 Running Foreclosure System Diagnostics...\n');
  
  const tests = debugConfig.foreclosureTracker.diagnosticTests;
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`🧪 ${test.testName}...`);
    
    try {
      if (test.endpoint) {
        // API endpoint test
        const url = new URL(test.endpoint, BASE_URL);
        if (test.params) {
          Object.entries(test.params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
          });
        }
        
        const startTime = Date.now();
        const response = await fetch(url.toString(), {
          method: test.method || 'GET',
          timeout: 20000
        });
        const responseTime = Date.now() - startTime;
        
        const data = await response.json();
        
        // Check status
        if (response.status !== test.expected.status) {
          throw new Error(`Expected status ${test.expected.status}, got ${response.status}`);
        }
        
        // Check minimum results
        if (test.expected.minResults) {
          const resultCount = data.foreclosures?.length || data.properties?.length || 0;
          if (resultCount < test.expected.minResults) {
            throw new Error(`Expected minimum ${test.expected.minResults} results, got ${resultCount}`);
          }
          console.log(`  ✅ Success: ${resultCount} results in ${responseTime}ms`);
        }
        
        // Check required fields
        if (test.expected.requiredFields && data.foreclosures && data.foreclosures.length > 0) {
          const missingFields = test.expected.requiredFields.filter(field => 
            !data.foreclosures[0].hasOwnProperty(field)
          );
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }
          console.log(`  ✅ Success: All required fields present`);
        }
        
        // Check response time
        if (test.expected.maxResponseTime && responseTime > test.expected.maxResponseTime) {
          console.log(`  ⚠️  Warning: Response time ${responseTime}ms exceeds target ${test.expected.maxResponseTime}ms`);
        }
        
        if (!test.expected.minResults && !test.expected.requiredFields) {
          console.log(`  ✅ Success: API responding correctly`);
        }
        
      } else if (test.command) {
        // Command-based test
        const output = execSync(test.command, { encoding: 'utf-8', timeout: 10000 });
        
        if (test.testName === 'Database Connectivity' && parseInt(output.trim()) > 0) {
          console.log(`  ✅ Success: Database contains ${output.trim()} foreclosure records`);
        } else if (output.includes(test.expected)) {
          console.log(`  ✅ Success: Command executed successfully`);
        } else {
          throw new Error(`Unexpected output: ${output.trim()}`);
        }
      }
      
      passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      
      // Show suggested fixes
      if (test.fix) {
        console.log('  💡 Suggested fixes:');
        const fixes = test.fix.failure || test.fix.statusFailure || test.fix.timeoutFailure || [];
        fixes.forEach((fix, i) => console.log(`    ${i+1}. ${fix}`));
      }
    }
    
    console.log(''); // Empty line between tests
  }
  
  // Summary
  console.log('='.repeat(50));
  console.log('📊 FORECLOSURE DIAGNOSTICS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🟢 FORECLOSURE SYSTEM: FULLY OPERATIONAL');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('🟡 FORECLOSURE SYSTEM: MOSTLY OPERATIONAL');
  } else {
    console.log('🔴 FORECLOSURE SYSTEM: NEEDS ATTENTION');
  }
  
  console.log('='.repeat(50));
  
  // Performance targets check
  const targets = debugConfig.foreclosureTracker.performanceTargets;
  console.log('\n📈 Performance Targets:');
  console.log(`  Response Time: ${targets.responseTime}`);
  console.log(`  Data Completeness: ${targets.dataCompleteness}`);
  console.log(`  Uptime: ${targets.uptime}`);
  console.log(`  Memory Usage: ${targets.memoryUsage}`);
}

// Run the diagnostics
runForeclosureDiagnostics().catch(console.error);