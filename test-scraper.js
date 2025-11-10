import puppeteer from 'puppeteer';

async function testRealtorScraper() {
  console.log('Testing realtor.com scraper with ZIP code 96813 (Hawaii)...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const searchUrl = 'https://www.realtor.com/realestateandhomes-search/96813';
    console.log('Navigating to:', searchUrl);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if page loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Look for property listings
    const propertyCards = await page.$$('[data-testid="property-card"]');
    console.log('Found', propertyCards.length, 'property cards');
    
    if (propertyCards.length > 0) {
      console.log('✅ Successfully found property listings on realtor.com');
      
      // Extract sample property data
      const firstProperty = propertyCards[0];
      const price = await firstProperty.$eval('[data-testid="card-price"]', el => el.textContent).catch(() => 'Price not found');
      const address = await firstProperty.$eval('[data-testid="card-address"]', el => el.textContent).catch(() => 'Address not found');
      
      console.log('Sample property:');
      console.log('  Price:', price);
      console.log('  Address:', address);
    } else {
      console.log('❌ No property listings found');
    }

  } catch (error) {
    console.error('Scraper test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testRealtorScraper();