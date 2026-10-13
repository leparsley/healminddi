export type PartnerCategory = 'industry' | 'medical' | 'academic';
export type Partner = {
  id: string;
  name: string;
  category: PartnerCategory;
  description: string;
  /** Plain text fallback, not a reproduction of an official wordmark. */
  wordmark: string;
  logo: { path: `partners/${string}`; tone?: 'dark'; layout?: 'seal' } | null;
  website: string | null;
  relationshipStatus: 'confirmed' | 'resource';
};

export const partnerGroups: { id: PartnerCategory; number: string; english: string; title: string; note: string }[] = [
  { id: 'industry', number: '01', english: 'INDUSTRY PARTNERS', title: '产业合作', note: '已确认合作企业与相关行业资源' },
  { id: 'medical', number: '02', english: 'MEDICAL & CLINICAL', title: '医疗与临床资源', note: '临床研究与专业领域参考' },
  { id: 'academic', number: '03', english: 'ACADEMIC & RESEARCH', title: '学术与科研资源', note: '跨学科研究与学术交流参考' },
];

// Website review: 2026-10-12.
// Only the first three relationships were confirmed by the project owner.
// Original institution images are local; missing images fall back to plain text.
export const partners: Partner[] = [
  { id: 'xinnaozhiyu', name: '心脑智愈（上海）科技有限公司', wordmark: '心脑智愈', category: 'industry', description: '数字心理健康与智能技术', logo: null, website: null, relationshipStatus: 'confirmed' },
  { id: 'nuocheng', name: '上海诺诚电气股份有限公司', wordmark: '诺诚电气', category: 'industry', description: '医疗设备与神经电生理', logo: {"path":"partners/nuocheng.png"}, website: 'https://www.nccmed.com.cn/gsgs', relationshipStatus: 'confirmed' },
  { id: 'kingfar', name: '北京津发科技股份有限公司', wordmark: '津发科技', category: 'industry', description: '人因工程与多模态交互评价', logo: {"path":"partners/kingfar.svg"}, website: 'https://www.kingfar.cn/', relationshipStatus: 'confirmed' },
  { id: 'medvision', name: '杭州心景科技有限公司', wordmark: '心景科技', category: 'industry', description: 'VR心理健康与数字疗法', logo: {"path":"partners/medvision.png"}, website: 'https://www.med-vision.cn/', relationshipStatus: 'resource' },
  { id: 'sixth-hospital', name: '上海市第六人民医院', wordmark: '上海六院', category: 'medical', description: '综合医疗与临床研究', logo: {"path":"partners/sixth-hospital.png"}, website: 'https://www.6thhosp.com/', relationshipStatus: 'resource' },
  { id: 'smhc', name: '上海市精神卫生中心', wordmark: '上海精卫', category: 'medical', description: '精神心理健康与临床研究', logo: {"path":"partners/smhc.png","tone":"dark"}, website: 'https://www.smhc.org.cn/index.htm', relationshipStatus: 'resource' },
  { id: 'huashan', name: '复旦大学附属华山医院', wordmark: '华山医院', category: 'medical', description: '睡眠医学与神经科学', logo: {"path":"partners/huashan.png"}, website: 'https://www.huashan.org.cn/', relationshipStatus: 'resource' },
  { id: 'sdju', name: '上海电机学院', wordmark: '上海电机', category: 'academic', description: '设计创新与跨学科研究', logo: {"path":"partners/sdju.jpg","layout":"seal"}, website: 'https://www.sdju.edu.cn/', relationshipStatus: 'resource' },
  { id: 'sjtu-psychology', name: '上海交通大学心理学院', wordmark: '交大心理', category: 'academic', description: '心理学、人工智能与认知科学', logo: {"path":"partners/sjtu-psychology.png","tone":"dark"}, website: 'https://psychology.sjtu.edu.cn/', relationshipStatus: 'resource' },
  { id: 'ecnu-psychology', name: '华东师范大学心理与认知科学学院', wordmark: '华师心理', category: 'academic', description: '心理测量、情绪与认知研究', logo: {"path":"partners/ecnu-psychology.gif","layout":"seal"}, website: 'https://psy.ecnu.edu.cn/', relationshipStatus: 'resource' },
  { id: 'tongji-design', name: '同济大学设计创意学院', wordmark: '同济设计', category: 'academic', description: '交互设计与设计创新', logo: {"path":"partners/tongji-design.png"}, website: 'https://tjdi.tongji.edu.cn/index.do', relationshipStatus: 'resource' },
];
