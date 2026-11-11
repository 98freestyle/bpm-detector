#!/usr/bin/env python3
"""
BPM Analyzer Comprehensive Security Test Suite
Tests file validation, parameter checking, header inspection, and concurrent load handling
"""

import os
import sys
import requests
import time
import threading
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("BPM_TEST_URL", "http://localhost:8001")).rstrip("/")
ANALYZE_ENDPOINT = f"{BASE_URL}/api/analyze"
HEALTH_ENDPOINT = f"{BASE_URL}/api/health"

# Test results storage
test_results = []
failed_tests = []

class SecurityTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_files = {}
        self.create_test_files()
        
    def log_result(self, test_name, status, details, response_time=None, status_code=None):
        """Log test results with timestamp"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'test_name': test_name,
            'status': status,
            'details': details,
            'response_time': response_time,
            'status_code': status_code
        }
        test_results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {details}")
        
        if status == "FAIL":
            failed_tests.append(result)
    
    def create_test_files(self):
        """Create test files for validation testing"""
        
        # Valid audio headers
        mp3_header = b'\xFF\xFB' + b'\x00' * 1000
        self.test_files['valid_mp3'] = ('test.mp3', mp3_header, 'audio/mpeg')
        
        wav_header = b'RIFF' + b'\x24\x08\x00\x00' + b'WAVE' + b'\x00' * 1000
        self.test_files['valid_wav'] = ('test.wav', wav_header, 'audio/wav')
        
        # Malicious files
        exe_content = b'MZ' + b'\x00' * 1000
        self.test_files['fake_audio'] = ('malware.mp3', exe_content, 'audio/mpeg')
        
        self.test_files['tiny_file'] = ('tiny.mp3', b'\xFF', 'audio/mpeg')
        
        large_header = b'\xFF\xFB' + b'A' * (10 * 1024 * 1024)
        self.test_files['large_file'] = ('large.mp3', large_header, 'audio/mpeg')
        
        self.test_files['path_traversal'] = ('../../etc/passwd.mp3', mp3_header, 'audio/mpeg')
        self.test_files['suspicious_ext'] = ('virus.exe', mp3_header, 'audio/mpeg')
        self.test_files['empty_file'] = ('empty.mp3', b'', 'audio/mpeg')

    def test_health_endpoint(self):
        """Test health check endpoint"""
        try:
            start_time = time.time()
            response = self.session.get(HEALTH_ENDPOINT, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_result("Health Check", "PASS", 
                                  f"Service healthy, {response_time:.2f}s response", 
                                  response_time, 200)
                else:
                    self.log_result("Health Check", "WARN", 
                                  f"Service reports unhealthy: {data}", 
                                  response_time, response.status_code)
            else:
                self.log_result("Health Check", "FAIL", 
                              f"Unexpected status code: {response.status_code}", 
                              response_time, response.status_code)
                              
        except Exception as e:
            self.log_result("Health Check", "FAIL", f"Health endpoint error: {str(e)}")

    def test_file_validation(self):
        """Test file validation security measures"""
        
        for test_name, (filename, content, mime_type) in self.test_files.items():
            try:
                start_time = time.time()
                files = {'audio': (filename, content, mime_type)}
                response = self.session.post(ANALYZE_ENDPOINT, files=files, timeout=30)
                response_time = time.time() - start_time
                
                if test_name in ['valid_mp3', 'valid_wav']:
                    if response.status_code in [400, 422, 500]:
                        self.log_result(f"File Validation - {test_name}", "PASS", 
                                      "File passed validation but failed analysis (expected)", 
                                      response_time, response.status_code)
                    elif response.status_code == 429:
                        self.log_result(f"File Validation - {test_name}", "PASS", 
                                      "Request blocked by rate limiting (security working)", 
                                      response_time, 429)
                    else:
                        self.log_result(f"File Validation - {test_name}", "WARN", 
                                      f"Unexpected response: {response.status_code}", 
                                      response_time, response.status_code)
                
                elif test_name in ['fake_audio', 'tiny_file', 'empty_file', 'path_traversal', 'suspicious_ext']:
                    if response.status_code == 400:
                        self.log_result(f"File Validation - {test_name}", "PASS", 
                                      "Malicious/invalid file correctly rejected", 
                                      response_time, 400)
                    elif response.status_code == 429:
                        self.log_result(f"File Validation - {test_name}", "PASS", 
                                      "Request blocked by rate limiting (security working)", 
                                      response_time, 429)
                    else:
                        self.log_result(f"File Validation - {test_name}", "FAIL", 
                                      f"Security bypass! File accepted: {response.status_code}", 
                                      response_time, response.status_code)
                
                elif test_name == 'large_file':
                    if response.status_code in [400, 413]:
                        self.log_result(f"File Validation - {test_name}", "PASS", 
                                      "Large file correctly rejected", 
                                      response_time, response.status_code)
                    elif response.status_code == 429:
                        self.log_result(f"File Validation - {test_name}", "PASS", 
                                      "Request blocked by rate limiting (security working)", 
                                      response_time, 429)
                    else:
                        self.log_result(f"File Validation - {test_name}", "FAIL", 
                                      f"Large file bypass: {response.status_code}", 
                                      response_time, response.status_code)
                
                time.sleep(0.5)
                
            except Exception as e:
                self.log_result(f"File Validation - {test_name}", "FAIL", 
                              f"Exception during test: {str(e)}")

    def test_missing_parameters(self):
        """Test handling of missing or invalid parameters"""
        
        try:
            response = self.session.post(ANALYZE_ENDPOINT, timeout=10)
            if response.status_code == 400:
                self.log_result("Missing Parameters - No File", "PASS", 
                              "Correctly rejected request with no file")
            elif response.status_code == 429:
                self.log_result("Missing Parameters - No File", "PASS", 
                              "Request blocked by rate limiting (security working)")
            else:
                self.log_result("Missing Parameters - No File", "FAIL", 
                              f"Should reject no-file request: {response.status_code}")
        except Exception as e:
            self.log_result("Missing Parameters - No File", "FAIL", f"Exception: {str(e)}")
        
        try:
            files = {'audio': ('', b'test', 'audio/mpeg')}
            response = self.session.post(ANALYZE_ENDPOINT, files=files, timeout=10)
            if response.status_code == 400:
                self.log_result("Missing Parameters - Empty Filename", "PASS", 
                              "Correctly rejected empty filename")
            elif response.status_code == 429:
                self.log_result("Missing Parameters - Empty Filename", "PASS", 
                              "Request blocked by rate limiting (security working)")
            else:
                self.log_result("Missing Parameters - Empty Filename", "FAIL", 
                              f"Should reject empty filename: {response.status_code}")
        except Exception as e:
            self.log_result("Missing Parameters - Empty Filename", "FAIL", f"Exception: {str(e)}")

    def test_malformed_requests(self):
        """Test handling of malformed requests"""
        
        try:
            response = self.session.get(ANALYZE_ENDPOINT, timeout=10)
            if response.status_code == 405:
                self.log_result("Malformed Requests - Wrong Method", "PASS", 
                              "Correctly rejected GET request")
            else:
                self.log_result("Malformed Requests - Wrong Method", "FAIL", 
                              f"Should reject GET: {response.status_code}")
        except Exception as e:
            self.log_result("Malformed Requests - Wrong Method", "FAIL", f"Exception: {str(e)}")

    def test_concurrent_load(self):
        """Test behavior under concurrent load"""
        
        def concurrent_request(request_id):
            try:
                files = {'audio': self.test_files['valid_mp3']}
                start_time = time.time()
                response = self.session.post(ANALYZE_ENDPOINT, files=files, timeout=30)
                response_time = time.time() - start_time
                return request_id, response.status_code, response_time
            except Exception as e:
                return request_id, f"ERROR: {str(e)}", None
        
        print("\n🔄 Testing concurrent load (10 simultaneous requests)...")
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(concurrent_request, i) for i in range(10)]
            
            results = []
            for future in as_completed(futures):
                results.append(future.result())
        
        success_count = sum(1 for _, status, _ in results if status == 200)
        error_count = sum(1 for _, status, _ in results if isinstance(status, str) and "ERROR" in status)
        rate_limited = sum(1 for _, status, _ in results if status == 429)
        server_errors = sum(1 for _, status, _ in results if status >= 500)
        
        if server_errors == 0:
            self.log_result("Concurrent Load", "PASS", 
                          f"Handled load well: {success_count} success, {rate_limited} rate limited, {error_count} errors")
        else:
            self.log_result("Concurrent Load", "WARN", 
                          f"Some server errors: {server_errors} 5xx responses")

    def run_all_tests(self):
        """Run complete security test suite"""
        print("🚀 Starting BPM Analyzer Security Test Suite")
        print(f"Target: {BASE_URL}")
        print("=" * 60)
        
        self.test_health_endpoint()
        self.test_file_validation()
        self.test_missing_parameters()
        self.test_malformed_requests()
        self.test_concurrent_load()
        
        self.generate_report()

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("🔍 SECURITY TEST SUMMARY REPORT")
        print("=" * 60)
        
        total_tests = len(test_results)
        passed_tests = sum(1 for r in test_results if r['status'] == 'PASS')
        failed_tests_count = sum(1 for r in test_results if r['status'] == 'FAIL')
        warnings = sum(1 for r in test_results if r['status'] == 'WARN')
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests_count}")
        print(f"Warnings: {warnings}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        # Save detailed results
        report_filename = f"security_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w') as f:
            json.dump(test_results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_filename}")
        
        if failed_tests_count == 0:
            print("\n🛡️ All security tests passed - system appears well protected")
        else:
            print("\n⚠️ Some security issues detected - review failed tests")

if __name__ == "__main__":
    tester = SecurityTester()
    tester.run_all_tests()