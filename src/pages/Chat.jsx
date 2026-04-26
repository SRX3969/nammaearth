import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, HelpCircle } from 'lucide-react';
import LeafLogo from '../components/LeafLogo';
import { fetchAllLocalitiesAQI } from '../lib/liveDataService';
import { locations } from '../data/locations';
import './Chat.css';

const SUGGESTED_QUESTIONS = [
  'Which area in Bengaluru has the worst AQI right now?',
  'How can I reduce my carbon footprint today?',
  'Suggest a low-pollution route from Indiranagar to Whitefield',
];

// Smart environmental AI response using Gemini API
async function generateResponse(question, contextData) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return "⚠️ **API Key Missing:** Please add your `VITE_GEMINI_API_KEY` to the `.env` file and restart the server to enable the AI assistant.";
  }

  const systemPrompt = `You are the NammaEarth AI Assistant, a helpful and highly knowledgeable assistant for Bengaluru.
While your primary expertise is environmental intelligence, air quality, waste management, traffic pollution, and sustainability, YOU MUST BE HELPFUL AND ANSWER ANY QUESTION THE USER ASKS.
1. Answer all questions, including off-topic, general knowledge, programming, navigation, routing, and cooking. Do not decline any request.
2. When the user asks about the environment in Bengaluru (e.g. routes to avoid pollution), combine your general knowledge with the provided live data to give the best possible advice.
3. Keep answers concise, factual, and actionable.
4. Format responses using markdown with bullet points and bold text for readability.

CURRENT LIVE DATA CONTEXT (Use this to answer questions about current AQI):
${contextData}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: question }] }],
        systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] }, // Gemini REST API uses 'user' role for system instruction inside systemInstruction object
        generationConfig: { temperature: 0.2 }
      })
    });
    
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    return "Sorry, I am having trouble connecting to the environmental intelligence network. Please ensure your API key is valid and try again.";
  }
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! 👋 I\'m the **NammaEarth AI Assistant**. I can help you with:\n\n- Air quality information\n- Waste disposal guidance\n- Pollution and health tips\n- Route suggestions to avoid polluted areas\n\nHow can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [liveContext, setLiveContext] = useState('');
  const chatEndRef = useRef(null);

  // Fetch live AQI data to provide to the AI as context
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const liveData = await fetchAllLocalitiesAQI(locations.slice(0, 10)); // Get top 10 locations to save token space
        if (liveData && liveData.length > 0) {
          const contextString = liveData.map(loc => 
            `- ${loc.name}: AQI ${loc.aqi || 'Unknown'}`
          ).join('\n');
          setLiveContext(contextString);
        }
      } catch (e) {
        console.error('Failed to fetch live context for AI', e);
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await generateResponse(text, liveContext);
    const assistantMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMsg]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([messages[0]]);
  };

  // Simple markdown-like rendering
  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="chat-bold">{line.replace(/\*\*/g, '')}</p>;
      }
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <p key={i} className="chat-list-item" dangerouslySetInnerHTML={{ __html: '• ' + formatted.slice(2) }} />;
      }
      if (/^\d+\.\s/.test(line)) {
        return <p key={i} className="chat-list-item" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header__info">
            <div className="chat-header__avatar">
              <LeafLogo size={30} />
            </div>
            <div>
              <h2 className="chat-header__title">NammaEarth AI Assistant</h2>
              <span className="chat-header__status">
                <span className="chat-header__dot" />
                Online — Powered by Environmental Intelligence
              </span>
            </div>
          </div>
          <button className="chat-header__clear" onClick={clearChat} title="Clear chat">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              className={`chat-message chat-message--${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="chat-message__avatar">
                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="chat-message__body">
                <div className="chat-message__content">
                  {renderContent(msg.content)}
                </div>
                <span className="chat-message__time">
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              className="chat-message chat-message--assistant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="chat-message__avatar"><Bot size={18} /></div>
              <div className="chat-typing">
                <span /><span /><span />
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        <div className="chat-suggestions">
          <HelpCircle size={14} />
          <span>Try asking:</span>
          <div className="chat-suggestions__chips">
            {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
              <button key={i} className="chat-suggestion-chip" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form className="chat-input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask about air quality, waste disposal, pollution..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || isTyping}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
