

import { GoogleGenAI, Type } from "@google/genai";
import { MealPlan, HealthData, MealOption, dayOrder, Selections, ShoppingListCategory } from "../types";

const mealOptionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "ชื่อเมนูอาหาร" },
        calories: { type: Type.NUMBER, description: "ปริมาณแคลอรี่โดยประมาณของเมนูนี้" },
        cost: { type: Type.STRING, description: "ประมาณการราคาของเมนูนี้ (บาท) เช่น '40-50 บาท'" },
        ingredients: {
            type: Type.ARRAY,
            description: "รายการวัตถุดิบที่จำเป็นสำหรับทำเมนูนี้ (เช่น 'เนื้อหมู 100g', 'ไข่ไก่ 1 ฟอง', 'คะน้า 50g')",
            items: { type: Type.STRING }
        }
    },
    required: ["name", "calories", "cost", "ingredients"]
};

const mealSchema = {
    type: Type.OBJECT,
    properties: {
        dailyCost: { type: Type.STRING, description: "ประมาณการค่าใช้จ่ายรวมสำหรับทั้ง 3 มื้อในวันนี้ (บาท) เช่น '150-200 บาท'" },
        breakfast: { 
            type: Type.ARRAY, 
            description: "รายการเมนูอาหารเช้า (2 ตัวเลือก) พร้อมแคลอรี่ ราคา และวัตถุดิบ",
            items: mealOptionSchema 
        },
        lunch: { 
            type: Type.ARRAY, 
            description: "รายการเมนูอาหารกลางวัน (2 ตัวเลือก) พร้อมแคลอรี่ ราคา และวัตถุดิบ",
            items: mealOptionSchema 
        },
        dinner: { 
            type: Type.ARRAY, 
            description: "รายการเมนูอาหารเย็น (2 ตัวเลือก) พร้อมแคลอรี่ ราคา และวัตถุดิบ",
            items: mealOptionSchema 
        },
        rationale: { type: Type.STRING, description: "คำอธิบายสั้นๆ (2-3 ประโยค) ว่าทำไมชุดอาหารสำหรับวันนี้ (ตามตัวเลือกแรกที่ให้) จึงดีต่อสุขภาพของผู้ใช้ และให้สารอาหารหลักอะไรบ้าง" },
    },
    required: ["dailyCost", "breakfast", "lunch", "dinner", "rationale"],
};

const exerciseOptionSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "ชื่อกิจกรรมการออกกำลังกาย" },
        target: { type: Type.STRING, description: "เป้าหมายของกิจกรรม เช่น '30 นาที', '2 กิโลเมตร', หรือ '3 เซต x 10 ครั้ง'" },
        caloriesBurned: { type: Type.NUMBER, description: "ปริมาณแคลอรี่ที่เผาผลาญโดยประมาณจากกิจกรรมนี้" }
    },
    required: ["name", "target", "caloriesBurned"]
};

