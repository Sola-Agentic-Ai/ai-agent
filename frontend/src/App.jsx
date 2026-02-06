import React, { useState, useEffect, useRef } from "react";
import MapView from "./components/MapContainer";
import { Mic, Hospital, Utensils, Scissors } from "lucide-react";
import axios from "axios";
import { useSpeech } from "./hooks/useSpeech"; 
import "./App.css";

function App() {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState([13.0827, 80.2707]);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: "agent", text: "வணக்கம்! நான் சோலா (SOLA). உங்களுக்கு எப்படி உதவட்டும்?" }
  ]);

  const chatEndRef = useRef(null);

  // Get user's location on app load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter([latitude, longitude]);
          console.log(`📍 User location: ${latitude}, ${longitude}`);
        },
        (error) => {
          console.log("Location access denied, using default (Chennai):", error.message);
          // Keep default location if geolocation fails
        }
      );
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const speakBack = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ta-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const { isListening, startListening } = useSpeech(async (transcript) => {
    setChatHistory(prev => [...prev, { role: "user", text: transcript }]);
    await sendToGemini(transcript);
  });

  // App.jsx - Updated sendToGemini and fetchPlaces
  // App.jsx snippet inside sendToGemini
  const sendToGemini = async (text) => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/voice", { 
        message: text, 
        history: chatHistory.map(h => ({ 
          role: h.role === 'agent' ? 'model' : 'user', 
          parts: [{ text: h.text }] 
        })),
        lat: center[0], 
        lon: center[1] 
      });
      
      const { reply, intent, category, new_center } = res.data;
      console.log("Gemini Response:", { reply, intent, category, new_center }); // DEBUG
      setChatHistory(prev => [...prev, { role: "agent", text: reply }]);
      speakBack(reply);

      let searchLat = center[0];
      let searchLon = center[1];

      // RELOCATE MAP: If a new location was provided, update the center
      if (new_center) {
        setCenter(new_center);
        searchLat = new_center[0];
        searchLon = new_center[1];
      }

      if (intent === "SEARCH" && category) {
        // Fetch places at the specific location mentioned
        fetchPlaces(category, searchLat, searchLon);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update fetchPlaces to take lat/lon as arguments
  const fetchPlaces = async (cat, lat = center[0], lon = center[1]) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/nearby?lat=${lat}&lon=${lon}&category=${cat}`);
      setPlaces(res.data.features);
    } catch (err) {
      console.error("Map Data Error:", err);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>SOLA AI</h1>
          <p className="subtitle">Chennai Regional Voice Booking</p>
        </div>

        <div className="chat-area">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}-message`}>
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="category-buttons">
          <button className="category-btn" onClick={() => fetchPlaces('catering.restaurant')}>
            <Utensils size={16}/> Restaurants
          </button>
          <button className="category-btn" onClick={() => fetchPlaces('healthcare.hospital')}>
            <Hospital size={16}/> Hospitals
          </button>
          <button className="category-btn" onClick={() => fetchPlaces('commercial.personal_care.salon')}>
            <Scissors size={16}/> Saloons
          </button>
        </div>

        <div className="voice-controls">
          <button 
            className={`mic-btn ${isListening ? 'listening' : ''}`} 
            onClick={startListening}
            disabled={loading}
          >
            <Mic size={28} />
          </button>
          <span className="mic-label">
            {loading ? 'SOLA is thinking...' : isListening ? 'Listening...' : 'Tap to speak to SOLA'}
          </span>
        </div>
      </div>

      <div className="map-container">
        <MapView places={places} center={center} />
      </div>
    </div>
  );
}

export default App;