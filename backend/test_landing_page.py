"""Quick test to verify landing page extraction and crawling."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from apify_ads_client import ApifyAdsClient
from landing_page_crawler import crawl_landing_page


async def test_landing_page_extraction():
    """Test that we extract landing page URLs from Apify."""
    print("="*60)
    print("Testing Landing Page URL Extraction from Apify")
    print("="*60)
    
    client = ApifyAdsClient()
    
    try:
        # Get a few ads
        ads = await client.search_ads("crypto", limit=5)
        
        if not ads:
            print("❌ No ads returned from Apify")
            return
        
        print(f"✅ Got {len(ads)} ads\n")
        
        for i, ad in enumerate(ads, 1):
            print(f"--- Ad {i}: {ad.advertiser_name} ---")
            print(f"  Ad ID: {ad.ad_id}")
            print(f"  Text: {ad.text[:100]}...")
            print(f"  Landing Page URL: {ad.landing_page_url or 'NOT FOUND'}")
            print(f"  Video URL: {ad.video_url or 'None'}")
            print(f"  Thumbnails: {len(ad.thumbnail_urls) if ad.thumbnail_urls else 0} images")
            
            # Try to crawl the landing page
            if ad.landing_page_url:
                print(f"\n  Crawling landing page...")
                content, error = await crawl_landing_page(ad.landing_page_url)
                if content:
                    print(f"  ✅ Crawled {len(content)} chars")
                    print(f"  Content preview: {content[:200]}...")
                else:
                    print(f"  ❌ Crawl failed: {error}")
            
            print()
            
    finally:
        await client.close()


async def main():
    print("\n🔍 Testing Landing Page Features\n")
    print(f"APIFY_API_TOKEN: {'Set' if os.getenv('APIFY_API_TOKEN') else 'NOT SET!'}")
    print()
    
    if not os.getenv("APIFY_API_TOKEN"):
        print("ERROR: APIFY_API_TOKEN not set!")
        return
    
    await test_landing_page_extraction()


if __name__ == "__main__":
    asyncio.run(main())
