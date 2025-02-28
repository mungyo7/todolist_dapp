import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY가 설정되지 않았습니다");
      return NextResponse.json({ error: "API 키 설정 오류" }, { status: 500 });
    }

    console.log("요청 메시지:", message); // 디버깅용

    const result = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022", //claude-3-7-sonnet-20250219
      max_tokens: 1000,
      temperature: 1,
      system: "Respond in korean",
      messages: [{ role: "user", content: message }],
    });

    console.log("API 응답:", result); // 디버깅용

    return NextResponse.json({ 
      response: result.content[0].type === 'text' ? result.content[0].text : '응답을 받지 못했습니다' 
    });
  } catch (error) {
    console.error("API 오류:", error); // 상세 오류 로깅
    return NextResponse.json({ 
      error: "오류가 발생했습니다: " + (error instanceof Error ? error.message : "알 수 없는 오류") 
    }, { status: 500 });
  }
} 