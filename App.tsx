import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ImageUploader } from './components/ImageUploader';
import { DescriptionDisplay } from './components/DescriptionDisplay';
import { toBase64 } from './utils/fileUtils';
import { Icon } from './components/Icon';


const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setImageFile(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setMessages([]);
    setError(null);
    setLoading(false);
    setChat(null);
  }, [imageUrl]);

  const handleImageUpload = useCallback(async (file: File) => {
    resetState();

    if (!file.type.startsWith('image/')) {
      setError('Tipo de archivo no válido. Por favor, sube una imagen.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`El archivo es demasiado grande. El tamaño máximo es de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const newImageUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImageUrl(newImageUrl);
    
  }, [resetState]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (loading || !imageFile) return;

    const userMessage = { role: 'user' as const, text: message };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      let currentChat = chat;
      let stream;

      if (!currentChat) {
        // First message: create chat and send image with the prompt
        const base64Data = await toBase64(imageFile);
        const imagePart = { inlineData: { mimeType: imageFile.type, data: base64Data } };
        const textPart = { text: message };
        
        const newChat = ai.chats.create({ model: 'gemini-2.5-flash' });
        setChat(newChat);
        currentChat = newChat;

        stream = await currentChat.sendMessageStream({ message: [textPart, imagePart] });
      } else {
        // Subsequent messages: just send text
        stream = await currentChat.sendMessageStream({ message });
      }
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text += chunkText;
          return newMessages;
        });
      }
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al enviar el mensaje.');
    } finally {
      setLoading(false);
    }
  }, [chat, loading, imageFile]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Descriptor de Imágenes con IA
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Sube una imagen y conversa con la IA para explorarla en detalle.
          </p>
        </header>

        <div className="w-full mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden lg:grid lg:grid-cols-12">
            <div className="lg:col-span-6 p-6 lg:p-8 flex flex-col">
                <ImageUploader
                    onImageUpload={handleImageUpload}
                    imageUrl={imageUrl}
                    disabled={loading}
                />
                {imageUrl && (
                    <button
                        onClick={resetState}
                        disabled={loading}
                        className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon name="trash" />
                        Quitar Imagen
                    </button>
                )}
            </div>
            <div className="lg:col-span-6 p-6 lg:p-8 bg-slate-50 dark:bg-gray-800/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-gray-700">
                <DescriptionDisplay
                    messages={messages}
                    loading={loading}
                    error={error}
                    hasImage={!!imageUrl}
                    onSendMessage={handleSendMessage}
                />
            </div>
        </div>
        <footer className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>Desarrollado con Gemini. Creado con React y Tailwind CSS.</p>
        </footer>
      </main>
    </div>
  );
}