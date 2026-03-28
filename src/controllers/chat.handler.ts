import { Response, NextFunction } from 'express';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1).max(500, "Message cannot exceed 500 characters."),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
  })).optional()
});

export const askAssistant = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { message } = chatSchema.parse(req.body);

    // Artificial delay to simulate AI "thinking" for better UX
    const delay = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Return the professional mock response
    // Explaining: This is a free mock response for initial version. 
    // Real AI integration (like Gemini/OpenAI) can be easily added here later.
    res.json({ 
      success: true, 
      message: "This is a free AI response. Replace with real AI later if needed." 
    });
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, errors: (err as any).errors });
    res.status(500).json({ success: false, message: 'AI Assistant failed' });
  }
};
