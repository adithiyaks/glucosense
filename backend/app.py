from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

# --- CORS SETTINGS ---
# Allows your Vercel frontend (or any external site) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONNECTION MANAGER ---
# Tracks the connected web browsers so we know where to send the hardware data
class ConnectionManager:
    def __init__(self):
        self.frontend_clients: List[WebSocket] = []

    async def connect_frontend(self, websocket: WebSocket):
        # Simply add the browser to the list (No accept() call here!)
        self.frontend_clients.append(websocket)

    def disconnect_frontend(self, websocket: WebSocket):
        if websocket in self.frontend_clients:
            self.frontend_clients.remove(websocket)

    async def broadcast_to_frontends(self, message: str):
        # Fire the data out to every open browser window
        for connection in self.frontend_clients:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# --- ENDPOINT 1: Dedicated path for ESP32 Hardware ---
@app.websocket("/ws/hardware")
async def hardware_endpoint(websocket: WebSocket):
    # 1. Accept the connection instantly to bypass 403 Forbidden origin checks
    await websocket.accept()
    print("ESP32 Connected!")
    try:
        while True:
            # 2. Receive the JSON payload from the ESP32
            data = await websocket.receive_text()
            
            # 3. Instantly broadcast it to all listening frontends
            await manager.broadcast_to_frontends(data)
    except WebSocketDisconnect:
        print("ESP32 Disconnected.")

# --- ENDPOINT 2: Dedicated path for Vercel Frontend ---
@app.websocket("/ws/frontend")
async def frontend_endpoint(websocket: WebSocket):
    # 1. Accept the connection instantly to bypass 403 Forbidden origin checks
    await websocket.accept() 
    
    # 2. Register this browser connection in the manager list
    await manager.connect_frontend(websocket)
    print("Frontend Browser Connected!")
    try:
        while True:
            # 3. Keep the socket open and listen (even though the browser isn't sending text)
            await websocket.receive_text() 
    except WebSocketDisconnect:
        print("Frontend Browser Disconnected.")
        manager.disconnect_frontend(websocket)