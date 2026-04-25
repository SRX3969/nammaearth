import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, HelpCircle } from 'lucide-react';
import LeafLogo from '../components/LeafLogo';
import './Chat.css';

const SUGGESTED_QUESTIONS = [
  'What is the current AQI in Bengaluru?',
  'How can I reduce my carbon footprint?',
  'Best route to avoid pollution in Whitefield?',
  'How to properly dispose of e-waste?',
  'What are the effects of PM2.5 on health?',
  'Tips for improving indoor air quality',
];

// Smart environmental AI responses
function generateResponse(question) {
  const q = question.toLowerCase();

  if (q.includes('aqi') || q.includes('air quality')) {
    return `**Current Bengaluru AQI Overview:**\n\nThe average AQI across Bengaluru is currently in the **Moderate** range (120-160). Here's a breakdown:\n\n- **Best Areas:** Jayanagar (AQI ~65), Yelahanka (AQI ~72)\n- **Worst Areas:** Peenya Industrial (AQI ~280), Silk Board (AQI ~220)\n\n**Key Pollutants:** PM2.5 and PM10 are the dominant pollutants, primarily from vehicular emissions and industrial activity.\n\n**Recommendations:**\n- Avoid outdoor exercise during 7-9 AM and 5-8 PM\n- Use N95 masks in high-pollution areas\n- Keep windows closed during peak traffic hours`;
  }

  if (q.includes('carbon') || q.includes('footprint')) {
    return `**Ways to Reduce Your Carbon Footprint:**\n\n1. **Transportation:** Use public transit (BMTC/Metro), cycle, or carpool. Bengaluru Metro can save ~2.5kg CO₂ per trip vs driving.\n\n2. **Energy:** Switch to LED bulbs, use 5-star rated appliances, and consider solar panels.\n\n3. **Diet:** Reduce meat consumption. A plant-based meal saves ~2.5kg CO₂.\n\n4. **Waste:** Segregate waste properly. Compost wet waste at home.\n\n5. **Shopping:** Use cloth bags, avoid single-use plastics, buy local produce.\n\n**Impact:** An average Bengaluru resident can reduce their footprint by 30-40% through these changes.`;
  }

  if (q.includes('route') || q.includes('traffic') || q.includes('pollution')) {
    return `**Low-Pollution Route Suggestions:**\n\nTo avoid high pollution zones:\n\n- **Avoid Silk Board Junction** during 8-10 AM and 5-8 PM (AQI can exceed 250)\n- **Alternative:** Use Outer Ring Road via Marathahalli if heading to Electronic City\n- **Metro Routes:** Purple and Green lines bypass most congestion zones\n- **Cycling:** Cubbon Park to Indiranagar via MG Road has dedicated cycling lanes\n\n**Real-time Tips:**\n- Check NammaEarth map before commuting\n- Avoid industrial areas (Peenya, Bommasandra) during daytime\n- Morning commutes (6-7 AM) have 40% lower pollution levels`;
  }

  if (q.includes('e-waste') || q.includes('electronic') || q.includes('dispose')) {
    return `**E-Waste Disposal in Bengaluru:**\n\n**Authorized Collection Centers:**\n1. BBMP E-Waste Collection Points (all zones)\n2. E-Parisara Private Limited, Dobbaspet\n3. SIMS Recycling, Electronic City\n\n**What qualifies as e-waste:**\n- Old phones, laptops, tablets\n- Batteries, chargers, cables\n- TVs, monitors, printers\n- Refrigerators, ACs\n\n**Steps:**\n1. Segregate e-waste from regular waste\n2. Call BBMP helpline: 1800-425-3704\n3. Schedule a pickup or drop at nearest center\n\n⚠️ **Never burn or dump e-waste** — it releases toxic heavy metals.`;
  }

  if (q.includes('pm2.5') || q.includes('health') || q.includes('effect')) {
    return `**Health Effects of PM2.5:**\n\nPM2.5 particles are smaller than 2.5 micrometers and can penetrate deep into lungs and bloodstream.\n\n**Short-term effects:**\n- Eye, nose, and throat irritation\n- Coughing, sneezing, runny nose\n- Shortness of breath\n- Fatigue and headaches\n\n**Long-term effects:**\n- Reduced lung function\n- Aggravated asthma\n- Increased risk of heart disease\n- Potential for lung cancer\n\n**At-risk groups:** Children, elderly, pregnant women, and people with existing respiratory/cardiac conditions.\n\n**Protection Tips:**\n- Use N95/N99 masks when AQI > 150\n- Install HEPA air purifiers indoors\n- Keep indoor plants (Areca Palm, Spider Plant)`;
  }

  if (q.includes('indoor') || q.includes('home')) {
    return `**Improving Indoor Air Quality:**\n\n1. **Ventilation:** Open windows during low-traffic hours (10 AM - 4 PM)\n\n2. **Air Purifying Plants:**\n   - Areca Palm\n   - Snake Plant (bedroom — produces oxygen at night)\n   - Spider Plant\n   - Peace Lily\n\n3. **Avoid Pollutants:**\n   - Don't smoke indoors\n   - Use natural cleaners\n   - Minimize incense/agarbatti use\n\n4. **Equipment:**\n   - HEPA air purifiers for bedrooms\n   - Regular AC filter cleaning\n   - Exhaust fans in kitchen\n\n5. **Monitoring:** Place a small AQI monitor indoors to track levels.\n\n**Target:** Keep indoor PM2.5 below 35 µg/m³ for healthy living.`;
  }

  return `Thank you for your question about **"${question}"**.\n\nHere's what I can help you with:\n\n- **Air Quality:** Current AQI levels, pollutant breakdowns, and health advisories\n- **Waste Management:** Disposal guidelines, recycling centers, and e-waste handling\n- **Transportation:** Low-pollution routes, public transit options\n- **Health:** Effects of pollution, protection tips\n- **Green Living:** Carbon footprint reduction, indoor plants, sustainable practices\n\nPlease ask a more specific question and I'll provide detailed, data-driven guidance!\n\n*Powered by NammaEarth Environmental Intelligence*`;
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
  const chatEndRef = useRef(null);

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

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = generateResponse(text);
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
