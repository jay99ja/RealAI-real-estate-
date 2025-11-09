import { httpRealtorScraper } from './server/services/httpScraper.js';

async function testHttpScraper() {
  console.log('Testing HTTP realtor.com scraper with ZIP code 96813 (Hawaii)...');
  
  try {
    const properties = await httpRealtorScraper.scrapeProperties('96813', 5);
    console.log(`\nSuccessfully scraped ${properties.length} properties:`);
    
    properties.forEach((property, index) => {
      console.log(`\nProperty ${index + 1}:`);
      console.log(`- Address: ${property.address}`);
      console.log(`- City: ${property.city}, ${property.state} ${property.zipCode}`);
      console.log(`- Price: $${property.price.toLocaleString()}`);
      console.log(`- Beds: ${property.bedrooms}, Baths: ${property.bathrooms}`);
      console.log(`- Sqft: ${property.sqft}`);
      console.log(`- Photos: ${property.photos.length} images`);
    });
    
  } catch (error) {
    console.error('HTTP scraper test failed:', error.message);
  }
}

testHttpScraper();