const exercisePlanSchema = {
    type: Type.OBJECT,
    properties: {
        monday: { type: Type.ARRAY, items: exerciseOptionSchema, description: "รายการกิจกรรมการออกกำลังกายสำหรับวันจันทร์" },
        tuesday: { type: Type.ARRAY, items: exerciseOptionSchema, description: "รายการกิจกรรมการออกกำลังกายสำหรับวันอังคาร" },
        wednesday: { type: Type.ARRAY, items: exerciseOptionSchema, description: "รายการกิจกรรมการออกกำลังกายสำหรับวันพุธ" },
        thursday: { type: Type.ARRAY, items: exerciseOptionSchema, description: "รายการกิจกรรมการออกกำลังกายสำหรับวันพฤหัสบดี" },
        friday: { type: Type.ARRAY, items: exerciseOptionSchema, description: "รายการกิจกรรมการออกกำลังกายสำหรับวันศุกร์" },
        saturday: { type: Type.ARRAY, items: exerciseOptionSchema, description: "รายการกิจกรรมการออกกำลังกายสำหรับวันเสาร์" },
        sunday: { type: Type.ARRAY, items: exerciseOptionSchema, description: "รายการกิจกรรมการออกกำลังกายสำหรับวันอาทิตย์ หรือ 'พักผ่อน'" },
    },
    required: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "บทสรุปภาพรวมและคำแนะนำว่าทำไมแผนสุขภาพนี้จึงเหมาะสมกับผู้ใช้ โดยอ้างอิงจากข้อมูลที่ได้รับ" },
        estimatedCost: { type: Type.STRING, description: "ประมาณการค่าใช้จ่ายสำหรับอาหารทั้งสัปดาห์ เป็นสกุลเงินบาท เช่น '1,200 - 1,500 บาท'" },
        weeklyPlan: {
            type: Type.OBJECT,
            properties: {
                monday: mealSchema,
                tuesday: mealSchema,
                wednesday: mealSchema,
                thursday: mealSchema,
                friday: mealSchema,
                saturday: mealSchema,
                sunday: mealSchema,
            },
            required: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        },
        weeklyExercisePlan: { ...exercisePlanSchema, description: "แผนการออกกำลังกายรายสัปดาห์ที่เหมาะสมพร้อมตัวเลือก,เป้าหมาย และแคลอรี่ที่เผาผลาญ" },
        totalCaloriesBurned: { type: Type.NUMBER, description: "ผลรวมแคลอรี่ที่เผาผลาญโดยประมาณจากการออกกำลังกายตลอดทั้งสัปดาห์ (ใช้ค่าเฉลี่ยจากตัวเลือกแรกของแต่ละวัน)"},
        recommendedSleep: { type: Type.STRING, description: "คำแนะนำเรื่องการนอนหลับพักผ่อนที่เหมาะสม เช่น 'ควรนอนหลับ 7-8 ชั่วโมงต่อคืน โดยเข้านอนเวลา 22:00 น. และตื่นนอนเวลา 6:00 น.'" },
    },
     required: ["summary", "estimatedCost", "weeklyPlan", "weeklyExercisePlan", "totalCaloriesBurned", "recommendedSleep"],
};

