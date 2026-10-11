export type AgeBand = "under12" | "12-17" | "18-64" | "65plus";
export type Concern = "anxiety" | "depression";
export type ScaleId = "GAD7" | "PHQ9" | "GDS15";

export type ScaleItem = {
  id: string;
  text: string;
  scoreForYes?: boolean;
};

export type ScaleDefinition = {
  id: ScaleId;
  name: string;
  recall: string;
  max: number;
  items: ScaleItem[];
  options: { label: string; value: number }[];
  sourceLabel: string;
  sourceUrl: string;
};

const frequencyOptions = [
  { label: "完全没有", value: 0 },
  { label: "有几天", value: 1 },
  { label: "一半以上时间", value: 2 },
  { label: "几乎每天", value: 3 },
];

export const scales: Record<ScaleId, ScaleDefinition> = {
  GAD7: {
    id: "GAD7",
    name: "广泛性焦虑量表 GAD-7",
    recall: "请根据过去两周的实际情况作答。",
    max: 21,
    options: frequencyOptions,
    sourceLabel: "AIMS Center · GAD-7",
    sourceUrl: "https://aims.uw.edu/implementation-tool/measures/",
    items: [
      { id: "gad1", text: "感到紧张、焦虑或坐立不安" },
      { id: "gad2", text: "无法停止或控制担忧" },
      { id: "gad3", text: "对各种事情担忧过多" },
      { id: "gad4", text: "很难放松下来" },
      { id: "gad5", text: "由于不安而无法静坐" },
      { id: "gad6", text: "变得容易烦恼或易怒" },
      { id: "gad7", text: "感到似乎将有可怕的事情发生" },
    ],
  },
  PHQ9: {
    id: "PHQ9",
    name: "患者健康问卷 PHQ-9",
    recall: "请根据过去两周的实际情况作答。",
    max: 27,
    options: frequencyOptions,
    sourceLabel: "APA · PHQ-9 questionnaire",
    sourceUrl: "https://www.apa.org/depression-guideline/patient-health-questionnaire.pdf",
    items: [
      { id: "phq1", text: "做事时提不起劲或没有兴趣" },
      { id: "phq2", text: "感到心情低落、沮丧或绝望" },
      { id: "phq3", text: "入睡困难、睡不安稳或睡眠过多" },
      { id: "phq4", text: "感到疲倦或没有活力" },
      { id: "phq5", text: "食欲不振或吃得太多" },
      { id: "phq6", text: "觉得自己很糟、很失败，或让自己／家人失望" },
      { id: "phq7", text: "对事物专注有困难，例如阅读或看电视" },
      { id: "phq8", text: "动作或说话明显变慢；或相反，烦躁、坐立不安、动来动去" },
      { id: "phq9", text: "有不如死掉或用某种方式伤害自己的念头" },
    ],
  },
  GDS15: {
    id: "GDS15",
    name: "老年抑郁量表简版 GDS-15",
    recall: "请根据最近一周的总体感受选择“是”或“否”。",
    max: 15,
    options: [
      { label: "是", value: 1 },
      { label: "否", value: 0 },
    ],
    sourceLabel: "Stanford · Geriatric Depression Scale",
    sourceUrl: "https://www.stanford.edu/~yesavage/GDS.html",
    items: [
      { id: "gds1", text: "您基本上对自己的生活感到满意吗？", scoreForYes: false },
      { id: "gds2", text: "您是否放弃了许多活动和兴趣？", scoreForYes: true },
      { id: "gds3", text: "您是否觉得生活空虚？", scoreForYes: true },
      { id: "gds4", text: "您是否经常感到无聊？", scoreForYes: true },
      { id: "gds5", text: "您大多数时候精神状态好吗？", scoreForYes: false },
      { id: "gds6", text: "您是否担心会有不好的事情发生？", scoreForYes: true },
      { id: "gds7", text: "您大多数时候感到快乐吗？", scoreForYes: false },
      { id: "gds8", text: "您是否经常感到无助？", scoreForYes: true },
      { id: "gds9", text: "您是否更愿意待在家里，而不是外出做新事情？", scoreForYes: true },
      { id: "gds10", text: "您是否觉得自己的记忆问题比大多数人多？", scoreForYes: true },
      { id: "gds11", text: "您是否认为活着是一件很美好的事？", scoreForYes: false },
      { id: "gds12", text: "您是否觉得自己现在没有价值？", scoreForYes: true },
      { id: "gds13", text: "您是否感到精力充沛？", scoreForYes: false },
      { id: "gds14", text: "您是否觉得自己的处境没有希望？", scoreForYes: true },
      { id: "gds15", text: "您是否觉得大多数人都比自己过得好？", scoreForYes: true },
    ],
  },
};

export function resolveScale(age: AgeBand, concern: Concern): ScaleId | null {
  if (age === "under12") return null;
  if (concern === "anxiety") return "GAD7";
  if (age === "65plus") return "GDS15";
  return "PHQ9";
}

export function scoreAnswers(scale: ScaleDefinition, answers: number[]) {
  if (scale.id !== "GDS15") return answers.reduce((sum, value) => sum + value, 0);
  return answers.reduce((sum, value, index) => {
    const scoreForYes = scale.items[index].scoreForYes;
    const scored = scoreForYes ? value === 1 : value === 0;
    return sum + (scored ? 1 : 0);
  }, 0);
}

export function severityFor(scaleId: ScaleId, score: number, age: AgeBand) {
  if (scaleId === "GAD7") {
    if (age === "12-17") {
      if (score >= 17) return { label: "重度范围", tone: "red" };
      if (score >= 11) return { label: "中度范围", tone: "amber" };
      if (score >= 5) return { label: "轻度范围", tone: "blue" };
      return { label: "极轻或无明显症状", tone: "green" };
    }
    if (score >= 15) return { label: "重度范围", tone: "red" };
    if (score >= 10) return { label: "中度范围", tone: "amber" };
    if (score >= 5) return { label: "轻度范围", tone: "blue" };
    return { label: "极轻或无明显症状", tone: "green" };
  }
  if (scaleId === "PHQ9") {
    if (score >= 20) return { label: "重度范围", tone: "red" };
    if (score >= 15) return { label: "中重度范围", tone: "red" };
    if (score >= 10) return { label: "中度范围", tone: "amber" };
    if (score >= 5) return { label: "轻度范围", tone: "blue" };
    return { label: "极轻或无明显症状", tone: "green" };
  }
  if (score >= 12) return { label: "重度范围", tone: "red" };
  if (score >= 9) return { label: "中度范围", tone: "amber" };
  if (score >= 5) return { label: "轻度范围", tone: "blue" };
  return { label: "未见明显抑郁范围", tone: "green" };
}

export const ageLabels: Record<AgeBand, string> = {
  under12: "12岁以下",
  "12-17": "12–17岁",
  "18-64": "18–64岁",
  "65plus": "65岁及以上",
};

export const concernLabels: Record<Concern, string> = {
  anxiety: "焦虑与担忧",
  depression: "情绪低落与兴趣下降",
};
