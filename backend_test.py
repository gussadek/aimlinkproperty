#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Aimlink Properties
Tests all authentication, properties, leads, and dashboard APIs
"""

import requests
import json
import sys
from datetime import datetime
import base64

# Configuration
BASE_URL = "https://golden-homes-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@aimlinkproperties.com"
ADMIN_PASSWORD = "admin123"

# Test data
SAMPLE_PROPERTY = {
    "title": "Luxury Apartment in Beirut Central",
    "area": "Beirut",
    "location_detail": "Hamra District, near AUB",
    "price_usd": 450000.0,
    "property_type": "Apartment",
    "size_sqm": 120.0,
    "bedrooms": 3,
    "bathrooms": 2,
    "floor_level": "5th Floor",
    "view_type": "City View",
    "description": "Modern apartment with premium finishes and excellent location",
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="],
    "latitude": 33.8938,
    "longitude": 35.5018,
    "status": "active"
}

SAMPLE_LEAD = {
    "name": "Ahmad Khalil",
    "phone": "+9613123456",
    "message": "I'm interested in viewing this property. Please contact me to schedule a visit."
}

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_property_id = None
        self.test_lead_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name, success, message="", response=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if response and not success:
            print(f"   Status: {response.status_code}")
            try:
                print(f"   Response: {response.json()}")
            except:
                print(f"   Response: {response.text}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        print()

    def test_admin_login_valid(self):
        """Test admin login with valid credentials"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "email" in data:
                    self.admin_token = data["token"]
                    self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                    self.log_result("Admin Login (Valid)", True, f"Token received for {data['email']}")
                    return True
                else:
                    self.log_result("Admin Login (Valid)", False, "Missing token or email in response", response)
            else:
                self.log_result("Admin Login (Valid)", False, "Login failed", response)
        except Exception as e:
            self.log_result("Admin Login (Valid)", False, f"Exception: {str(e)}")
        return False

    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": "wrongpassword"
            })
            
            if response.status_code == 401:
                self.log_result("Admin Login (Invalid)", True, "Correctly rejected invalid credentials")
            else:
                self.log_result("Admin Login (Invalid)", False, "Should have returned 401", response)
        except Exception as e:
            self.log_result("Admin Login (Invalid)", False, f"Exception: {str(e)}")

    def test_get_properties_all(self):
        """Test getting all properties"""
        try:
            response = self.session.get(f"{BASE_URL}/properties")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get All Properties", True, f"Retrieved {len(data)} properties")
                    return data
                else:
                    self.log_result("Get All Properties", False, "Response is not a list", response)
            else:
                self.log_result("Get All Properties", False, "Failed to get properties", response)
        except Exception as e:
            self.log_result("Get All Properties", False, f"Exception: {str(e)}")
        return []

    def test_get_properties_filter_beirut(self):
        """Test filtering properties by Beirut area"""
        try:
            response = self.session.get(f"{BASE_URL}/properties?area=Beirut")
            
            if response.status_code == 200:
                data = response.json()
                beirut_count = len([p for p in data if p.get("area") == "Beirut"])
                self.log_result("Filter Properties (Beirut)", True, f"Found {beirut_count} properties in Beirut")
            else:
                self.log_result("Filter Properties (Beirut)", False, "Failed to filter properties", response)
        except Exception as e:
            self.log_result("Filter Properties (Beirut)", False, f"Exception: {str(e)}")

    def test_get_properties_filter_mount_lebanon(self):
        """Test filtering properties by Mount Lebanon area"""
        try:
            response = self.session.get(f"{BASE_URL}/properties?area=Mount%20Lebanon")
            
            if response.status_code == 200:
                data = response.json()
                ml_count = len([p for p in data if p.get("area") == "Mount Lebanon"])
                self.log_result("Filter Properties (Mount Lebanon)", True, f"Found {ml_count} properties in Mount Lebanon")
            else:
                self.log_result("Filter Properties (Mount Lebanon)", False, "Failed to filter properties", response)
        except Exception as e:
            self.log_result("Filter Properties (Mount Lebanon)", False, f"Exception: {str(e)}")

    def test_create_property_admin(self):
        """Test creating a property with admin token"""
        if not self.admin_token:
            self.log_result("Create Property (Admin)", False, "No admin token available")
            return
        
        try:
            response = self.session.post(f"{BASE_URL}/properties", json=SAMPLE_PROPERTY)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.test_property_id = data["id"]
                    self.log_result("Create Property (Admin)", True, f"Property created with ID: {data['id']}")
                    return data
                else:
                    self.log_result("Create Property (Admin)", False, "Missing ID in response", response)
            else:
                self.log_result("Create Property (Admin)", False, "Failed to create property", response)
        except Exception as e:
            self.log_result("Create Property (Admin)", False, f"Exception: {str(e)}")
        return None

    def test_create_property_no_auth(self):
        """Test creating a property without authentication"""
        try:
            # Temporarily remove auth header
            headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.post(f"{BASE_URL}/properties", json=SAMPLE_PROPERTY)
            
            # Restore headers
            self.session.headers = headers
            
            if response.status_code == 403 or response.status_code == 401:
                self.log_result("Create Property (No Auth)", True, "Correctly rejected unauthorized request")
            else:
                self.log_result("Create Property (No Auth)", False, "Should have rejected unauthorized request", response)
        except Exception as e:
            self.log_result("Create Property (No Auth)", False, f"Exception: {str(e)}")

    def test_get_single_property(self):
        """Test getting a single property by ID"""
        if not self.test_property_id:
            # Try to get any property ID from the list
            properties = self.test_get_properties_all()
            if properties:
                self.test_property_id = properties[0]["id"]
        
        if not self.test_property_id:
            self.log_result("Get Single Property", False, "No property ID available")
            return
        
        try:
            response = self.session.get(f"{BASE_URL}/properties/{self.test_property_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["id"] == self.test_property_id:
                    self.log_result("Get Single Property", True, f"Retrieved property: {data.get('title', 'Unknown')}")
                else:
                    self.log_result("Get Single Property", False, "Property ID mismatch", response)
            else:
                self.log_result("Get Single Property", False, "Failed to get property", response)
        except Exception as e:
            self.log_result("Get Single Property", False, f"Exception: {str(e)}")

    def test_get_property_invalid_id(self):
        """Test getting a property with invalid ID"""
        try:
            response = self.session.get(f"{BASE_URL}/properties/invalid_id")
            
            if response.status_code == 400:
                self.log_result("Get Property (Invalid ID)", True, "Correctly rejected invalid ID")
            else:
                self.log_result("Get Property (Invalid ID)", False, "Should have returned 400 for invalid ID", response)
        except Exception as e:
            self.log_result("Get Property (Invalid ID)", False, f"Exception: {str(e)}")

    def test_update_property_admin(self):
        """Test updating a property with admin token"""
        if not self.admin_token or not self.test_property_id:
            self.log_result("Update Property (Admin)", False, "No admin token or property ID available")
            return
        
        try:
            update_data = {
                "title": "Updated Luxury Apartment",
                "price_usd": 475000.0
            }
            response = self.session.put(f"{BASE_URL}/properties/{self.test_property_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("title") == "Updated Luxury Apartment":
                    self.log_result("Update Property (Admin)", True, "Property updated successfully")
                else:
                    self.log_result("Update Property (Admin)", False, "Property not updated correctly", response)
            else:
                self.log_result("Update Property (Admin)", False, "Failed to update property", response)
        except Exception as e:
            self.log_result("Update Property (Admin)", False, f"Exception: {str(e)}")

    def test_create_lead_public(self):
        """Test creating a lead (public endpoint)"""
        if not self.test_property_id:
            # Get any property ID
            properties = self.test_get_properties_all()
            if properties:
                self.test_property_id = properties[0]["id"]
        
        if not self.test_property_id:
            self.log_result("Create Lead (Public)", False, "No property ID available")
            return
        
        try:
            # Remove auth header for public endpoint
            headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            lead_data = SAMPLE_LEAD.copy()
            lead_data["property_id"] = self.test_property_id
            
            response = self.session.post(f"{BASE_URL}/leads", json=lead_data)
            
            # Restore headers
            self.session.headers = headers
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.test_lead_id = data["id"]
                    self.log_result("Create Lead (Public)", True, f"Lead created with ID: {data['id']}")
                else:
                    self.log_result("Create Lead (Public)", False, "Missing ID in response", response)
            else:
                self.log_result("Create Lead (Public)", False, "Failed to create lead", response)
        except Exception as e:
            self.log_result("Create Lead (Public)", False, f"Exception: {str(e)}")

    def test_get_leads_admin(self):
        """Test getting all leads (admin only)"""
        if not self.admin_token:
            self.log_result("Get Leads (Admin)", False, "No admin token available")
            return
        
        try:
            response = self.session.get(f"{BASE_URL}/leads")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Leads (Admin)", True, f"Retrieved {len(data)} leads")
                else:
                    self.log_result("Get Leads (Admin)", False, "Response is not a list", response)
            else:
                self.log_result("Get Leads (Admin)", False, "Failed to get leads", response)
        except Exception as e:
            self.log_result("Get Leads (Admin)", False, f"Exception: {str(e)}")

    def test_get_leads_no_auth(self):
        """Test getting leads without authentication"""
        try:
            # Remove auth header
            headers = self.session.headers.copy()
            if "Authorization" in self.session.headers:
                del self.session.headers["Authorization"]
            
            response = self.session.get(f"{BASE_URL}/leads")
            
            # Restore headers
            self.session.headers = headers
            
            if response.status_code == 403 or response.status_code == 401:
                self.log_result("Get Leads (No Auth)", True, "Correctly rejected unauthorized request")
            else:
                self.log_result("Get Leads (No Auth)", False, "Should have rejected unauthorized request", response)
        except Exception as e:
            self.log_result("Get Leads (No Auth)", False, f"Exception: {str(e)}")

    def test_filter_leads_pending(self):
        """Test filtering leads by pending status"""
        if not self.admin_token:
            self.log_result("Filter Leads (Pending)", False, "No admin token available")
            return
        
        try:
            response = self.session.get(f"{BASE_URL}/leads?status=pending")
            
            if response.status_code == 200:
                data = response.json()
                pending_count = len([l for l in data if l.get("status") == "pending"])
                self.log_result("Filter Leads (Pending)", True, f"Found {pending_count} pending leads")
            else:
                self.log_result("Filter Leads (Pending)", False, "Failed to filter leads", response)
        except Exception as e:
            self.log_result("Filter Leads (Pending)", False, f"Exception: {str(e)}")

    def test_update_lead_status(self):
        """Test updating lead status"""
        if not self.admin_token or not self.test_lead_id:
            self.log_result("Update Lead Status", False, "No admin token or lead ID available")
            return
        
        try:
            response = self.session.put(f"{BASE_URL}/leads/{self.test_lead_id}", json={
                "status": "contacted"
            })
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "contacted":
                    self.log_result("Update Lead Status", True, "Lead status updated successfully")
                else:
                    self.log_result("Update Lead Status", False, "Lead status not updated correctly", response)
            else:
                self.log_result("Update Lead Status", False, "Failed to update lead status", response)
        except Exception as e:
            self.log_result("Update Lead Status", False, f"Exception: {str(e)}")

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        if not self.admin_token:
            self.log_result("Dashboard Stats", False, "No admin token available")
            return
        
        try:
            response = self.session.get(f"{BASE_URL}/dashboard/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_properties", "active_properties", "draft_properties", 
                                 "sold_properties", "pending_leads", "total_leads"]
                
                if all(field in data for field in required_fields):
                    self.log_result("Dashboard Stats", True, f"Stats: {data}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_result("Dashboard Stats", False, f"Missing fields: {missing}", response)
            else:
                self.log_result("Dashboard Stats", False, "Failed to get dashboard stats", response)
        except Exception as e:
            self.log_result("Dashboard Stats", False, f"Exception: {str(e)}")

    def test_delete_property_admin(self):
        """Test deleting a property with admin token"""
        if not self.admin_token or not self.test_property_id:
            self.log_result("Delete Property (Admin)", False, "No admin token or property ID available")
            return
        
        try:
            response = self.session.delete(f"{BASE_URL}/properties/{self.test_property_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Delete Property (Admin)", True, "Property deleted successfully")
                else:
                    self.log_result("Delete Property (Admin)", False, "Missing success message", response)
            else:
                self.log_result("Delete Property (Admin)", False, "Failed to delete property", response)
        except Exception as e:
            self.log_result("Delete Property (Admin)", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Aimlink Properties Backend API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Authentication Tests
        print("🔐 AUTHENTICATION TESTS")
        self.test_admin_login_valid()
        self.test_admin_login_invalid()
        
        # Properties Tests
        print("🏠 PROPERTIES API TESTS")
        self.test_get_properties_all()
        self.test_get_properties_filter_beirut()
        self.test_get_properties_filter_mount_lebanon()
        self.test_get_property_invalid_id()
        self.test_create_property_no_auth()
        self.test_create_property_admin()
        self.test_get_single_property()
        self.test_update_property_admin()
        
        # Leads Tests
        print("📋 LEADS API TESTS")
        self.test_create_lead_public()
        self.test_get_leads_no_auth()
        self.test_get_leads_admin()
        self.test_filter_leads_pending()
        self.test_update_lead_status()
        
        # Dashboard Tests
        print("📊 DASHBOARD API TESTS")
        self.test_dashboard_stats()
        
        # Cleanup Tests
        print("🧹 CLEANUP TESTS")
        self.test_delete_property_admin()
        
        # Summary
        print("=" * 60)
        print("📋 TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📊 Total: {self.results['passed'] + self.results['failed']}")
        
        if self.results['errors']:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)