export const generateMealPlan = async (ai: GoogleGenAI, data: HealthData): Promise<MealPlan> => {
    
    const heightInMeters = parseFloat(data.height) / 100;
    const weight = parseFloat(data.weight);
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    
    const medicationInfo = data.takesMedication && data.medications.length > 0
        ? `\n- ยาที่ใช้ประจำ: ${data.medications.map(m => `${m.name} (ขนาด ${m.dosage}, เวลา ${m.time})`).join(', ')} (โปรดพิจารณาอาหารที่อาจมีผลกับยาเหล่านี้)`
        : '\n- ยาที่ใช้ประจำ: ไม่มี';

    const favoriteFoodsInfo = data.favoriteFoods ? `\n- เมนูโปรดของผู้ใช้ (พยายามแทรกในแผนถ้าเหมาะสม): ${data.favoriteFoods}` : '';
    const customExerciseInfo = data.customExercise ? `\n- กิจกรรมอื่นๆ ที่ผู้ใช้ระบุเอง: ${data.customExercise}` : '';
    const convenientFoodsInfo = data.convenientFoods ? `\n- วัตถุดิบ/เมนูที่สะดวกซื้อ (สำคัญมาก ให้เน้นรายการเหล่านี้): ${data.convenientFoods}` : '';

    const prompt = `
        คุณคือสุดยอดนักโภชนาการ นักกายภาพบำบัด และผู้เชี่ยวชาญด้านการนอน ที่เชี่ยวชาญด้านการวางแผนสุขภาพองค์รวมสำหรับผู้สูงอายุในประเทศไทย

        โปรดสร้าง **แผนสุขภาพแบบองค์รวม 7 วัน** (วันจันทร์ถึงวันอาทิตย์) โดยพิจารณาจากข้อมูลของผู้ใช้ดังต่อไปนี้:
        - อายุ: ${data.age} ปี
        - น้ำหนัก: ${data.weight} กก.
        - ส่วนสูง: ${data.height} ซม.
        - ดัชนีมวลกาย (BMI): ${bmi}
        - โรคประจำตัว: ${data.diseases || 'ไม่มี'}
        - กิจกรรมการออกกำลังกายที่สนใจ: ${data.exercise.join(', ') || 'ไม่ระบุ'}
        ${customExerciseInfo}
        - งบประมาณอาหารต่อสัปดาห์: ${data.budget || 'ไม่จำกัด'} บาท
        ${medicationInfo}
        ${favoriteFoodsInfo}
        ${convenientFoodsInfo}

        คำแนะนำในการสร้างแผน:
        1.  **แผนอาหาร**:
            -   **เน้นความสะดวก (สำคัญที่สุด)**: **ให้ความสำคัญสูงสุด** กับการใช้รายการ "วัตถุดิบ/เมนูที่สะดวกซื้อ" ที่ผู้ใช้ระบุมา (${data.convenientFoods || 'ไม่มีข้อมูล'}) มาประกอบเป็นเมนูหลักในแผนให้ได้มากที่สุดเท่าที่จะเป็นไปได้ เพื่อให้ผู้ใช้ไม่ต้องลำบากในการจัดหาอาหาร หากผู้ใช้ระบุเป็นวัตถุดิบ (เช่น ไข่, ไก่, ผักคะน้า) ให้นำมาสร้างสรรค์เป็นเมนูที่เหมาะสม หากผู้ใช้ระบุเป็นเมนูสำเร็จรูป ให้นำเมนูนั้นมาใส่ในแผนโดยตรง
            -   **สุขภาพต้องมาก่อน**: ถึงแม้จะเน้นความสะดวก เมนูทั้งหมดต้องเหมาะสมกับวัย ภาวะสุขภาพ และยาที่ผู้ใช้ทาน หลีกเลี่ยงอาหารที่อาจเป็นอันตรายต่อโรคประจำตัวที่ระบุ
            -   **ความหลากหลาย**: สร้างสรรค์เมนูที่หลากหลาย ไม่ซ้ำซากจำเจในแต่ละวันและตลอดทั้งสัปดาห์ โดยยังคงยึดจากวัตถุดิบที่สะดวกซื้อเป็นหลัก
            -   **เมนูทางเลือก**: สำหรับแต่ละมื้อ (เช้า, กลางวัน, เย็น) ของทุกวัน โปรดเสนอเมนูอาหาร **2** อย่างเป็นตัวเลือก
            -   **วัตถุดิบ (สำคัญมาก)**: สำหรับแต่ละเมนู ต้องระบุรายการวัตถุดิบ (ingredients) ที่จำเป็นอย่างละเอียด (เช่น 'เนื้อหมู 100g', 'ไข่ไก่ 1 ฟอง', 'คะน้า 50g')
            -   **แคลอรี่และราคา**: **ต้องระบุปริมาณแคลอรี่และราคาโดยประมาณสำหรับทุกเมนู**
            -   **คุมงบประมาณ**: ประเมินค่าใช้จ่ายรายวัน (dailyCost) และภาพรวมรายสัปดาห์ (estimatedCost) ให้ใกล้เคียงกับงบที่กำหนด
            -   **วัตถุดิบท้องถิ่น**: ใช้ส่วนผสมที่หาซื้อง่ายในตลาดหรือซูเปอร์มาร์เก็ตทั่วไปในประเทศไทย
            -   **คำอธิบายรายวัน (Rationale)**: สำหรับแต่ละวัน ให้เขียนคำอธิบายสั้นๆ (2-3 ประโยค) ว่าทำไมชุดอาหาร (ตามตัวเลือกแรกที่ให้) จึงดีต่อสุขภาพของผู้ใช้ และให้สารอาหารหลักอะไรบ้าง

        2.  **แผนการออกกำลังกาย (สำคัญมาก!):**
            -   **ยึดตามความสนใจของผู้ใช้เป็นหลัก**: แผนการออกกำลังกายในแต่ละวัน **ต้อง** สร้างขึ้นโดยอิงจากกิจกรรมที่ผู้ใช้เลือกไว้เท่านั้น (${data.exercise.join(', ') || 'ไม่ระบุ'}${customExerciseInfo}).
            -   **ออกแบบโปรแกรมที่เกี่ยวข้อง**: สำหรับแต่ละวัน ให้สร้างสรรค์โปรแกรมการออกกำลังกายที่แตกต่างกันประมาณ **2-3 รูปแบบ** เป็นตัวเลือก โดยแต่ละรูปแบบต้องเป็น **รูปแบบย่อยหรือมีความเกี่ยวข้องโดยตรง** กับกิจกรรมหลักที่ผู้ใช้เลือกไว้.
            -   **ตัวอย่าง**: หากผู้ใช้เลือก 'วิ่งในลู่วิ่ง', ตัวเลือกในวันนั้นอาจเป็น: 'วิ่งเหยาะๆ 30 นาที', 'เดินเร็วชัน 20 นาที', 'วิ่งสลับความเร็ว 15 นาที'. หากผู้ใช้เลือก 'โยคะ', ตัวเลือกอาจเป็น 'โยคะยืดเหยียด', 'โยคะสร้างความแข็งแรง', 'โยคะเพื่อการทรงตัว'. **ห้าม** เสนอการออกกำลังกายที่ผู้ใช้ไม่ได้เลือก เช่น หากผู้ใช้เลือก 'วิ่ง' ก็ห้ามเสนอ 'ว่ายน้ำ' ในแผน.
            -   **เป้าหมายและแคลอรี่**: แต่ละตัวเลือกต้องระบุ **เป้าหมายที่ชัดเจน (target)** (เช่น '30 นาที', '2 กม.') และ **ปริมาณแคลอรี่ที่เผาผลาญ (caloriesBurned)** ซึ่งต้องคำนวณอย่างแม่นยำตามข้อมูลส่วนตัวของผู้ใช้.
            -   กำหนดวันพักผ่อนที่เหมาะสม (อย่างน้อย 1-2 วัน) โดยอาจให้เป็น 'พักผ่อน' หรือ 'ยืดเส้นยืดสายเบาๆ'.

        3.  **การนอนหลับ**:
            -   ให้คำแนะนำเรื่องการนอนหลับที่เหมาะสมกับวัยของผู้ใช้ ทั้งจำนวนชั่วโมงและช่วงเวลาที่แนะนำ

        4.  **ภาพรวม**:
            -   เขียนบทสรุปสั้นๆ ว่าทำไมแผนนี้ถึงดีต่อสุขภาพของผู้ใช้
            -   เนื้อหาทั้งหมดต้องเป็นภาษาไทย

        โปรดสร้างผลลัพธ์ตามโครงสร้าง JSON ที่กำหนดอย่างเคร่งครัด
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.6,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText.startsWith('{')) {
             throw new Error("AI response is not in the expected JSON format.");
        }
       
        return JSON.parse(jsonText) as MealPlan;

    } catch (e) {
        console.error("Error generating meal plan:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during AI generation.";
        if (errorMessage.includes("API key not valid")) {
             throw new Error("API Key ที่ให้มาไม่ถูกต้อง โปรดตรวจสอบและลองอีกครั้ง");
        }
        throw new Error(`ไม่สามารถสร้างแผนสุขภาพได้ โปรดลองอีกครั้งในภายหลัง หรือปรับข้อมูลที่กรอก: ${errorMessage}`);
    }
};


export const generateDailyRationale = async (
    ai: GoogleGenAI,
    day: string, 
    meals: { breakfast?: MealOption; lunch?: MealOption; dinner?: MealOption },
    healthData: HealthData
): Promise<{ rationale: string }> => {
    
    const prompt = `
        ผู้ใช้รายนี้มีข้อมูลสุขภาพดังนี้:
        - อายุ: ${healthData.age} ปี
        - โรคประจำตัว: ${healthData.diseases || 'ไม่มี'}
        - ยาที่ใช้: ${healthData.takesMedication ? healthData.medications.map(m => m.name).join(', ') : 'ไม่มี'}

        สำหรับ **${day}** ผู้ใช้ได้เลือกเมนูอาหารดังนี้:
        - มื้อเช้า: ${meals.breakfast?.name ?? 'ไม่ได้เลือก'} (ราคา ${meals.breakfast?.cost ?? 'N/A'})
        - มื้อกลางวัน: ${meals.lunch?.name ?? 'ไม่ได้เลือก'} (ราคา ${meals.lunch?.cost ?? 'N/A'})
        - มื้อเย็น: ${meals.dinner?.name ?? 'ไม่ได้เลือก'} (ราคา ${meals.dinner?.cost ?? 'N/A'})
        
        จากข้อมูลข้างต้น โปรดวิเคราะห์และให้ **คำอธิบายทางโภชนาการสั้นๆ (2-3 ประโยค)** ว่าชุดอาหารที่ผู้ใช้เลือกในวันนี้เหมาะสมกับสุขภาพของเขาอย่างไร และให้สารอาหารที่สำคัญอะไรบ้าง
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rationale: { type: Type.STRING }
                    },
                    required: ["rationale"]
                },
                temperature: 0.3
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as { rationale: string };

    } catch (e) {
        console.error("Error generating daily rationale:", e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error.";
        throw new Error(`Failed to generate rationale: ${errorMessage}`);
    }
};

