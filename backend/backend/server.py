from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "aimlink-properties-secret-key-2025")
ALGORITHM = "HS256"

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    admin_email = payload.get("email")
    if not admin_email:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    admin = await db.admins.find_one({"email": admin_email})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

# Models
class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    email: str
    token: str

class PropertyCreate(BaseModel):
    title: str
    area: str  # Beirut or Mount Lebanon
    location_detail: str
    price_usd: float
    property_type: str  # Apartment, Villa, Office, Land
    size_sqm: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_level: Optional[str] = None
    view_type: Optional[str] = None
    description: str
    images: List[str] = []  # Base64 encoded images
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str = "active"  # active, draft, sold

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    area: Optional[str] = None
    location_detail: Optional[str] = None
    price_usd: Optional[float] = None
    property_type: Optional[str] = None
    size_sqm: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_level: Optional[str] = None
    view_type: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None

class PropertyResponse(BaseModel):
    id: str
    title: str
    area: str
    location_detail: str
    price_usd: float
    property_type: str
    size_sqm: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_level: Optional[str] = None
    view_type: Optional[str] = None
    description: str
    images: List[str] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    created_at: datetime

class LeadCreate(BaseModel):
    property_id: str
    name: str
    phone: str
    message: Optional[str] = None

class LeadUpdate(BaseModel):
    status: str  # pending, contacted, completed

class LeadResponse(BaseModel):
    id: str
    property_id: str
    name: str
    phone: str
    message: Optional[str] = None
    status: str
    created_at: datetime

class DashboardStats(BaseModel):
    total_properties: int
    active_properties: int
    draft_properties: int
    sold_properties: int
    pending_leads: int
    total_leads: int

# Auth Routes
@api_router.post("/auth/login", response_model=AdminResponse)
async def admin_login(credentials: AdminLogin):
    admin = await db.admins.find_one({"email": credentials.email})
    if not admin or not verify_password(credentials.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"email": admin["email"]})
    return AdminResponse(email=admin["email"], token=token)

@api_router.post("/auth/create-admin")
async def create_admin(email: EmailStr, password: str):
    """Helper endpoint to create initial admin - should be removed in production"""
    existing = await db.admins.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    hashed_password = get_password_hash(password)
    await db.admins.insert_one({
        "email": email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    })
    return {"message": "Admin created successfully"}

# Property Routes
@api_router.get("/properties", response_model=List[PropertyResponse])
async def get_properties(
    area: Optional[str] = None,
    property_type: Optional[str] = None,
    status: Optional[str] = "active",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    query = {}
    if area:
        query["area"] = area
    if property_type:
        query["property_type"] = property_type
    if status:
        query["status"] = status
    if min_price or max_price:
        query["price_usd"] = {}
        if min_price:
            query["price_usd"]["$gte"] = min_price
        if max_price:
            query["price_usd"]["$lte"] = max_price
    
    properties = await db.properties.find(query).sort("created_at", -1).to_list(1000)
    return [
        PropertyResponse(
            id=str(prop["_id"]),
            title=prop["title"],
            area=prop["area"],
            location_detail=prop["location_detail"],
            price_usd=prop["price_usd"],
            property_type=prop["property_type"],
            size_sqm=prop["size_sqm"],
            bedrooms=prop.get("bedrooms"),
            bathrooms=prop.get("bathrooms"),
            floor_level=prop.get("floor_level"),
            view_type=prop.get("view_type"),
            description=prop["description"],
            images=prop.get("images", []),
            latitude=prop.get("latitude"),
            longitude=prop.get("longitude"),
            status=prop["status"],
            created_at=prop["created_at"]
        )
        for prop in properties
    ]

@api_router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")
    
    prop = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return PropertyResponse(
        id=str(prop["_id"]),
        title=prop["title"],
        area=prop["area"],
        location_detail=prop["location_detail"],
        price_usd=prop["price_usd"],
        property_type=prop["property_type"],
        size_sqm=prop["size_sqm"],
        bedrooms=prop.get("bedrooms"),
        bathrooms=prop.get("bathrooms"),
        floor_level=prop.get("floor_level"),
        view_type=prop.get("view_type"),
        description=prop["description"],
        images=prop.get("images", []),
        latitude=prop.get("latitude"),
        longitude=prop.get("longitude"),
        status=prop["status"],
        created_at=prop["created_at"]
    )

@api_router.post("/properties", response_model=PropertyResponse)
async def create_property(
    property_data: PropertyCreate,
    admin: dict = Depends(get_current_admin)
):
    property_dict = property_data.dict()
    property_dict["created_at"] = datetime.utcnow()
    property_dict["updated_at"] = datetime.utcnow()
    
    result = await db.properties.insert_one(property_dict)
    property_dict["_id"] = result.inserted_id
    
    return PropertyResponse(
        id=str(property_dict["_id"]),
        **{k: v for k, v in property_dict.items() if k != "_id" and k != "updated_at"}
    )

@api_router.put("/properties/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    property_data: PropertyUpdate,
    admin: dict = Depends(get_current_admin)
):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")
    
    update_data = {k: v for k, v in property_data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    updated_property = await db.properties.find_one({"_id": ObjectId(property_id)})
    return PropertyResponse(
        id=str(updated_property["_id"]),
        **{k: v for k, v in updated_property.items() if k != "_id" and k != "updated_at"}
    )

@api_router.delete("/properties/{property_id}")
async def delete_property(
    property_id: str,
    admin: dict = Depends(get_current_admin)
):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")
    
    result = await db.properties.delete_one({"_id": ObjectId(property_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {"message": "Property deleted successfully"}

# Lead Routes
@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(lead_data: LeadCreate):
    # Verify property exists
    if not ObjectId.is_valid(lead_data.property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")
    
    prop = await db.properties.find_one({"_id": ObjectId(lead_data.property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    lead_dict = lead_data.dict()
    lead_dict["status"] = "pending"
    lead_dict["created_at"] = datetime.utcnow()
    
    result = await db.leads.insert_one(lead_dict)
    lead_dict["_id"] = result.inserted_id
    
    return LeadResponse(
        id=str(lead_dict["_id"]),
        **{k: v for k, v in lead_dict.items() if k != "_id"}
    )

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(
    status: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    query = {}
    if status:
        query["status"] = status
    
    leads = await db.leads.find(query).sort("created_at", -1).to_list(1000)
    return [
        LeadResponse(
            id=str(lead["_id"]),
            **{k: v for k, v in lead.items() if k != "_id"}
        )
        for lead in leads
    ]

@api_router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead_data: LeadUpdate,
    admin: dict = Depends(get_current_admin)
):
    if not ObjectId.is_valid(lead_id):
        raise HTTPException(status_code=400, detail="Invalid lead ID")
    
    result = await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {"status": lead_data.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    updated_lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
    return LeadResponse(
        id=str(updated_lead["_id"]),
        **{k: v for k, v in updated_lead.items() if k != "_id"}
    )

# Dashboard Stats
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    total_properties = await db.properties.count_documents({})
    active_properties = await db.properties.count_documents({"status": "active"})
    draft_properties = await db.properties.count_documents({"status": "draft"})
    sold_properties = await db.properties.count_documents({"status": "sold"})
    pending_leads = await db.leads.count_documents({"status": "pending"})
    total_leads = await db.leads.count_documents({})
    
    return DashboardStats(
        total_properties=total_properties,
        active_properties=active_properties,
        draft_properties=draft_properties,
        sold_properties=sold_properties,
        pending_leads=pending_leads,
        total_leads=total_leads
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
