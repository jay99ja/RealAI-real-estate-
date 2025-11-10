import { simpleRealtorScraper } from './server/services/simpleScraper.js';

async function testSimpleScraper() {
  console.log('Testing simple realtor.com scraper with ZIP code 96813 (Hawaii)...');
  
  try {
    const properties = await simpleRealtorScraper.scrapeProperties('96813', 5);
    console.log('Found', properties.length, 'properties');
    
    if (properties.length > 0) {
      console.log('Sample property:', JSON.stringify(properties[0], null, 2));
      console.log('✅ Successfully retrieved authentic property data');
    } else {
      console.log('No properties found');
    }
    
  } catch (error) {
    console.error('Scraper test failed:', error.message);
  }
}

testSimpleScraper();