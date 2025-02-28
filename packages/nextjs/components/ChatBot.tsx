import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // 사용자 메시지를 히스토리에 추가
    const userMessage: ChatMessage = { role: "user", content: message };
    setChatHistory(prev => [...prev, userMessage]);

    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // AI 응답을 히스토리에 추가
      const assistantMessage: ChatMessage = { role: "assistant", content: data.response };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("챗봇 오류:", error);
      const errorMessage: ChatMessage = { 
        role: "assistant", 
        content: "죄송합니다. 오류가 발생했습니다." 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-xl w-96 h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white text-lg font-bold">AI 챗봇</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  chat.role === "user" 
                    ? "text-right" 
                    : "text-left"
                }`}
              >
                <div
                  className={`inline-block rounded p-4 max-w-[80%] ${
                    chat.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  {chat.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 p-3 bg-gray-700 rounded text-white text-base"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-600 text-base"
              >
                {isLoading ? "..." : "전송"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot; 