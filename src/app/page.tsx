'use client';

import { useState } from 'react';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    {
      id: string;
      role: string;
      content: string;
    }[]
  >([]);

  return (
    <div className='max-w-2xl mx-auto py-10'>
      <form
        onSubmit={async e => {
          e.preventDefault();
          if (input === '') {
            return;
          }
          setInput('');
          const newMessages = [
            ...messages,
            {
              id: crypto.randomUUID(),
              role: 'user',
              content: input,
            },
          ];
          setMessages(newMessages);
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: newMessages }),
          });
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let result = '';
          let messageInserted = false;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const dataLines = chunk.split('\n').filter(line => line.trim() !== '');
            dataLines.forEach(line => {
              if (line.startsWith('data: {')) {
                const jsonString = line.substring(6);
                const json = JSON.parse(jsonString);
                if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                  const content = json.choices[0].delta.content;
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
              }
            });
          }
        }}
      >
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
