from playwright.sync_api import sync_playwright
import os

def run():
    chrome_dir = '/Users/thierresavio/Library/Application Support/Google/Chrome'
    
    with sync_playwright() as p:
        try:
            # We must use launch_persistent_context to use a user data dir
            context = p.chromium.launch_persistent_context(
                user_data_dir=chrome_dir,
                channel="chrome",
                headless=True,
            )
            
            page = context.pages[0] if context.pages else context.new_page()
            
            def handle_console(msg):
                if "DEBUG_COA" in msg.text:
                    print(f"FOUND DEBUG: {msg.text}")
                    with open('/tmp/debug_coa.json', 'a') as f:
                        f.write(msg.text + "\n")
            
            page.on("console", handle_console)
            
            print("Navigating to localhost:8080/financeiro/plano-contas...")
            page.goto('http://localhost:8080/financeiro/plano-contas')
            page.wait_for_timeout(5000)
            
            print("Done waiting.")
            context.close()
        except Exception as e:
            print(f"Error: {e}")

run()
