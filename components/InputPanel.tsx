import React, { useMemo } from 'react';
import { HealthData, exerciseOptions, Medication } from '../types';
import { WandIcon, PillIcon, Trash2Icon } from './icons';

interface InputPanelProps {
  healthData: HealthData;
  setHealthData: (data: HealthData) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
  healthData,
  setHealthData,
  onGenerate,
  isLoading,
}) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setHealthData({ ...healthData, [id]: value });
  };

  const handleExerciseChange = (exercise: string) => {
    const newExercises = healthData.exercise.includes(exercise)
      ? healthData.exercise.filter(e => e !== exercise)
      : [...healthData.exercise, exercise];
    setHealthData({ ...healthData, exercise: newExercises });
  };

  const handleTakesMedicationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const takesMeds = e.target.value === 'yes';
    setHealthData({ 
        ...healthData, 
        takesMedication: takesMeds,
        // Reset medications if user selects "No"
        medications: takesMeds && healthData.medications.length === 0 ? [{ id: Date.now(), name: '', dosage: '', time: '' }] : (takesMeds ? healthData.medications : [])
    });
  };

  const handleAddMedication = () => {
    if (healthData.medications.length < 5) {
      setHealthData({
        ...healthData,
        medications: [...healthData.medications, { id: Date.now(), name: '', dosage: '', time: '' }]
      });
    }
  };

  const handleRemoveMedication = (id: number) => {
    setHealthData({
      ...healthData,
      medications: healthData.medications.filter(med => med.id !== id)
    });
  };

  const handleMedicationChange = (id: number, field: keyof Omit<Medication, 'id'>, value: string) => {
    setHealthData({
      ...healthData,
      medications: healthData.medications.map(med => med.id === id ? { ...med, [field]: value } : med)
    });
  };

  const { bmi, bmiInterpretation, bmiColorClass } = useMemo(() => {
    const height = parseFloat(healthData.height);
    const weight = parseFloat(healthData.weight);
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmiValue = weight / (heightInMeters * heightInMeters);
      let interpretation = '';
      let colorClass = '';

      if (bmiValue < 18.5) {
        interpretation = 'น้ำหนักน้อยกว่าเกณฑ์';
        colorClass = 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50';
      } else if (bmiValue >= 18.5 && bmiValue < 23) {
        interpretation = 'น้ำหนักปกติ (สมส่วน)';
        colorClass = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50';
      } else if (bmiValue >= 23 && bmiValue < 25) {
        interpretation = 'น้ำหนักเกิน';
        colorClass = 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/50';
      } else if (bmiValue >= 25 && bmiValue < 30) {
        interpretation = 'โรคอ้วนระดับที่ 1';
        colorClass = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50';
      } else {
        interpretation = 'โรคอ้วนระดับที่ 2';
        colorClass = 'text-red-700 dark:text-red-500 bg-red-100 dark:bg-red-900/50';
      }

      return { bmi: bmiValue.toFixed(2), bmiInterpretation: interpretation, bmiColorClass: colorClass };
    }
    return { bmi: null, bmiInterpretation: null, bmiColorClass: '' };
  }, [healthData.height, healthData.weight]);

  const isFormValid = healthData.age && healthData.height && healthData.weight;
  const inputStyleClasses = "block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500";

  return (
    <div className="p-6 lg:p-8 bg-white dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700/50 flex flex-col h-full">
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          กรอกข้อมูลสุขภาพของคุณ
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          เพื่อให้ AI สร้างแผนอาหารที่เหมาะสมที่สุดสำหรับคุณ
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">ข้อมูลส่วนตัว</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">อายุ (ปี)</label>
                <input type="number" id="age" value={healthData.age} onChange={handleInputChange} className={inputStyleClasses} placeholder="เช่น 65"/>
              </div>
               <div>
                <label htmlFor="budget" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">งบประมาณ/สัปดาห์ (บาท)</label>
                <input type="number" id="budget" value={healthData.budget} onChange={handleInputChange} className={inputStyleClasses} placeholder="เช่น 1500" />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ส่วนสูง (ซม.)</label>
                <input type="number" id="height" value={healthData.height} onChange={handleInputChange} className={inputStyleClasses} placeholder="เช่น 160" />
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">น้ำหนัก (กก.)</label>
                <input type="number" id="weight" value={healthData.weight} onChange={handleInputChange} className={inputStyleClasses} placeholder="เช่น 55" />
              </div>
            </div>
            {bmi && (
                <div className={`mt-4 p-3 rounded-lg text-center transition-colors duration-300 ${bmiColorClass}`}>
                    <span className="text-sm font-medium ">ดัชนีมวลกาย (BMI): </span>
                    <span className="text-lg font-bold ">{bmi}</span>
                    <span className="block text-sm font-semibold">{bmiInterpretation}</span>
                </div>
            )}
          </div>
          
          <div>
            <label htmlFor="diseases" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              โรคประจำตัว (ถ้ามี)
            </label>
            <textarea
              id="diseases"
              rows={2}
              value={healthData.diseases}
              onChange={handleInputChange}
              className={inputStyleClasses}
              placeholder="เช่น เบาหวาน, ความดันโลหิตสูง, โรคไต"
            />
          </div>

          <div>
            <label htmlFor="favoriteFoods" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              เมนูโปรด (ถ้ามี)
            </label>
            <textarea
              id="favoriteFoods"
              rows={2}
              value={healthData.favoriteFoods}
              onChange={handleInputChange}
              className={inputStyleClasses}
              placeholder="เช่น ข้าวผัด, ก๋วยเตี๋ยว (คั่นด้วยจุลภาค)"
            />
          </div>

          <div>
            <label htmlFor="convenientFoods" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              อาหารที่ฉันสะดวกซื้อ (วัตถุดิบหรือเมนู)
            </label>
            <textarea
              id="convenientFoods"
              rows={2}
              value={healthData.convenientFoods}
              onChange={handleInputChange}
              className={inputStyleClasses}
              placeholder="เช่น ไข่, ไก่, ผักคะน้า, หรือเมนูจากร้านอาหารใกล้บ้าน"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">AI จะพยายามจัดหาเมนูจากรายการนี้ เพื่อให้คุณสะดวกที่สุด</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-2 flex items-center gap-2">
                <PillIcon className="w-5 h-5"/>
                ข้อมูลการใช้ยา
            </h3>
             <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                    <input type="radio" name="takesMedication" value="no" checked={!healthData.takesMedication} onChange={handleTakesMedicationChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                    <span>ไม่ได้รับประทานยา</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="radio" name="takesMedication" value="yes" checked={healthData.takesMedication} onChange={handleTakesMedicationChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                    <span>รับประทานยา</span>
                </label>
             </div>
             {healthData.takesMedication && (
                 <div className="mt-4 space-y-4">
                     {healthData.medications.map((med, index) => (
                         <div key={med.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                               <p className="font-semibold text-slate-700 dark:text-slate-200">ยาชนิดที่ {index + 1}</p>
                               <button onClick={() => handleRemoveMedication(med.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full">
                                   <Trash2Icon className="w-4 h-4" />
                               </button>
                            </div>
                            <input type="text" placeholder="ชื่อยา" value={med.name} onChange={(e) => handleMedicationChange(med.id, 'name', e.target.value)} className={inputStyleClasses} />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="ขนาด/จำนวน" value={med.dosage} onChange={(e) => handleMedicationChange(med.id, 'dosage', e.target.value)} className={inputStyleClasses} />
                                <input type="text" placeholder="เวลา (เช่น หลังอาหารเช้า)" value={med.time} onChange={(e) => handleMedicationChange(med.id, 'time', e.target.value)} className={inputStyleClasses} />
                            </div>
                         </div>
                     ))}
                     {healthData.medications.length < 5 && (
                         <button onClick={handleAddMedication} className="w-full text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900">
                           + เพิ่มรายการยา
                         </button>
                     )}
                 </div>
             )}
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              กิจกรรม/การออกกำลังกายที่สนใจ (เลือกได้มากกว่า 1)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {exerciseOptions.map(option => (
                <label key={option} className={`flex items-center space-x-2 rounded-md p-2 cursor-pointer transition-colors duration-200 ${healthData.exercise.includes(option) ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <input
                    type="checkbox"
                    checked={healthData.exercise.includes(option)}
                    onChange={() => handleExerciseChange(option)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-800 dark:text-slate-200">{option}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
                <label htmlFor="customExercise" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    กิจกรรมอื่นๆ ที่สนใจ (โปรดระบุ)
                </label>
                <input
                    type="text"
                    id="customExercise"
                    value={healthData.customExercise}
                    onChange={handleInputChange}
                    className={inputStyleClasses}
                    placeholder="เช่น ตีกอล์ฟ, เต้นลีลาศ"
                />
            </div>
          </div>

        </div>
      </div>
      <div className="pt-6 mt-auto">
        <button
          onClick={onGenerate}
          disabled={isLoading || !isFormValid}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-600 transition-colors"
        >
          {isLoading ? (
            'กำลังสร้าง...'
          ) : (
            <>
              <WandIcon className="w-5 h-5 mr-2" />
              สร้างแผนสุขภาพ
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputPanel;