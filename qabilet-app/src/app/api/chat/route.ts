import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCulUwH4j8J-U19sOkUWkFpDaBLXrxFqLM');

const SYSTEM_PROMPT = `Ты — инклюзивный помощник образовательной платформы Qabilet. Твоя задача — объяснять материал максимально доступно, поддерживать людей с особыми потребностями и отвечать на основе контекста обучения. Используй простые слова, добавляй эмодзи для наглядности, структурируй текст так, чтобы его было легко читать (списки, абзацы). Будь дружелюбным, мотивирующим и терпеливым.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
