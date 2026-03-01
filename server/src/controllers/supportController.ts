import { Request, Response } from 'express';

export const handleChat = async (req: Request, res: Response) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('GROQ_API_KEY is missing from environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a friendly, helpful support bot for MetaAdieu, a platform for hosting virtual farewell events. Keep your answers concise, empathetic, and directly helpful.' },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq API Error from Server:', response.status, errorData);
            return res.status(response.status).json({ error: errorData.error?.message || `Groq API error HTTP ${response.status}` });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Error in support controller:', error);
        res.status(500).json({ error: 'Internal server error processing chat' });
    }
};
