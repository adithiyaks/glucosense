import os
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv

# 1. Load the secret connection string from the .env file
load_dotenv()

app = FastAPI()

# 2. Extract the URI and fall back to local if the .env isn't found
MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# 3. Connect asynchronously to MongoDB Atlas
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.patient_monitoring
collection = db.sensor_logs

# Pydantic Schemas for Data Validation
class Biometrics(BaseModel):
    heart_rate: float
    spo2: float
    temperature: float

class Motion(BaseModel):
    accel_x: float
    accel_y: float
    accel_z: float

class SensorDataPayload(BaseModel):
    patient_id: str
    biometrics: Biometrics
    motion: Motion

# NEW DIAGNOSTIC ENDPOINT: Test if FastAPI can talk to Atlas successfully
@app.get("/api/v1/db-check")
async def check_atlas_connection():
    try:
        # Send a quick ping to the Atlas cluster
        await client.admin.command('ping')
        return {"status": "success", "message": "Successfully connected to MongoDB Atlas Cloud!"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to connect to Atlas. Error: {str(e)}"
        )

# Endpoint 1: ESP32 sends data here
@app.post("/api/v1/telemetry", status_code=status.HTTP_201_CREATED)
async def receive_telemetry(payload: SensorDataPayload):
    document = payload.model_dump()
    document["timestamp"] = datetime.utcnow() 
    
    result = await collection.insert_one(document)
    if result.inserted_id:
        return {"status": "success", "inserted_id": str(result.inserted_id)}
    raise HTTPException(status_code=500, detail="Failed to write to database")

# Endpoint 2: Next.js fetches data from here
@app.get("/api/v1/telemetry/{patient_id}")
async def get_latest_telemetry(patient_id: str):
    latest_log = await collection.find_one(
        {"patient_id": patient_id},
        sort=[("timestamp", -1)]
  )
    if latest_log:
        latest_log["_id"] = str(latest_log["_id"]) 
        return latest_log
    raise HTTPException(status_code=404, detail="No data found for this patient")