import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

# Create admin account
print("Creating admin account...")
admin_data = {
    "email": "admin@aimlinkproperties.com",
    "password": "admin123"
}

try:
    response = requests.post(
        f"{BACKEND_URL}/api/auth/create-admin",
        params=admin_data
    )
    print(f"Admin creation response: {response.status_code}")
    if response.status_code == 200:
        print("✓ Admin account created successfully")
        print(f"  Email: {admin_data['email']}")
        print(f"  Password: {admin_data['password']}")
    else:
        print(f"  Response: {response.text}")
except Exception as e:
    print(f"✗ Error creating admin: {e}")

# Login to get token
print("\nLogging in...")
try:
    response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={
            "email": admin_data["email"],
            "password": admin_data["password"]
        }
    )
    if response.status_code == 200:
        token = response.json()["token"]
        print("✓ Login successful")
        
        # Create sample properties
        print("\nCreating sample properties...")
        
        properties = [
            {
                "title": "Luxury Penthouse in Achrafieh",
                "area": "Beirut",
                "location_detail": "Achrafieh, Sassine Square",
                "price_usd": 850000,
                "property_type": "Apartment",
                "size_sqm": 320,
                "bedrooms": 4,
                "bathrooms": 3,
                "floor_level": "10th Floor",
                "view_type": "Sea and Mountain View",
                "description": "Stunning penthouse apartment with panoramic views of Beirut. Features include a spacious living area, modern kitchen, master suite with walk-in closet, and a large terrace perfect for entertaining. Premium finishes throughout.",
                "images": [],
                "latitude": 33.8938,
                "longitude": 35.5018,
                "status": "active"
            },
            {
                "title": "Modern Villa in Jounieh",
                "area": "Mount Lebanon",
                "location_detail": "Jounieh, Haret Sakhr",
                "price_usd": 1250000,
                "property_type": "Villa",
                "size_sqm": 450,
                "bedrooms": 5,
                "bathrooms": 4,
                "floor_level": "Ground + 2 Floors",
                "view_type": "Mountain View",
                "description": "Exclusive villa with contemporary design. Features include a private pool, landscaped garden, home office, entertainment room, and smart home automation. Located in a quiet residential area with easy access to highway.",
                "images": [],
                "latitude": 33.9808,
                "longitude": 35.6178,
                "status": "active"
            },
            {
                "title": "Prime Office Space in Downtown Beirut",
                "area": "Beirut",
                "location_detail": "Downtown, Solidere",
                "price_usd": 650000,
                "property_type": "Office",
                "size_sqm": 280,
                "bedrooms": None,
                "bathrooms": 2,
                "floor_level": "8th Floor",
                "view_type": "City View",
                "description": "Premium office space in the heart of Beirut's business district. Open floor plan with floor-to-ceiling windows, modern facilities, and 24/7 security. Perfect for corporate headquarters or professional services firm.",
                "images": [],
                "latitude": 33.8886,
                "longitude": 35.5003,
                "status": "active"
            },
            {
                "title": "Beachfront Apartment in Ramlet el Bayda",
                "area": "Beirut",
                "location_detail": "Ramlet el Bayda, Corniche",
                "price_usd": 720000,
                "property_type": "Apartment",
                "size_sqm": 185,
                "bedrooms": 3,
                "bathrooms": 2,
                "floor_level": "3rd Floor",
                "view_type": "Sea View",
                "description": "Rare opportunity to own a beachfront apartment on Beirut's famous Corniche. Direct sea views from every room, recently renovated with high-end finishes. Walking distance to restaurants and cafes.",
                "images": [],
                "latitude": 33.8863,
                "longitude": 35.4766,
                "status": "active"
            },
            {
                "title": "Mountain Chalet in Faraya",
                "area": "Mount Lebanon",
                "location_detail": "Faraya, Kfardebian",
                "price_usd": 450000,
                "property_type": "Villa",
                "size_sqm": 220,
                "bedrooms": 3,
                "bathrooms": 2,
                "floor_level": "2 Floors",
                "view_type": "Mountain and Valley View",
                "description": "Cozy mountain retreat with stunning valley views. Features stone fireplace, traditional Lebanese architecture with modern amenities. Ideal for weekend getaways or ski season. Close to ski resorts.",
                "images": [],
                "latitude": 33.9833,
                "longitude": 35.8167,
                "status": "active"
            }
        ]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        for i, prop in enumerate(properties, 1):
            try:
                response = requests.post(
                    f"{BACKEND_URL}/api/properties",
                    json=prop,
                    headers=headers
                )
                if response.status_code == 200:
                    print(f"  ✓ Property {i}: {prop['title']}")
                else:
                    print(f"  ✗ Property {i} failed: {response.text}")
            except Exception as e:
                print(f"  ✗ Property {i} error: {e}")
        
        print("\n" + "="*60)
        print("SETUP COMPLETE!")
        print("="*60)
        print("\nAdmin Login Credentials:")
        print(f"  Email: {admin_data['email']}")
        print(f"  Password: {admin_data['password']}")
        print("\nSample Properties Created: 5")
        print("\nYou can now:")
        print("  1. Login to the mobile app using admin credentials")
        print("  2. Browse properties on the home screen")
        print("  3. View properties on the map")
        print("  4. Test the admin features")
        print("="*60)
        
    else:
        print(f"✗ Login failed: {response.text}")
except Exception as e:
    print(f"✗ Error during login: {e}")
