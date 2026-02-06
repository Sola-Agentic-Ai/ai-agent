# gemini_logic.py
from google import genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are 'SOLA', a smart Tamil assistant. Use colloquial Tamil.

SLOT FILLING INSTRUCTIONS:
1. If the user wants to BOOK, you MUST collect: 'shop_name' and 'time'.
2. If these are missing, ask for them politely in Tamil and keep intent as 'BOOK'.
3. The conversation is continuous. Do not say "Enough thinking".

SEARCH CATEGORIES:
- SALOON/BARBER: 'service.beauty' (Keywords: saloon, salon, barber, haircut, hair, நாई, சலூன்)
- BEAUTY PARLOR: 'service.beauty.hairdresser' (Keywords: beauty, parlour, makeup, பியூட்டி)
- RESTAURANT: 'catering.restaurant' (Keywords: restaurant, food, eat, hotel, சாப்பிட)
- HOSPITAL: 'healthcare.hospital' (Keywords: hospital, doctor, medical, clinic, மருத்துவமனை)

JSON Structure (Return ONLY this):
{
  "reply": "Tamil response",
  "intent": "SEARCH" | "BOOK" | "CHAT",
  "category": "category_string",
  "location": "city_name_or_null",
  "details": {"shop_name": "string or null", "time": "string or null"}
}
"""

async def process_voice_command(user_text, history=[]):
    chat = client.chats.create(
        model='gemini-2.5-flash', # Maintained as requested
        config={'system_instruction': SYSTEM_PROMPT},
        history=history
    )
    response = chat.send_message(user_text)
    raw_text = response.text

    # Robust JSON extraction: Find the first '{' and last '}'
    try:
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        return raw_text
    except:
        return raw_text