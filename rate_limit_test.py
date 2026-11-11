#!/usr/bin/env python3
"""
Focused Rate Limiting Test for BPM Analyzer
Tests rate limiting with proper headers
"""

import os
import sys
import requests
import time
from datetime import datetime

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("BPM_TEST_URL", "http://localhost:8001")).rstrip("/")
ANALYZE_ENDPOINT = f"{BASE_URL}/api/analyze"

def create_test_file():
    """Create minimal valid MP3 header for testing"""
    mp3_header = b'\xFF\xFB' + b'\x00' * 1000
    return ('test.mp3', mp3_header, 'audio/mpeg')

def test_rate_limiting():
    """Test rate limiting with proper headers"""
    
    print("🔄 Testing Rate Limiting (with proper headers)")
    print(f"Target: {ANALYZE_ENDPOINT}")
    print("=" * 50)
    
    # Use proper session with headers
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    test_file = create_test_file()
    results = []
    
    # Send 8 requests (should hit the rate limit)
    for i in range(8):
        try:
            start_time = time.time()
            files = {'audio': test_file}
            
            print(f"Request {i+1}...", end=" ")
            response = session.post(ANALYZE_ENDPOINT, files=files, timeout=10)
            response_time = time.time() - start_time
            
            result = {
                'request': i+1,
                'status_code': response.status_code,
                'response_time': f"{response_time:.2f}s",
                'timestamp': datetime.now().strftime('%H:%M:%S')
            }
            
            if response.status_code == 429:
                print(f"❌ RATE LIMITED (429) - {response_time:.2f}s")
                result['result'] = 'RATE_LIMITED'
            elif response.status_code == 400:
                print(f"⚠️  VALIDATION ERROR (400) - {response_time:.2f}s") 
                result['result'] = 'VALIDATION_ERROR'
            elif response.status_code == 200:
                print(f"✅ SUCCESS (200) - {response_time:.2f}s")
                result['result'] = 'SUCCESS'
            else:
                print(f"❓ OTHER ({response.status_code}) - {response_time:.2f}s")
                result['result'] = f'OTHER_{response.status_code}'
                
            results.append(result)
            
            # Brief pause between requests
            time.sleep(0.5)
            
        except Exception as e:
            print(f"💥 ERROR: {str(e)}")
            results.append({
                'request': i+1,
                'result': 'ERROR',
                'error': str(e),
                'timestamp': datetime.now().strftime('%H:%M:%S')
            })
    
    # Analyze results
    print("\n" + "=" * 50)
    print("📊 RATE LIMITING TEST RESULTS")
    print("=" * 50)
    
    rate_limited_count = sum(1 for r in results if r.get('result') == 'RATE_LIMITED')
    success_count = sum(1 for r in results if r.get('result') == 'SUCCESS') 
    validation_errors = sum(1 for r in results if r.get('result') == 'VALIDATION_ERROR')
    
    print(f"Total Requests: {len(results)}")
    print(f"Rate Limited (429): {rate_limited_count}")
    print(f"Successful (200): {success_count}")
    print(f"Validation Errors (400): {validation_errors}")
    
    if rate_limited_count > 0:
        print(f"\n✅ RATE LIMITING WORKING: {rate_limited_count} requests blocked")
        print("✅ Your backend rate limiting is functioning correctly!")
    elif validation_errors > 0:
        print(f"\n⚠️  VALIDATION BLOCKING: All requests hit validation errors")
        print("⚠️  Rate limiting not tested - validation rejected requests first")
    elif success_count == len(results):
        print(f"\n❌ RATE LIMITING NOT WORKING: All {success_count} requests succeeded")
        print("❌ Rate limits may be set too high or not functioning")
    else:
        print(f"\n❓ MIXED RESULTS: Need to investigate individual responses")
    
    # Detailed breakdown
    print(f"\n📋 Request Details:")
    for r in results:
        print(f"  {r['request']:2d}. {r['timestamp']} - {r.get('status_code', 'ERR'):3} - {r['result']}")

if __name__ == "__main__":
    print("⚠️  Make sure you've temporarily lowered rate limits in backend/app.py!")
    print("⚠️  The test sends 8 requests and expects some to be rate limited")
    input("Press Enter to continue...")
    
    test_rate_limiting()
    
    print(f"\n🔧 Don't forget to restore your rate limits after testing!")
    print("🔧 Restart backend with: sudo systemctl restart bpm-analyzer")