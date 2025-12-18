import httpx
import asyncio

async def debug_scrape():
    url = "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=crypto&search_type=keyword_unordered"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
    }
    
    print(f"Fetching {url}...")
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Content length: {len(response.text)}")
        
        # Save to file to inspect
        with open("ads_lib_debug.html", "w") as f:
            f.write(response.text)
            
        print("Saved detailed HTML to ads_lib_debug.html")

if __name__ == "__main__":
    asyncio.run(debug_scrape())
