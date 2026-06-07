import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load connection string from the .env file
load_dotenv()
MONGO_DETAILS = os.getenv("MONGO_URI")

if not MONGO_DETAILS:
    print("[ERROR] MONGO_URI not found in .env file!")
    print("Please ensure your .env file contains: MONGO_URI=\"your_connection_string\"")
    exit(1)

async def test_database_insertion():
    print("--- MongoDB Atlas Live Injection Test ---")
    print("Connecting to cloud cluster...")
    
    # Initialize the database client
    client = AsyncIOMotorClient(MONGO_DETAILS)
    db = client.patient_monitoring
    collection = db.sensor_logs

    # Verify connection via a quick ping
    try:
        await client.admin.command('ping')
        print("[SUCCESS] Connection handshake confirmed!\n")
    except Exception as e:
        print(f"[CONNECTION ERROR] Could not connect to Atlas: {e}")
        return

    # Terminal inputs gathering
    patient_name = input("Enter Patient Name/ID (e.g., patient_001): ").strip()
    
    try:
        heart_rate = float(input("Enter Heart Rate (BPM, e.g., 72.5): "))
        spo2 = float(input("Enter SpO2 Percentage (%, e.g., 98.0): "))
        temperature = float(input("Enter Core Temperature (°C, e.g., 36.6): "))
    except ValueError:
        print("\n[ERROR] Invalid numerical input. Please enter numbers for biometrics.")
        return

    # Build the payload matching your production document architecture
    payload = {
        "patient_id": patient_name,
        "timestamp": datetime.utcnow(),  # ISO standard timestamp
        "biometrics": {
            "heart_rate": heart_rate,
            "spo2": spo2,
            "temperature": temperature
        },
        "motion": {
            "accel_x": 0.0,  # Mocking static posture for terminal test
            "accel_y": 0.0,
            "accel_z": 1.0
        }
    }

    print("\nInjecting telemetry packet into MongoDB Atlas...")
    
    try:
        # Perform the asynchronous document insert
        result = await collection.insert_one(payload)
        print("--------------------------------------------------")
        print("[SUCCESS] Telemetry document successfully committed!")
        print(f"Generated Document Document ID (_id): {result.inserted_id}")
        print("--------------------------------------------------")
        print("Go check your MongoDB Atlas Data Explorer UI to view the live log.")
        
    except Exception as e:
        print(f"[WRITE ERROR] Failed to push data packet to database: {e}")

# Run the asynchronous main event loop
if __name__ == "__main__":
    asyncio.run(test_database_insertion())