'use client';

import { useState } from 'react';
import { Message } from '~/types';
import { parse } from 'partial-json';

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading || input === '') {
      return;
    }
    setInput('');
    setIsLoading(true);
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };
    const newMessages = [...messages, newMessage];
    setMessages(prev => [...prev, newMessage]);
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: newMessages,
      }),
    });
    if (!response.ok) {
      console.error(`Failed to generate response. Status ${response.status}`);
    }
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let messageInserted = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      lines.forEach(line => {
        if (line.startsWith('data: {')) {
          const jsonString = line.substring(6);
          const json = parse(jsonString);
          const content = json?.choices?.[0]?.delta?.content ?? '';
          result += content;
          if (!messageInserted) {
            setMessages(prev => [
              ...prev,
              {
                id: json.id,
                role: 'assistant',
                content: result,
              },
            ]);
            messageInserted = true;
          } else {
            setMessages(prev => prev.map(msg => (msg.id === json.id ? { ...msg, content: result } : msg)));
          }
        }
      });
    }
    setIsLoading(false);
  }

  return (
    <div className='max-w-2xl mx-auto py-10'>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className='rounded-lg border px-2 py-1 w-full border-black'
          placeholder='Your message'
        />
        <div className='space-y-4 mt-4'>
          {messages.map(m => (
            <div key={m.id}>
              {m.role === 'user' ? 'User:' : 'AI:'} {m.content}
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
