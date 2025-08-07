

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MealPlan, HealthData, ChatMessage } from './types';
import { generateMealPlan } from './services/geminiService';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ApiKeyModal from './components/ApiKeyModal';
import { AppleIcon, ChatBubbleIcon, SendIcon, XIcon, CheckIcon } from './components/icons';
import { GoogleGenAI, Chat } from '@google/genai';


const SAVED_PLAN_KEY = 'health-planner-saved-plan';
const API_KEY_STORAGE_KEY = 'gemini-api-key';

// Chat Component Definition
interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
    chatSession: Chat | null;
    onApplyNewPlan: (plan: MealPlan) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose, chatSession, onApplyNewPlan }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if(isOpen) {
            setMessages([{ role: 'model', text: 'สวัสดีค่ะ Healthie ยินดีให้บริการค่ะ มีอะไรให้ช่วยเกี่ยวกับแผนสุขภาพของคุณวันนี้คะ?' }]);
        }
    }, [isOpen]);
    
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [userInput]);
    
    const handleCancelProposal = (messageIndex: number) => {
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[messageIndex]) {
                newMessages[messageIndex].proposedPlan = null;
                 newMessages.push({role: 'model', text: 'ได้เลยค่ะ มีอะไรให้ช่วยเหลือเพิ่มเติมไหมคะ?'})
            }
            return newMessages;
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chatSession || isThinking) return;

        const newUserMessage: ChatMessage = { role: 'user', text: userInput };
        const optimisticMessages = [...messages, newUserMessage];
        setMessages(optimisticMessages);
        setUserInput('');
        setIsThinking(true);
        
        try {
            // Use non-streaming for potentially complex JSON responses
            const result = await chatSession.sendMessage({ message: userInput });
            const fullResponse = result.text;
            let finalModelMessage: ChatMessage;

            try {
                // Attempt to parse the full response as JSON
                const parsedResponse = JSON.parse(fullResponse);
                if (parsedResponse.responseText && parsedResponse.newPlan) {
                    // It's a plan modification response
                    finalModelMessage = { 
                        role: 'model', 
                        text: parsedResponse.responseText, 
                        proposedPlan: parsedResponse.newPlan as MealPlan
                    };
                } else {
                    // It's a JSON object but not the one we want, treat as text
                    finalModelMessage = { role: 'model', text: fullResponse };
                }
            } catch (jsonError) {
                // Not JSON, treat as a regular text response
                finalModelMessage = { role: 'model', text: fullResponse };
            }

            setMessages(prev => [...prev, finalModelMessage]);

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = "ขออภัยค่ะ มีข้อผิดพลาดเกิดขึ้น ไม่สามารถตอบคำถามได้ในขณะนี้";
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsThinking(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-end justify-end" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg h-full sm:h-[80vh] sm:max-h-[700px] shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col sm:m-4">
                 <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">ปรึกษา AI Health Assistant</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="w-5 h-5"/>
                    </button>
                 </header>
                 <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index}>
                            <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                 {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">AI</div>}
                                 <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                                     <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                 </div>
                            </div>
                             {msg.role === 'model' && msg.proposedPlan && (
                                <div className="mt-3 ml-10 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex flex-col sm:flex-row items-center gap-3">
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex-grow">AI ได้เสนอแผนใหม่ให้คุณแล้ว</p>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => onApplyNewPlan(msg.proposedPlan as MealPlan)} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors">
                                           <CheckIcon className="w-4 h-4" />
                                           <span>ยืนยัน</span>
                                        </button>
                                        <button onClick={() => handleCancelProposal(index)} className="flex items-center gap-1.5 bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors">
                                            <XIcon className="w-4 h-4"/>
                                            <span>ยกเลิก</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex items-end gap-2">
                             <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">AI</div>
                             <div className="max-w-[80%] p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none">
                                <div className="flex gap-1.5">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                 </main>
                 <footer className="p-2 border-t border-slate-200 dark:border-slate-700">
                     <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="พิมพ์คำถามของคุณที่นี่..."
                            rows={1}
                            className="flex-1 resize-none bg-slate-100 dark:bg-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isThinking}
                        />
                         <button type="submit" disabled={isThinking || !userInput.trim()} className="h-10 w-10 flex items-center justify-center bg-blue-600 text-white rounded-full disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors">
                            <SendIcon className="w-5 h-5"/>
                         </button>
                     </form>
                 </footer>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData>({
    age: '',
    height: '',
    weight: '',
    diseases: '',
    exercise: [],
    customExercise: '',
    budget: '',
    takesMedication: false,
    medications: [],
    favoriteFoods: '',
    convenientFoods: '',
  });
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlanSaved, setIsPlanSaved] = useState<boolean>(false);
  const [aiInstance, setAiInstance] = useState<GoogleGenAI | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Check for API key first
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
        try {
            const ai = new GoogleGenAI({ apiKey: storedApiKey });
            setAiInstance(ai);
        } catch (e) {
            console.error("Failed to initialize AI with stored key:", e);
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        }
    }
  }, []);

  useEffect(() => {
    if (!aiInstance) return; // Don't proceed if AI is not initialized

    try {
        const savedPlanJson = localStorage.getItem(SAVED_PLAN_KEY);
        if (savedPlanJson) {
            const savedPlan = JSON.parse(savedPlanJson)
            setPlan(savedPlan);
            initializeChat(healthData, savedPlan)
        }
    } catch (e) {
        console.error("Failed to load or parse saved plan:", e);
        localStorage.removeItem(SAVED_PLAN_KEY);
    }
  }, [aiInstance]); // Re-run when aiInstance is available

  const initializeChat = (currentHealthData: HealthData, currentPlan: MealPlan) => {
        if (!aiInstance) return;

        const systemInstruction = `คุณคือ 'Healthie' ผู้ช่วยด้านสุขภาพ AI ที่เป็นมิตรและให้กำลังใจจากประเทศไทย วัตถุประสงค์ของคุณคือการช่วยให้ผู้ใช้สูงอายุเข้าใจและปฏิบัติตามแผนสุขภาพส่วนบุคคลของพวกเขา คุณจะได้รับโปรไฟล์สุขภาพของผู้ใช้และแผน 7 วันของพวกเขาเป็นบริบท โปรดใช้ข้อมูลนี้เป็นฐานในการตอบคำถาม ใช้ภาษาไทยที่เรียบง่าย ชัดเจน และให้กำลังใจ คุณสามารถอธิบายส่วนต่างๆ ของแผน แนะนำการปรับเปลี่ยนสูตรง่ายๆ หากถูกถาม อธิบายประโยชน์ของอาหารหรือการออกกำลังกายบางอย่าง และให้กำลังใจโดยทั่วไป อย่าให้คำแนะนำทางการแพทย์ที่ขัดแย้งกับคำสั่งของแพทย์ หากถูกถามเกี่ยวกับหัวข้อที่นอกเหนือจากสุขภาพและความเป็นอยู่ที่ดี ให้นำการสนทนากลับมาที่แผนสุขภาพของพวกเขาอย่างนุ่มนวล

**คำสั่งที่สำคัญที่สุด:** เมื่อผู้ใช้ขอแก้ไขแผนของพวกเขา (เช่น เปลี่ยนอาหาร, เพิ่มการออกกำลังกาย) คุณ **ต้อง** สร้างแผนสุขภาพใหม่ทั้งหมด 7 วันตามคำขอและข้อมูลสุขภาพเดิมทั้งหมดของพวกเขา โดยปฏิบัติตามกฎการสร้างแผนดังนี้:
1.  **แผนอาหาร**: ต้องเหมาะสมกับผู้ใช้และมีความหลากหลาย
2.  **แผนการออกกำลังกาย**: ต้องยึดตามกิจกรรมที่ผู้ใช้สนใจเท่านั้น และสร้างโปรแกรมที่เกี่ยวข้อง 3-5 รูปแบบเป็นตัวเลือกในแต่ละวัน **ห้าม** เพิ่มการออกกำลังกายที่ผู้ใช้ไม่ได้เลือกไว้ในข้อมูลสุขภาพเดิม

คำตอบของคุณสำหรับการแก้ไขแผน **ต้อง** เป็นออบเจ็กต์ JSON ที่ถูกต้องเพียงออบเจ็กต์เดียวซึ่งมีโครงสร้างที่แน่นอนดังนี้:
{
  "responseText": "ข้อความสนทนาที่ยืนยันการเปลี่ยนแปลงและนำเสนอแผนใหม่",
  "newPlan": { ...ออบเจ็กต์ MealPlan ทั้งหมดที่ตรงกับสคีมาที่ต้องการ... }
}
สำหรับการสนทนาทั่วไปหรือคำถามอื่นๆ ให้ตอบเป็นข้อความธรรมดาเท่านั้น อย่าห่อหุ้มคำตอบที่เป็นการสนทนาด้วย JSON`;
        
        const initialContextMessage = `นี่คือข้อมูลสุขภาพและแผนของฉัน: \nข้อมูลสุขภาพ: ${JSON.stringify(currentHealthData)}\nแผนสุขภาพ: ${JSON.stringify(currentPlan)}\n\nกรุณาตอบคำถามของฉันจากข้อมูลเหล่านี้`;

        const newChat = aiInstance.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
            history: [{ role: 'user', parts: [{ text: initialContextMessage }] }, {role: 'model', parts: [{text: 'สวัสดีค่ะ Healthie ยินดีให้บริการค่ะ มีอะไรให้ช่วยเกี่ยวกับแผนสุขภาพของคุณวันนี้คะ?'}]}]
        });
        setChatSession(newChat);
  }

  const handleGenerate = useCallback(async () => {
    if (!healthData.age || !healthData.height || !healthData.weight || !aiInstance) return;

    setIsLoading(true);
    setError(null);
    setPlan(null);
    setChatSession(null);
    setIsPlanSaved(false);
    localStorage.removeItem(SAVED_PLAN_KEY); // Clear old saved plan on new generation

    try {
      const generatedPlan = await generateMealPlan(aiInstance, healthData);
      setPlan(generatedPlan);
      initializeChat(healthData, generatedPlan);

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [healthData, aiInstance]);

  const handleSavePlan = useCallback(() => {
    if (plan) {
        try {
            localStorage.setItem(SAVED_PLAN_KEY, JSON.stringify(plan));
            setIsPlanSaved(true);
            setTimeout(() => setIsPlanSaved(false), 3000); // Show confirmation for 3 seconds
        } catch (e) {
            console.error("Failed to save plan:", e);
            setError("ไม่สามารถบันทึกแผนได้ พื้นที่จัดเก็บอาจเต็ม");
        }
    }
  }, [plan]);

  const handleApplyNewPlan = (newPlan: MealPlan) => {
    setPlan(newPlan);
    setIsChatOpen(false);
    // Re-initialize chat with the new context
    initializeChat(healthData, newPlan);
    // Save the new plan to local storage
    localStorage.setItem(SAVED_PLAN_KEY, JSON.stringify(newPlan));
    setIsPlanSaved(true);
    setTimeout(() => setIsPlanSaved(false), 3000);
  };

  const handleApiKeySubmit = (apiKey: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        setAiInstance(ai);
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } catch(e) {
        // This catch block might not be effective for invalid keys,
        // as the constructor might not throw. Errors will be caught on API calls.
        console.error("Failed to initialize AI:", e);
    }
  };
  
  if (!aiInstance) {
    return <ApiKeyModal onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 relative">
      <header className="flex-shrink-0 bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 px-6 py-3 flex items-center gap-2">
        <AppleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          AI Health Planner
        </h1>
      </header>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <div className="flex-shrink-0 lg:h-full lg:overflow-y-auto">
             <InputPanel 
                healthData={healthData}
                setHealthData={setHealthData}
                onGenerate={handleGenerate}
                isLoading={isLoading}
            />
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/20 lg:h-full lg:overflow-y-auto">
             <OutputPanel 
                ai={aiInstance}
                plan={plan}
                isLoading={isLoading}
                error={error}
                onSavePlan={handleSavePlan}
                isPlanSaved={isPlanSaved}
                healthData={healthData}
            />
        </div>
      </main>
      
      {plan && chatSession && (
         <>
            <button 
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white h-12 px-5 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 flex items-center justify-center gap-2 z-30"
                aria-label="Open AI health assistant"
            >
                <ChatBubbleIcon className="w-6 h-6"/>
                <span className="font-semibold">ปรึกษาผู้ช่วย AI</span>
            </button>
            <ChatBot 
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                chatSession={chatSession}
                onApplyNewPlan={handleApplyNewPlan}
            />
         </>
      )}

    </div>
  );
};

export default App;