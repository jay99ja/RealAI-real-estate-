// Test the V1 International API endpoint
const fetch = require('node-fetch');

async function testV1API() {
  try {
    console.log('Testing V1 International Property Search API...');
    
    const response = await fetch('http://localhost:5000/api/v1/properties/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        country: "FR",
        region: "Côte d'Azur",
        minPrice: 300000,
        currency: "EUR",
        propertyType: "villa",
        features: ["pool", "waterfront"]
      })
    });
    
    const data = await response.json();
    console.log('✅ V1 API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.properties) {
      console.log(`\n🎯 Found ${data.data.totalResults} French properties in Côte d'Azur`);
      console.log(`💰 Currency: ${data.data.searchCriteria.currency}`);
      console.log(`🏖️ Region Coverage: ${data.data.metadata.coverage}`);
    }
    
  } catch (error) {
    console.error('❌ V1 API Test Error:', error.message);
  }
}

testV1API();