import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './Icon';

interface DescriptionDisplayProps {
  messages: Array<{ role: 'user' | 'model'; text: string }>;
  loading: boolean;
  error: string | null;
  hasImage: boolean;
  onSendMessage: (message: string) => void;
}

interface ChatInputProps {
    onSubmit: (message: string) => void;
    disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSubmit, disabled }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSubmit(message.trim());
            setMessage('');
        }
    };
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex items-start gap-2 p-2 border border-slate-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-primary-DEFAULT">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
                placeholder="Haz una pregunta sobre la imagen..."
                className="flex-grow bg-transparent focus:outline-none resize-none overflow-y-hidden max-h-32"
                rows={1}
                disabled={disabled}
                aria-label="Escribe tu mensaje"
            />
            <button type="submit" disabled={disabled || !message.trim()} className="p-2 rounded-md bg-primary-DEFAULT text-white hover:bg-primary-hover disabled:bg-slate-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Enviar mensaje">
                <Icon name="send" className="h-5 w-5"/>
            </button>
        </form>
    );
};


const useSpeechSynthesis = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const handleEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  const speak = useCallback((text: string, lang = 'es-ES') => {
    if (!isSupported || isPlaying) return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isPlaying, handleEnd]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  }, [isSupported]);

  useEffect(() => cancel, [cancel]);

  return { isPlaying, isSupported, speak, cancel };
};

const SkeletonLoader: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded"></div>
    <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-5/6"></div>
  </div>
);

const WelcomeMessage: React.FC = () => (
    <div className="text-center text-slate-500 dark:text-slate-400">
        <Icon name="sparkles" className="mx-auto h-12 w-12 text-gray-400"/>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Esperando Imagen</h3>
        <p className="mt-1 text-sm">Sube una imagen para iniciar una conversación con la IA.</p>
    </div>
);

const InitialPromptMessage: React.FC = () => (
    <div className="text-center text-slate-500 dark:text-slate-400">
        <Icon name="sparkles" className="mx-auto h-12 w-12 text-gray-400"/>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Imagen Cargada</h3>
        <p className="mt-1 text-sm">¿Qué te gustaría saber sobre esta imagen?</p>
    </div>
);


const MessageBubble: React.FC<{ message: { role: 'user' | 'model'; text: string } }> = ({ message }) => {
    const isModel = message.role === 'model';
    return (
      <div className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[90%] p-3 rounded-2xl ${isModel ? 'bg-slate-100 dark:bg-gray-700 rounded-bl-none' : 'bg-indigo-500 text-white rounded-br-none'}`}>
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    );
};

export const DescriptionDisplay: React.FC<DescriptionDisplayProps> = ({ messages, loading, error, hasImage, onSendMessage }) => {
  const [copied, setCopied] = useState(false);
  const { isPlaying, isSupported, speak, cancel } = useSpeechSynthesis();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastModelMessage = messages.filter(m => m.role === 'model').pop()?.text || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    cancel();
  }, [messages, cancel]);
  
  const handlePlayToggle = () => {
    if (isPlaying) {
      cancel();
    } else if (lastModelMessage) {
      speak(lastModelMessage);
    }
  };

  const handleCopy = () => {
    if (lastModelMessage) {
      navigator.clipboard.writeText(lastModelMessage);
      setCopied(true);
    }
  };

  const renderContent = () => {
    if (loading && messages.length === 0) {
      return <div className="flex items-center justify-center h-full"><SkeletonLoader /></div>;
    }
    if (!hasImage) {
      return <div className="flex items-center justify-center h-full"><WelcomeMessage /></div>;
    }
    if (hasImage && messages.length === 0 && !loading) {
        return <div className="flex items-center justify-center h-full"><InitialPromptMessage /></div>;
    }
    if (messages.length > 0) {
        return (
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => <MessageBubble key={index} message={msg} />)}
                {loading && messages.length > 0 && (
                    <div className="flex justify-start">
                        <div className="max-w-[90%] p-3 rounded-2xl bg-slate-100 dark:bg-gray-700 rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Conversación con IA</h2>
        <div className="flex items-center gap-2">
            {isSupported && lastModelMessage && (
              <button onClick={handlePlayToggle} className="p-2 rounded-md transition-colors text-primary-DEFAULT bg-primary-light dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900">
                <Icon name={isPlaying ? "stop" : "play"} />
              </button>
            )}
            {lastModelMessage && (
              <button onClick={handleCopy} className="p-2 rounded-md transition-colors text-primary-DEFAULT bg-primary-light dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 w-24 text-sm font-semibold">
                {copied ? <Icon name="check" className="mx-auto" /> : 'Copiar'}
              </button>
            )}
        </div>
      </div>
      <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 min-h-[300px] lg:min-h-0">
        {renderContent()}
        {error && (
            <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 m-4 rounded-lg">
                <Icon name="error" className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Ocurrió un Error</p>
                <p className="text-sm">{error}</p>
            </div>
        )}
        {hasImage && <div className="p-2"><ChatInput onSubmit={onSendMessage} disabled={loading} /></div>}
      </div>
    </div>
  );
};