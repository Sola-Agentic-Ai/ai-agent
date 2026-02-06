import { useState, useEffect } from 'react';

export const useSpeech = (onResult) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ta-IN'; // Set to Tamil (India)
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript); // Send Tamil text to backend
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return { isListening, startListening };
};