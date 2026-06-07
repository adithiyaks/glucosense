from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        # We track frontend web clients separately from the hardware clients
        self.frontend_clients: List[WebSocket] = []

    async def connect_frontend(self, websocket: WebSocket):
        await websocket.accept()
        self.frontend_clients.append(websocket)

    def disconnect_frontend(self, websocket: WebSocket):
        if websocket in self.frontend_clients:
            self.frontend_clients.remove(websocket)

    async def broadcast_to_frontends(self, message: str):
        # Fire data out to all listening browsers
        for connection in self.frontend_clients:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# --- ENDPOINT 1: Dedicated path for your ESP32 to push data ---
@app.websocket("/ws/hardware")
async def hardware_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Read incoming data from ESP32
            data = await websocket.receive_text()
            # Instantly broadcast it to all open browsers
            await manager.broadcast_to_frontends(data)
    except WebSocketDisconnect:
        print("ESP32 disconnected.")

# --- ENDPOINT 2: Dedicated path for your Vercel Browser to listen ---
@app.websocket("/ws/frontend")
async def frontend_endpoint(websocket: WebSocket):
    await manager.connect_frontend(websocket)
    try:
        while True:
            # Keep the channel open, but don't expect the browser to send text
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect_frontend(websocket)