export const generateShoppingList = async (
    ai: GoogleGenAI,
    plan: MealPlan,
    selections: Selections
): Promise<{ shoppingList: ShoppingListCategory[] }> => {

    // Create a detailed list of ingredients with context (day, meal)
    const ingredientsWithContext = dayOrder.flatMap(day => {
        const dayPlan = plan.weeklyPlan[day];
        const daySelections = selections[day];
        if (!dayPlan || !daySelections) return [];

        const breakfast = dayPlan.breakfast[daySelections.breakfast ?? 0];
        const lunch = dayPlan.lunch[daySelections.lunch ?? 0];
        const dinner = dayPlan.dinner[daySelections.dinner ?? 0];
        
        const meals = [
            { meal: breakfast, day: day, mealName: breakfast?.name },
            { meal: lunch, day: day, mealName: lunch?.name },
            { meal: dinner, day: day, mealName: dinner?.name },
        ];

        return meals.flatMap(m => 
            m.meal?.ingredients?.map(ing => ({
                raw: ing,
                day: m.day,
                meal: m.mealName ?? 'N/A'
            })) ?? []
        );
    });

    if (ingredientsWithContext.length === 0) {
        return { shoppingList: [{ category: 'ข้อมูลไม่เพียงพอ', items: [] }] };
    }
    
    const ingredientsString = ingredientsWithContext.map(i => `${i.raw} (ใช้ในเมนู '${i.meal}' วัน${i.day})`).join('; ');

    const prompt = `
        คุณคือผู้ช่วยจัดซื้อของเข้าครัวอัจฉริยะและนักโภชนาการ
        โปรดจัดระเบียบรายการวัตถุดิบต่อไปนี้ให้อยู่ในรูปแบบรายการซื้อของที่ชาญฉลาดและละเอียดสำหรับผู้สูงอายุในประเทศไทย:
        
        "${ingredientsString}"

        คำแนะนำที่สำคัญมาก (ต้องทำตามทุกข้อ):
        1.  **รวมปริมาณ (Aggregate Quantities)**: รวมปริมาณของวัตถุดิบชนิดเดียวกันทั้งหมดให้เป็นยอดเดียว ตัวอย่าง: ถ้าเจอ 'เนื้อหมู 100g' และ 'เนื้อหมู 150g' ในรายการ ให้รวมเป็น 'เนื้อหมู 250g' รายการเดียว
        2.  **ประมาณการราคา (Estimate Cost)**: สำหรับวัตถุดิบแต่ละรายการที่รวมแล้ว, ให้ประเมินราคาเป็นบาท (เช่น 'ประมาณ 50-60 บาท' หรือ '20 บาท').
        3.  **ระบุการใช้งาน (Specify Usage)**: สำหรับแต่ละวัตถุดิบ, ให้รวบรวมข้อมูลทั้งหมดว่ามันถูกใช้ใน **เมนูอะไร** และใน **วันไหน** ของสัปดาห์บ้าง (เช่น [{day: "monday", meal: "ข้าวผัด"}, {day: "wednesday", meal: "ผัดกะเพรา"}]).
        4.  **ระบุวันแรกที่ใช้ (First Used On Day)**: สำหรับแต่ละวัตถุดิบ, ให้ระบุ **วันแรก** ที่มันถูกนำมาใช้ในแผน (ค่าต้องเป็น: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'). หากไม่สามารถระบุได้ให้ใช้ 'unknown'.
        5.  **จัดกลุ่ม (Categorize)**: จัดกลุ่มวัตถุดิบทั้งหมดตามหมวดหมู่ที่เหมาะสมสำหรับการเดินซื้อของในซูเปอร์มาร์เก็ตไทย เช่น "ผักและผลไม้", "เนื้อสัตว์และโปรตีน", "ของสด/ของชำ", "เครื่องปรุงและของแห้ง", "อื่นๆ"
        6.  **ผลลัพธ์**: ตอบกลับเป็นภาษาไทยทั้งหมด และใช้โครงสร้าง JSON ที่กำหนดเท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON

    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            shoppingList: {
                type: Type.ARRAY,
                description: "รายการซื้อของที่จัดหมวดหมู่และรวมปริมาณแล้ว",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, description: "ชื่อหมวดหมู่ (เช่น 'ผักและผลไม้')" },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "ชื่อวัตถุดิบ (เช่น 'เนื้อหมู')" },
                                    quantity: { type: Type.STRING, description: "ปริมาณรวมทั้งหมด (เช่น '250g', '3 ฟอง')" },
                                    estimatedCost: { type: Type.STRING, description: "ราคาโดยประมาณ (เช่น '50 บาท')" },
                                    firstUsedOnDay: { type: Type.STRING, enum: [...dayOrder, 'unknown'], description: "วันแรกในสัปดาห์ที่วัตถุดิบนี้ถูกใช้" },
                                    usage: {
                                        type: Type.ARRAY,
                                        description: "รายการว่าวัตถุดิบนี้ใช้ทำเมนูอะไรในวันไหนบ้าง",
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                day: { type: Type.STRING, enum: dayOrder, description: "วันที่ใช้ (monday, tuesday, etc.)" },
                                                meal: { type: Type.STRING, description: "ชื่อเมนูที่ใช้วัตถุดิบนี้" }
                                            },
                                            required: ["day", "meal"]
                                        }
                                    }
                                },
                                required: ["name", "quantity", "estimatedCost", "usage", "firstUsedOnDay"]
                            },
                            description: "รายการวัตถุดิบในหมวดหมู่นั้นพร้อมปริมาณรวมและข้อมูลการใช้งาน"
                        }
                    },
                    required: ["category", "items"]
                }
            }
        },
        required: ["shoppingList"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.1
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error generating shopping list:", e);
        throw new Error("ไม่สามารถสร้างรายการซื้อของได้ โปรดลองอีกครั้ง");
    }
};
