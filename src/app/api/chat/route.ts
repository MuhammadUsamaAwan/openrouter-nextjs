export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: { id: string; role: string; content: string }[] };
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemma-2-9b-it:free',
      messages,
      stream: true,
    }),
  });
  return response;
}
