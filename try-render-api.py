#!/usr/bin/env python3
"""
Render API Direct Access Script
This script attempts to use the Render API to access database services.
"""

import requests
import json
import os
import sys
from urllib.parse import urlparse

def print_header(text):
    print(f"\n[*] {text}")
    print("=" * (len(text) + 4))

def main():
    print_header("Render API Database Migration Attempt")
    
    # The migration SQL we need to execute
    migration_sql = """
    ALTER TABLE "colibrrri_subscriptions" 
    ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS "recurringToken" TEXT,
    ADD COLUMN IF NOT EXISTS "recurringMode" TEXT,
    ADD COLUMN IF NOT EXISTS "nextPaymentDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "lastPaymentDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "failedPaymentAttempts" INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "maxFailedAttempts" INTEGER DEFAULT 3;
    """
    
    print("Migration SQL to execute:")
    print(migration_sql.strip())
    
    print_header("Method 1: Check Environment for API Key")
    
    # Check for Render API key in environment
    render_api_key = os.environ.get('RENDER_API_KEY')
    if render_api_key:
        print("[+] Found RENDER_API_KEY in environment")
        try:
            # Try to list services
            headers = {
                'Authorization': f'Bearer {render_api_key}',
                'Content-Type': 'application/json'
            }
            
            print("[*] Listing Render services...")
            response = requests.get('https://api.render.com/v1/services', headers=headers)
            
            if response.status_code == 200:
                services = response.json()
                print(f"[+] Found {len(services)} services")
                
                # Look for databases
                databases = [s for s in services if s.get('type') == 'postgresql']
                print(f"[+] Found {len(databases)} PostgreSQL databases")
                
                for db in databases:
                    print(f"  - {db.get('name')} ({db.get('id')})")
                    
            else:
                print(f"[-] API request failed: {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"[-] Error calling Render API: {e}")
    else:
        print("[!] No RENDER_API_KEY found in environment")
    
    print_header("Method 2: Try MCP Server Direct Connection")
    
    # Since MCP is working, try to make a direct request to the MCP server
    mcp_url = "https://mcp.render.com/mcp"
    
    try:
        print("[*] Testing MCP server connection...")
        response = requests.get(mcp_url, timeout=10)
        print(f"MCP server response: {response.status_code}")
        
        if response.status_code == 200:
            print("[+] MCP server is accessible")
            print("[*] Response preview:", response.text[:200] + "..." if len(response.text) > 200 else response.text)
        else:
            print(f"[-] MCP server returned {response.status_code}")
            
    except Exception as e:
        print(f"[-] Error connecting to MCP server: {e}")
    
    print_header("Method 3: Manual Instructions")
    
    print("Since automated methods require additional setup, please follow these steps:")
    print()
    print("IMMEDIATE ACTION REQUIRED:")
    print("1. Go to https://dashboard.render.com")
    print("2. Find your PostgreSQL database (look for 'colibrrri-db', 'vheer-db', or similar)")
    print("3. Click on the database name")
    print("4. Look for 'Query' or 'SQL Console' tab")
    print("5. Execute this exact SQL:")
    print()
    print("```sql")
    print(migration_sql.strip())
    print("```")
    print()
    print("6. Verify the migration by running:")
    print("   SELECT column_name FROM information_schema.columns")
    print("   WHERE table_name = 'colibrrri_subscriptions'")
    print("   AND column_name LIKE '%recurring%' OR column_name LIKE '%Payment%' OR column_name LIKE '%failed%';")
    print()
    print("ALTERNATIVE - Get DATABASE_URL:")
    print("1. In your database dashboard, go to 'Connect' tab")
    print("2. Copy the 'External Database URL'")
    print("3. Run: node execute-migration-now.js \"PASTE_DATABASE_URL_HERE\"")
    
    print_header("Critical Impact")
    print("[!] This migration is URGENT because:")
    print("- Production site is returning 500 errors")
    print("- Payment callbacks are failing without these columns")  
    print("- Users cannot complete subscriptions")
    print("- Revenue is being lost")
    
    return False

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)