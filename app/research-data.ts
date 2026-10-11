export const papers = [
{id:'001777843700001',title:'Effects of virtual reality mindfulness interventions on depression and anxiety: a meta-analysis',topic:'数字健康',method:'元分析',note:'虚拟现实正念干预与抑郁、焦虑'},
{id:'001861970500001',title:'How does design thinking promote STEM learning? Meta-analysis of learning outcomes and moderating effects',topic:'设计教育',method:'元分析',note:'设计思维、STEM 学习与调节效应'},
{id:'001750810000001',title:'The efficacy of virtual reality interventions for depressive disorder due to another medical condition: A three-level meta-analysis',topic:'数字健康',method:'三层元分析',note:'躯体疾病所致抑郁障碍与 VR 干预'},
{id:'001795828700001',title:'A Systematic Review and Meta-analysis of Applying Extended Reality Digital Storytelling for Assisted Learning in Education',topic:'XR 与叙事',method:'系统综述 / 元分析',note:'扩展现实数字叙事与辅助学习'},
{id:'001869349000001',title:'The effects of virtual reality interventions on depression and anxiety in older adults during and after the COVID-19 pandemic: A meta-analysis',topic:'数字健康',method:'元分析',note:'老年群体的 VR 干预与心理健康'},
{id:'001568078400001',title:'Mapping the Landscape of Immersive Technologies Integrating Narrative: Bibliometric Insights from CiteSpace',topic:'XR 与叙事',method:'文献计量',note:'沉浸技术与叙事的知识图谱'},
{id:'001378666400001',title:"Wave Dynamics in Design: The Role of Nonlinear Potential Burgers' Equation With Variable Coefficients",topic:'设计计算',method:'理论研究',note:'设计中的波动力学与变系数非线性方程'}];
export function downloadText(name:string,content:string,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
