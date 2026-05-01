import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';


const SYSTEM_PROMPT = `Ты — инклюзивный голосовой помощник платформы Qabilet. 
ВАЖНО: Твои ответы будут озвучиваться голосом. 
1. НЕ используй символы разметки (звездочки, решетки, тире в начале строк). 
2. Пиши только чистым текстом, полными предложениями. 
3. НЕ используй смайлики и эмодзи. 
4. Твой стиль: дружелюбный, простой и понятный. 
5. Ограничивай длину ответа (не более 3-4 предложений), чтобы пользователю было комфортно слушать.`;

export async function POST(req: NextRequest) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || '');
    const { message, history } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format history for Gemini
    const formattedHistory = history?.map((msg: any) => ({
      role: msg.isUser ? "user" : "model",
      parts: [{ text: msg.text }],
    })) || [];

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Системная инструкция (обязательна к исполнению во всех ответах): " + SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Понял. Я буду следовать этой инструкции и помогать пользователям Qabilet как инклюзивный помощник." }] },
        ...formattedHistory
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to generate response: " + error.message }, { status: 500 });
  }
}
