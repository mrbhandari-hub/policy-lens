"""
Apify-based Meta Ads Library scraper.
Uses the "Meta (Facebook) Ad Scrapper (Using Ad Library URL) (Premium)" actor.
This takes a direct Facebook Ads Library URL and scrapes real ads.

Actor ID: jj5sAMeSoXotatkss
Input: adLibraryUrl (string), maxResults (int)
"""
import os
import httpx
import asyncio
from typing import Optional, List
from urllib.parse import urlencode
from ad_scanner import MetaAd


class ApifyAdsClient:
    """Client for fetching real ads from Meta Ads Library via Apify's URL-based scraper."""
    
    BASE_URL = "https://api.apify.com/v2"
    # The Premium URL-based Facebook Ad Scraper actor
    # "Meta (Facebook) Ad Scrapper (Using Ad Library URL) (Premium)"
    ACTOR_ID = "jj5sAMeSoXotatkss"
    
    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or os.getenv("APIFY_API_TOKEN")
        self.client = httpx.AsyncClient(timeout=180.0)  # Long timeout for scraping
    
    async def _run_sync(self, ads_library_url: str, limit: int) -> List[MetaAd]:
        """Run the actor synchronously and get results directly."""
        run_url = f"{self.BASE_URL}/acts/{self.ACTOR_ID}/run-sync-get-dataset-items"
        
        # Input for the actor (matching the exact format from Apify)
        input_data = {
            "adLibraryUrl": ads_library_url,
            "maxResults": limit
        }
        
        print(f"Calling Apify Premium scraper (sync)...")
        print(f"URL: {ads_library_url[:80]}...")
        print(f"Max results: {limit}")
        
        response = await self.client.post(
            run_url,
            params={"token": self.api_token},
            json=input_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code not in [200, 201]:
            print(f"Sync call returned {response.status_code}: {response.text[:200]}")
            return []
        
        data = response.json()
        print(f"Apify returned {len(data) if isinstance(data, list) else 'non-list'} items")
        
        if isinstance(data, list):
            return self._parse_apify_response(data, limit)
        return []
    
    async def _run_async(self, ads_library_url: str, limit: int) -> List[MetaAd]:
        """Run the actor asynchronously and poll for results."""
        run_url = f"{self.BASE_URL}/acts/{self.ACTOR_ID}/runs"
        
        input_data = {
            "adLibraryUrl": ads_library_url,
            "maxResults": limit
        }
        
        print("Starting async Apify run...")
        
        response = await self.client.post(
            run_url,
            params={"token": self.api_token},
            json=input_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code not in [200, 201]:
            print(f"Failed to start run: {response.status_code} - {response.text[:300]}")
            return []
        
        run_data = response.json()
        run_id = run_data.get("data", {}).get("id")
        
        if not run_id:
            print(f"No run ID in response: {run_data}")
            return []
        
        print(f"Actor run started with ID: {run_id}")
        
        # Poll for completion (max 3 minutes)
        for attempt in range(36):  # 36 * 5s = 180s
            await asyncio.sleep(5)
            
            status_url = f"{self.BASE_URL}/actor-runs/{run_id}"
            status_response = await self.client.get(
                status_url,
                params={"token": self.api_token}
            )
            
            if status_response.status_code != 200:
                print(f"Status check failed: {status_response.status_code}")
                continue
            
            status_data = status_response.json()
            status = status_data.get("data", {}).get("status")
            print(f"Run status: {status} (attempt {attempt + 1}/36)")
            
            if status == "SUCCEEDED":
                dataset_id = status_data.get("data", {}).get("defaultDatasetId")
                if dataset_id:
                    return await self._get_dataset_items(dataset_id, limit)
                break
            elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                print(f"Run finished with status: {status}")
                break
        
        return []
    
    async def _get_dataset_items(self, dataset_id: str, limit: int) -> List[MetaAd]:
        """Fetch items from a completed dataset."""
        items_url = f"{self.BASE_URL}/datasets/{dataset_id}/items"
        
        response = await self.client.get(
            items_url,
            params={"token": self.api_token, "limit": limit}
        )
        
        if response.status_code != 200:
            print(f"Failed to get dataset items: {response.status_code}")
            return []
        
        data = response.json()
        print(f"Dataset contains {len(data) if isinstance(data, list) else '?'} items")
        
        if isinstance(data, list):
            return self._parse_apify_response(data, limit)
        return []

    async def search_ads(self, keyword: str, limit: int = 10, country: str = "US") -> List[MetaAd]:
        """
        Search for ads by keyword (wrapper for url-based search).
        
        Args:
            keyword: Search keyword
            limit: Maximum number of ads to return
            country: Country code for ad search
            
        Returns:
            List of MetaAd objects
        """
        url = self.build_ads_library_url(keyword, country)
        return await self.search_ads_by_url(url, limit)
    
    async def search_ads_by_url(self, ads_library_url: str, limit: int = 10) -> List[MetaAd]:
        """
        Scrape ads directly from a Meta Ads Library URL.
        
        Args:
            ads_library_url: Full Facebook Ads Library URL
            limit: Maximum number of ads to return
            
        Returns:
            List of MetaAd objects
        """
        if not self.api_token:
            print("No APIFY_API_TOKEN found, cannot fetch real ads")
            return []
        
        try:
            # First try sync method (faster for small requests)
            ads = await self._run_sync(ads_library_url, limit)
            if ads:
                return ads
            
            # Fall back to async method
            return await self._run_async(ads_library_url, limit)
            
        except Exception as e:
            print(f"Error calling Apify: {e}")
            import traceback
            traceback.print_exc()
            return []

    def build_ads_library_url(
        self,
        keyword: str,
        country: str = "ALL",
        active_status: str = "active",
        ad_type: str = "all",
        media_type: str = "all"
    ) -> str:
        """
        Build a Meta Ads Library URL from parameters.
        Matches the exact format user found successful.
        """
        base = "https://www.facebook.com/ads/library/"
        params = {
            "active_status": active_status.lower(),  # User specifically asked for this
            "ad_type": ad_type,
            "country": country,
            "is_targeted_country": "false",
            "media_type": media_type,
            "q": keyword,
            "search_type": "keyword_unordered"
        }
        return f"{base}?{urlencode(params)}"
    
    def _parse_apify_response(self, data: list, limit: int) -> List[MetaAd]:
        """Parse Apify response into MetaAd objects with deduplication."""
        ads = []
        seen_content_hashes = set()
        
        # Print first item structure for debugging
        if data and len(data) > 0:
            print(f"Sample item keys: {list(data[0].keys())[:15]}")
        
        for item in data:
            if len(ads) >= limit:
                break
                
            try:
                ad = self._extract_ad_from_item(item)
                if not ad:
                    continue
                
                # Deduplication logic: content based hash
                # We ignore ad_id because sometimes scraping returns same ad with different internal IDs
                # We use (advertiser + first 100 chars of text) as uniqueness constraint
                content_hash = hash(f"{ad.advertiser_name}:{ad.text[:100]}")
                
                if content_hash not in seen_content_hashes:
                    seen_content_hashes.add(content_hash)
                    ads.append(ad)
                
            except Exception as e:
                print(f"Error parsing ad item: {e}")
                continue
        
        print(f"Parsed {len(ads)} unique ads from Apify response (deduplicated from {len(data)})")
        return ads
    
    def _extract_ad_from_item(self, item: dict) -> Optional[MetaAd]:
        """
        Extract a MetaAd from an Apify result item.
        
        The structure from the Premium scraper is:
        {
            "metadata": {...},
            "ad_content": { ... },
            "images": [ ... ]
            ...
        }
        """
        try:
            # Extract sections
            ad_content = item.get("ad_content", {})
            status = item.get("status", {})
            timing = item.get("timing", {})
            metadata = item.get("metadata", {})
            images = item.get("images", [])
            
            # --- EXTRACT TEXT ---
            
            # Get ad text from various locations
            ad_text = ""
            
            # Primary: body field in ad_content
            if ad_content.get("body"):
                ad_text = ad_content["body"]
            
            # Try title if no body
            if not ad_text and ad_content.get("title"):
                ad_text = ad_content["title"]
            
            # Try creative cards (for carousel ads)
            if not ad_text:
                creative = ad_content.get("creative", {})
                cards = creative.get("cards", [])
                if cards:
                    card_texts = []
                    for card in cards[:3]:  # Take first 3 cards
                        card_body = card.get("body", "").strip()
                        card_title = card.get("title", "").strip()
                        if card_body and card_body != " ":
                            card_texts.append(card_body)
                        elif card_title:
                            card_texts.append(card_title)
                    if card_texts:
                        ad_text = " | ".join(card_texts)
            
            # Try link description
            if not ad_text and ad_content.get("link_description"):
                ad_text = ad_content["link_description"]
            
            # Build a combined text if we have title + body
            if ad_content.get("title") and ad_content.get("body"):
                ad_text = f"{ad_content['title']}\n\n{ad_content['body']}"
            
            # If still no text, use page name + CTA as fallback
            if not ad_text or ad_text.strip() == " ":
                cta_text = ad_content.get("cta_text", "")
                page_name = ad_content.get("current_page_name", "") or metadata.get("page_name", "")
                if page_name and cta_text:
                    ad_text = f"{page_name} - {cta_text}"
                elif page_name:
                    ad_text = f"Ad by {page_name}"
            
            # Clean up whitespace
            ad_text = (ad_text or "").strip()
            
            if not ad_text or len(ad_text) < 5:
                return None
            
            # --- EXTRACT ADVERTISER ---
            
            target_advertiser = (
                metadata.get("page_name") or
                ad_content.get("current_page_name") or
                status.get("page_name") or
                ad_content.get("title") or
                "Unknown Advertiser"
            )
            
            # --- EXTRACT ID ---
            
            ad_id = str(
                status.get("collation_id") or
                status.get("ad_id") or
                metadata.get("ad_archive_id") or
                f"apify_{hash(ad_text) % 1000000}"
            )
            
            # --- EXTRACT DATE ---
            
            start_date_raw = timing.get("start_date")
            start_date = None
            if isinstance(start_date_raw, int):
                from datetime import datetime
                try:
                    start_date = datetime.fromtimestamp(start_date_raw).strftime("%Y-%m-%d")
                except:
                    pass
            elif isinstance(start_date_raw, str):
                start_date = start_date_raw.split("T")[0] if "T" in start_date_raw else start_date_raw
            
            # --- EXTRACT IMAGE ---
            
            image_url = None
            
            # 1. Check top-level images list
            if images and len(images) > 0:
                image_url = images[0].get("resized_image_url") or images[0].get("original_image_url")
            
            # 2. Check ad_content.creative.images (common location)
            if not image_url:
                creative = ad_content.get("creative", {})
                creative_images = creative.get("images", [])
                if creative_images and len(creative_images) > 0:
                    image_url = creative_images[0].get("resized_image_url") or creative_images[0].get("original_image_url")
            
            # 3. Check cards for image (carousel ads)
            if not image_url:
                creative = ad_content.get("creative", {})
                cards = creative.get("cards", [])
                if cards and len(cards) > 0:
                    card_images = cards[0].get("images", [])
                    if card_images and len(card_images) > 0:
                        image_url = card_images[0].get("resized_image_url") or card_images[0].get("original_image_url")
            
            # 4. Check ad_content.images directly
            if not image_url and ad_content.get("images"):
                content_images = ad_content.get("images", [])
                if content_images:
                    image_url = content_images[0].get("resized_image_url") or content_images[0].get("original_image_url")
            
            # 5. Check snapshot.images (alternative structure)
            if not image_url:
                snapshot = item.get("snapshot", {})
                snapshot_images = snapshot.get("images", [])
                if snapshot_images and len(snapshot_images) > 0:
                    image_url = snapshot_images[0].get("resized_image_url") or snapshot_images[0].get("original_image_url")
            
            # --- EXTRACT LANDING PAGE URL ---
            
            landing_page_url = None
            
            # Primary: snapshot.link_url (destination URL when clicking ad)
            snapshot = item.get("snapshot", {})
            if snapshot.get("link_url"):
                landing_page_url = snapshot["link_url"]
            
            # Alternative locations for link URL
            if not landing_page_url and ad_content.get("link_url"):
                landing_page_url = ad_content["link_url"]
            
            if not landing_page_url:
                creative = ad_content.get("creative", {})
                if creative.get("link_url"):
                    landing_page_url = creative["link_url"]
                # Check cards for links (carousel ads)
                elif creative.get("cards"):
                    for card in creative["cards"]:
                        if card.get("link_url"):
                            landing_page_url = card["link_url"]
                            break
            
            # Also check for cta_link (call to action link)
            if not landing_page_url and ad_content.get("cta_link"):
                landing_page_url = ad_content["cta_link"]
            
            # --- COLLECT ALL THUMBNAIL/IMAGE URLS ---
            
            all_thumbnails = []
            
            # Collect from all sources
            for img_source in [
                images,
                ad_content.get("creative", {}).get("images", []),
                snapshot.get("images", []),
                ad_content.get("images", [])
            ]:
                if img_source:
                    for img in img_source:
                        url = img.get("resized_image_url") or img.get("original_image_url")
                        if url and url not in all_thumbnails:
                            all_thumbnails.append(url)
            
            # Check cards for additional images (carousel ads)
            creative = ad_content.get("creative", {})
            for card in creative.get("cards", []):
                for img in card.get("images", []):
                    url = img.get("resized_image_url") or img.get("original_image_url")
                    if url and url not in all_thumbnails:
                        all_thumbnails.append(url)
            
            # --- EXTRACT VIDEO URL ---
            
            video_url = None
            
            # Check for video in various locations
            videos = item.get("videos", [])
            if videos and len(videos) > 0:
                video_url = videos[0].get("video_url") or videos[0].get("video_sd_url") or videos[0].get("video_hd_url")
            
            if not video_url:
                creative_videos = creative.get("videos", [])
                if creative_videos:
                    video_url = creative_videos[0].get("video_url") or creative_videos[0].get("video_sd_url")
            
            if not video_url:
                snapshot_videos = snapshot.get("videos", [])
                if snapshot_videos:
                    video_url = snapshot_videos[0].get("video_url") or snapshot_videos[0].get("video_sd_url")
            
            # --- FINAL OBJECT ---
            
            # Check if active
            is_active = status.get("is_active", True)
            
            return MetaAd(
                ad_id=ad_id,
                text=ad_text[:1500].strip(),
                advertiser_name=str(target_advertiser)[:100] if target_advertiser else "Unknown Advertiser",
                is_active=is_active,
                start_date=start_date,
                image_url=image_url,
                landing_page_url=landing_page_url,
                thumbnail_urls=all_thumbnails if all_thumbnails else None,
                video_url=video_url
            )
            
        except Exception as e:
            print(f"Error extracting ad: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Convenience functions
async def fetch_real_ads_via_apify(keyword: str, limit: int = 10) -> List[MetaAd]:
    """Fetch real ads from Meta Ads Library using Apify (keyword-based)."""
    client = ApifyAdsClient()
    try:
        return await client.search_ads(keyword, limit)
    finally:
        await client.close()


async def fetch_ads_from_url(ads_library_url: str, limit: int = 10) -> List[MetaAd]:
    """
    Fetch real ads from a specific Meta Ads Library URL.
    
    Example URL:
    https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=free&search_type=keyword_unordered
    """
    client = ApifyAdsClient()
    try:
        return await client.search_ads_by_url(ads_library_url, limit)
    finally:
        await client.close()
