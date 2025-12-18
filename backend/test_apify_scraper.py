"""
Test script for the Apify Premium URL-based Meta Ads scraper.
Actor: jj5sAMeSoXotatkss (Meta (Facebook) Ad Scrapper Using Ad Library URL Premium)
"""
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from apify_ads_client import ApifyAdsClient, fetch_ads_from_url


async def test_keyword_search():
    """Test keyword-based search (builds URL automatically)."""
    print("=" * 60)
    print("TEST 1: Keyword-based search (builds URL)")
    print("=" * 60)
    
    client = ApifyAdsClient()
    
    # Build a URL for testing
    url = client.build_ads_library_url("free trial", country="US")
    print(f"Generated URL: {url}")
    print()
    
    try:
        ads = await client.search_ads("free trial", limit=5)
        
        if ads:
            print(f"\n✅ SUCCESS: Got {len(ads)} ads!\n")
            for i, ad in enumerate(ads, 1):
                print(f"--- Ad {i} ---")
                print(f"  ID: {ad.ad_id}")
                print(f"  Advertiser: {ad.advertiser_name}")
                print(f"  Active: {ad.is_active}")
                print(f"  Start Date: {ad.start_date}")
                print(f"  Text: {ad.text[:200]}...")
                print()
        else:
            print("\n❌ NO ADS RETURNED")
    finally:
        await client.close()


async def test_direct_url():
    """Test with a direct Facebook Ads Library URL (like the user example)."""
    print("=" * 60)
    print("TEST 2: Direct URL scraping (Nike example)")
    print("=" * 60)
    
    # Using the exact URL format from the Apify example
    url = "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=nike&search_type=keyword_unordered"
    
    print(f"Using URL: {url}\n")
    
    ads = await fetch_ads_from_url(url, limit=5)
    
    if ads:
        print(f"\n✅ SUCCESS: Got {len(ads)} ads!\n")
        for i, ad in enumerate(ads, 1):
            print(f"--- Ad {i} ---")
            print(f"  ID: {ad.ad_id}")
            print(f"  Advertiser: {ad.advertiser_name}")
            print(f"  Image: {'Yes' if ad.image_url else 'No'}")
            if ad.image_url:
                print(f"  Image URL: {ad.image_url[:50]}...")
            print(f"  Text: {ad.text[:200]}...")
            print()
    else:
        print("\n❌ NO ADS RETURNED")


async def main():
    print("\n🔍 Testing Apify Premium Meta Ads Scraper\n")
    print(f"Actor ID: jj5sAMeSoXotatkss")
    print(f"API Token present: {'Yes' if os.getenv('APIFY_API_TOKEN') else 'NO - set APIFY_API_TOKEN!'}")
    print()
    
    if not os.getenv("APIFY_API_TOKEN"):
        print("ERROR: APIFY_API_TOKEN not set!")
        return
    
    # Run tests - just do the Nike example first
    await test_direct_url()


if __name__ == "__main__":
    asyncio.run(main())
