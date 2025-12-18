"""Landing Page Crawler for Ad Analysis

Crawls landing page URLs from ads to extract text content,
providing judges with full context about where the ad leads.
"""
import asyncio
import httpx
from typing import Optional, Tuple
from bs4 import BeautifulSoup
import re


# Maximum content length to extract (to avoid huge pages overwhelming the model)
MAX_CONTENT_LENGTH = 3000

# Timeout for landing page requests
CRAWL_TIMEOUT = 15.0

# User agent to avoid bot detection
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


async def crawl_landing_page(url: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Crawl a landing page URL and extract text content.
    
    Args:
        url: The landing page URL to crawl
        
    Returns:
        Tuple of (extracted_content, error_message)
        - If successful: (content_text, None)
        - If failed: (None, error_description)
    """
    if not url:
        return None, "No URL provided"
    
    # Skip certain URL patterns that won't yield useful content
    skip_patterns = [
        r"^javascript:",
        r"^mailto:",
        r"^tel:",
        r"^#",
        r"\.pdf$",
        r"\.zip$",
        r"\.exe$",
        r"play\.google\.com/store",  # App store links
        r"apps\.apple\.com",  # iOS app links
    ]
    
    for pattern in skip_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return None, f"Skipped URL type: {pattern}"
    
    try:
        async with httpx.AsyncClient(
            timeout=CRAWL_TIMEOUT,
            follow_redirects=True,
            verify=False  # Some landing pages have SSL issues
        ) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                }
            )
            
            # Check for successful response
            if response.status_code != 200:
                return None, f"HTTP {response.status_code}"
            
            # Check content type
            content_type = response.headers.get("content-type", "")
            if "text/html" not in content_type.lower():
                return None, f"Non-HTML content: {content_type}"
            
            # Parse HTML
            html_content = response.text
            extracted = extract_text_from_html(html_content)
            
            if extracted and len(extracted.strip()) > 50:
                return extracted[:MAX_CONTENT_LENGTH], None
            else:
                return None, "No meaningful content extracted"
                
    except httpx.TimeoutException:
        return None, "Timeout"
    except httpx.ConnectError:
        return None, "Connection failed"
    except Exception as e:
        return None, f"Error: {str(e)[:100]}"


def extract_text_from_html(html: str) -> str:
    """
    Extract meaningful text content from HTML.
    Focuses on key elements that indicate the page's purpose.
    """
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove script, style, and other non-content elements
    for element in soup(["script", "style", "meta", "link", "noscript", "iframe", "svg"]):
        element.decompose()
    
    extracted_parts = []
    
    # 1. Page title
    title = soup.find("title")
    if title and title.get_text(strip=True):
        extracted_parts.append(f"Page Title: {title.get_text(strip=True)}")
    
    # 2. Meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        extracted_parts.append(f"Description: {meta_desc['content']}")
    
    # 3. OG title and description
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        extracted_parts.append(f"OG Title: {og_title['content']}")
    
    og_desc = soup.find("meta", property="og:description")
    if og_desc and og_desc.get("content"):
        extracted_parts.append(f"OG Description: {og_desc['content']}")
    
    # 4. Main headings (H1, H2)
    headings = []
    for h1 in soup.find_all("h1", limit=3):
        text = h1.get_text(strip=True)
        if text and len(text) > 5:
            headings.append(text)
    for h2 in soup.find_all("h2", limit=5):
        text = h2.get_text(strip=True)
        if text and len(text) > 5:
            headings.append(text)
    
    if headings:
        extracted_parts.append(f"Headings: {' | '.join(headings[:5])}")
    
    # 5. Main content areas (common containers)
    main_content = ""
    for selector in ["main", "article", "[role='main']", ".content", "#content", ".main"]:
        element = soup.select_one(selector)
        if element:
            main_content = element.get_text(separator=" ", strip=True)
            if len(main_content) > 100:
                break
    
    if not main_content or len(main_content) < 100:
        # Fallback to body text
        body = soup.find("body")
        if body:
            main_content = body.get_text(separator=" ", strip=True)
    
    # Clean up the main content
    if main_content:
        # Remove excessive whitespace
        main_content = re.sub(r'\s+', ' ', main_content)
        # Truncate to reasonable length
        main_content = main_content[:2000]
        extracted_parts.append(f"Page Content: {main_content}")
    
    # 6. Look for key scam indicators
    scam_indicators = []
    
    # Check for forms asking for sensitive data
    forms = soup.find_all("form")
    if forms:
        for form in forms:
            # Check for password, SSN, credit card, bank fields
            suspicious_inputs = form.find_all("input", {"type": ["password", "hidden"]})
            text_inputs = form.find_all("input", {"type": ["text", "email", "tel"]})
            if suspicious_inputs or len(text_inputs) > 3:
                scam_indicators.append("Form collecting personal data detected")
                break
    
    # Check for countdown timers
    timer_patterns = [
        r"timer",
        r"countdown",
        r"expires?\s+in",
        r"limited\s+time",
        r"act\s+now",
    ]
    page_text = soup.get_text().lower()
    for pattern in timer_patterns:
        if re.search(pattern, page_text):
            scam_indicators.append(f"Urgency element detected: {pattern}")
            break
    
    if scam_indicators:
        extracted_parts.append(f"Warning Signs: {'; '.join(scam_indicators)}")
    
    return "\n".join(extracted_parts)


async def crawl_multiple_pages(urls: list[str]) -> dict[str, Tuple[Optional[str], Optional[str]]]:
    """
    Crawl multiple landing pages concurrently.
    
    Args:
        urls: List of URLs to crawl
        
    Returns:
        Dict mapping URL to (content, error) tuple
    """
    async def crawl_with_key(url: str):
        content, error = await crawl_landing_page(url)
        return url, content, error
    
    results = {}
    tasks = [crawl_with_key(url) for url in urls if url]
    
    if not tasks:
        return results
    
    # Run all crawls concurrently with a semaphore to limit concurrency
    semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests
    
    async def limited_crawl(url):
        async with semaphore:
            return await crawl_with_key(url)
    
    crawl_results = await asyncio.gather(
        *[limited_crawl(url) for url in urls if url],
        return_exceptions=True
    )
    
    for result in crawl_results:
        if isinstance(result, Exception):
            continue
        url, content, error = result
        results[url] = (content, error)
    
    return results


# Test function
if __name__ == "__main__":
    async def test():
        test_urls = [
            "https://example.com",
            "https://www.google.com",
        ]
        
        for url in test_urls:
            print(f"\n{'='*60}")
            print(f"Testing: {url}")
            print("="*60)
            content, error = await crawl_landing_page(url)
            if content:
                print(f"SUCCESS: {len(content)} chars extracted")
                print(content[:500] + "..." if len(content) > 500 else content)
            else:
                print(f"FAILED: {error}")
    
    asyncio.run(test())
