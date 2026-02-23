import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User as UserIcon, MessageSquare } from 'lucide-react';
import { User } from '../types';
import { Socket } from 'socket.io-client';

interface Message {
  text: string;
  isSender: boolean;
  timestamp: string;
}

interface TacticalChatProps {
  socket: Socket | null;
  agent: User | null;
  onClose: () => void;
}

const TacticalChat: React.FC<TacticalChatProps> = ({ socket, agent, onClose }) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !agent) return;

    const handleReply = (data: { from: number, message: string, timestamp: string }) => {
      if (data.from === agent.id) {
        setHistory(prev => [...prev, { text: data.message, isSender: false, timestamp: data.timestamp }]);
      }
    };

    socket.on('TACTICAL_REPLY', handleReply);
    return () => {
      socket.off('TACTICAL_REPLY', handleReply);
    };
  }, [socket, agent]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history]);

  const handleSend = () => {
    if (!message.trim() || !socket || !agent) return;

    socket.emit('SEND_INSTRUCTION', {
      agentId: agent.id,
      message: message.trim()
    });

    setHistory(prev => [...prev, { 
      text: message.trim(), 
      isSender: true, 
      timestamp: new Date().toISOString() 
    }]);
    
    setMessage('');
  };

  if (!agent) return null;

  return (
    <div className="absolute top-6 right-6 bottom-6 w-96 bg-surface/95 backdrop-blur-xl border border-gray-800 rounded-[2.5rem] shadow-2xl z-[2000] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-white">{agent.nom} {agent.prenom}</p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              En Ligne
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">Aucune instruction envoyée</p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.isSender ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
              msg.isSender 
                ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
            }`}>
              {msg.text}
              <p className="text-[8px] mt-1 opacity-50 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-gray-900/50 border-t border-gray-800">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Écrire une instruction..."
            className="w-full bg-background border border-gray-800 rounded-2xl py-3 pl-4 pr-12 text-xs focus:outline-none focus:border-primary transition-all placeholder:text-gray-600"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!message.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary hover:bg-primary-dark disabled:bg-gray-700 disabled:opacity-50 text-white rounded-xl transition-all active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacticalChat;
