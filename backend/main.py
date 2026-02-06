# main.py
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import json
from dotenv import load_dotenv
from gemini_logic import process_voice_command

load_dotenv()
app = FastAPI()

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEOAPIFY_KEY = os.getenv("GEOAPIFY_API_KEY")

# Helper function to convert City Name to Coordinates
# main.py additions

# Add this helper function to call Geoapify Geocoding
async def get_coordinates(city_name: str):
    url = f"https://api.geoapify.com/v1/geocode/search?text={city_name}&apiKey={GEOAPIFY_KEY}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        data = resp.json()
        if data.get('features'):
            # Geoapify returns [longitude, latitude]
            lon, lat = data['features'][0]['geometry']['coordinates']
            return lat, lon
    return None, None

@app.post("/api/voice")
async def voice_endpoint(payload: dict = Body(...)):
    user_text = payload.get("message")
    chat_history = payload.get("history", [])
    
    ai_json = await process_voice_command(user_text, chat_history)
    print(f"DEBUG: Raw Gemini response: {ai_json}")  # DEBUG
    data = json.loads(ai_json)
    print(f"DEBUG: Parsed JSON - intent: {data.get('intent')}, category: {data.get('category')}")  # DEBUG

    # If a city was mentioned, find its coordinates
    if data.get("location"):
        lat, lon = await get_coordinates(data["location"])
        if lat:
            data["new_center"] = [lat, lon] # Pass these to the frontend

    return data

@app.get("/api/nearby")
async def get_nearby(lat: float, lon: float, category: str):
    print(f"DEBUG: Fetching places - Category: {category}, Lat: {lat}, Lon: {lon}")  # DEBUG
    url = f"https://api.geoapify.com/v2/places?categories={category}&filter=circle:{lon},{lat},5000&limit=15&apiKey={GEOAPIFY_KEY}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        data = resp.json()
        print(f"DEBUG: Geoapify returned {len(data.get('features', []))} places")  # DEBUG
        return data