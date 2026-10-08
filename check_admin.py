import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text}"))
        
        async def handle_response(response):
            if "functions" in response.url or "supabase" in response.url:
                print(f"RESPONSE [{response.status}]: {response.url}")
                try:
                    text = await response.text()
                    print(f"BODY: {text[:200]}")
                except Exception as e:
                    pass

        page.on("response", handle_response)
        
        print("Navigating to http://localhost:8080/admin")
        await page.goto("http://localhost:8080/admin")
        
        # Wait a bit
        await page.wait_for_timeout(5000)
        
        await browser.close()

asyncio.run(run())
