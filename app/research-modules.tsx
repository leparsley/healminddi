"use client";
import {useState} from 'react';
import {ArrowUpRight,ArrowRight,ShieldCheck,BookOpen,Search,Download,Mail,X,Check,Layers,FlaskConical} from 'lucide-react';
import {papers,downloadText} from './research-data';
import {Intro} from './experience-modules';
import {partners, partnerGroups, type Partner} from './partners-data';
export function Research(){const [q,setQ]=useState('');const [category,setCategory]=useState('全部');const [selected,setSelected]=useState<string|null>(null);const [notes,setNotes]=useState<Record<string,string>>({});const [checked,setChecked]=useState<Record<string,boolean>>({});const filtered=papers.filter(p=>(category==='全部'||p.topic===category)&&(`${p.title} ${p.note} ${p.method}`).toLowerCase().includes(q.toLowerCase()));const current=papers.find(p=>p.id===selected);const cell=(s:string)=>'"'+s.replaceAll('"','""')+'"';return <div className="p-container"><Intro en="RESEARCH & EVIDENCE" title="让每一份研究，有迹可循" desc="团队成果索引与元分析数据整理工作台。论文标题及链接由团队提供；不虚构样本量、效应量或研究结论。"/><div className="research-stats"><div><BookOpen/><b>7</b><span>团队论文</span></div><div><Layers/><b>5</b><span>含元分析的成果</span></div><div><Check/><b>{Object.values(checked).filter(Boolean).length}</b><span>本次已核对文献</span></div><div><FlaskConical/><b>4</b><span>研究主题</span></div></div><div className="research-tools"><label className="search-box"><Search size={18}/><input aria-label="检索论文" placeholder="检索论文标题、关键词或研究方法…" value={q} onChange={e=>setQ(e.target.value)}/></label><button className="p-secondary" onClick={()=>downloadText('团队科研成果.csv','标题,主题,方法,WoS链接,本次核对,整理备注\n'+filtered.map(p=>[p.title,p.topic,p.method,'https://www.webofscience.com/wos/woscc/full-record/WOS:'+p.id,checked[p.id]?'已核对':'待核对',notes[p.id]||''].map(cell).join(',')).join('\n'))}><Download size={16}/>导出当前结果</button></div><div className="filter-row">{['全部','数字健康','XR 与叙事','设计教育','设计计算'].map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}<span>{filtered.length} 篇结果</span></div><div className="research-list">{filtered.map(p=><article key={p.id}><span className="paper-number">{String(papers.indexOf(p)+1).padStart(2,'0')}</span><div><div className="paper-tags"><span>{p.topic}</span><span>{p.method}</span>{checked[p.id]&&<span>本次已核对</span>}</div><h2>{p.title}</h2><p>{p.note}</p><small>WOS:{p.id}</small></div><div className="paper-actions"><a href={'https://www.webofscience.com/wos/woscc/full-record/WOS:'+p.id} target="_blank" rel="noreferrer">Web of Science <ArrowUpRight size={15}/></a><button onClick={()=>setSelected(p.id)}>数据整理 <ArrowRight size={15}/></button></div></article>)}{!filtered.length&&<div className="empty-state">未找到匹配文献，请更换关键词或分类。</div>}</div><div className="research-note"><ShieldCheck/><p>数据库原型：本次核对与备注仅保留在当前模块，可导出 CSV。效应量、置信区间、样本量、偏倚风险等待全文提取及复核，当前不生成合并效应或森林图。Web of Science 可能需要机构访问权限。</p></div>{current&&<div className="modal-overlay"><section className="p-modal research-modal" role="dialog" aria-modal="true" aria-label="文献数据整理"><button className="modal-close" aria-label="关闭整理" autoFocus onClick={()=>setSelected(null)}><X/></button><span className="p-kicker">META-ANALYSIS WORKSPACE</span><h2>{current.title}</h2><div className="extraction-grid">{['样本量 N','效应量与类型','95% 置信区间','偏倚风险'].map(x=><div key={x}><small>{x}</small><b>待全文提取</b></div>)}</div><label className="note-label">整理备注（仅本次会话）<textarea rows={4} value={notes[current.id]||''} onChange={e=>setNotes({...notes,[current.id]:e.target.value})} placeholder="记录纳入标准、待核对信息及数据来源…"/></label><label className="consent"><input type="checkbox" checked={!!checked[current.id]} onChange={e=>setChecked({...checked,[current.id]:e.target.checked})}/>我已核对该文献的标题与链接</label><button className="p-primary" onClick={()=>setSelected(null)}>保存本次整理 <Check size={16}/></button></section></div>}</div>}
//export function Lab({onResearch}:{onResearch:()=>void}){return <div className="p-container"><Intro en="DESIGN · TECHNOLOGY · WELLBEING" title="用交互设计，连接科技与人的感受" desc="上海电机学院设计与艺术学院 · 数字心理健康研究与体验展示"/><section className="lab-profile"><div className="profile-art"><span>HE XIUCHUAN</span><b>何<br/>修传<span>设计 · 研究 · 育人</span></b><small>清华大学 · 设计学博士</small></div><div className="profile-copy"><span className="p-kicker">导师介绍 / RESEARCH ADVISOR</span><h2>何修传 <small>博士</small></h2><p className="profile-role">上海电机学院设计与艺术学院院长助理</p><p>男，汉族，安徽六安；毕业于清华大学。致力于智能交互设计、智慧场景创新设计，专注于场域空间等数字沉浸、形态体验、材料创新、数字健康、多通道交互、信息场域化构建等设计创新与研发。</p><a className="p-secondary" href="mailto:hexc@sdju.edu.cn"><Mail size={17}/>hexc@sdju.edu.cn <ArrowUpRight size={16}/></a><small className="profile-source">履历与成果依据用户提供资料展示。</small></div></section><section className="p-section"><div className="p-kicker">RESEARCH DIRECTIONS</div><h2>跨越媒介，探索健康体验</h2><div className="direction-grid">{[['01','智能交互','智能人机交互工程 · 具身交互 · 交互装置设计'],['02','数字健康','数字疗愈 · 数字媒介体验 · 多通道交互'],['03','沉浸叙事','XR 多模态叙事 · 场域空间设计 · 数字场景工程'],['04','数据与设计','数据分析及可视化 · 智慧场景创新 · 材料创新']].map(d=><div key={d[0]}><span>{d[0]}</span><h3>{d[1]}</h3><p>{d[2]}</p></div>)}</div></section><div className="lab-columns"><section className="panel"><span className="p-kicker">EDUCATION & EXPERIENCE</span><h2>学习与工作经历</h2><div className="timeline">{[['2019.12—至今','上海电机学院','设计与艺术学院 · 教师'],['2015.09—2019.07','清华大学','设计学 · 博士'],['2018.03—2018.09','兰卡斯特大学','媒体学院 · 访问学者'],['2010.09—2012.07','香港大学','整合营销传播 · 研究生文凭'],['2000.09—2008.07','天津美术学院','工业设计专业 · 学士 / 硕士']].map(x=><div key={x[0]}><small>{x[0]}</small><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div></section><section className="panel"><span className="p-kicker">ACADEMIC CONTRIBUTIONS</span><h2>科研工作与育人成果</h2><ul className="contributions"><li>主持和参与上海世博会俄罗斯馆、中国联通、大唐电信、三一重工等近百项设计项目，主持横向课题 10 余项。</li><li>主持省部级科研项目 2 项，参与省部级项目 3 项。</li><li>作为第一作者在 CSSCI、SSCI、SCI 收录等期刊和会议发表学术论文 30 余篇。</li><li>担任 EDUC INF TECHNOL（SSCI）等学术期刊审稿人。</li><li>出版设计专业教材《交互装置设计》1 本。</li><li>作为第一发明人授权外观设计专利 7 项、软件著作权 1 项。</li><li>所带研究生获上海市优秀毕业生（2022 级）、上海电机学院优秀毕业生（2023 级）等荣誉。</li><li>获上海电机学院优秀研究生指导教师（2025 年）。</li></ul></section></div><section className="p-section"><div className="p-section-head"><div><span className="p-kicker">TEAM & COLLABORATION</span><h2>从研究到体验，协作共创</h2></div><button className="p-link" onClick={onResearch}>七篇团队论文 <ArrowRight size={16}/></button></div><div className="team-grid">{[['谢静瑛','整体框架与系统统筹','网站架构与部署、模块整合与演示流程、项目总体协调'],['王玫','人脸识别与情绪分析模块','摄像头调用、人脸与表情识别、情绪数据记录与分析'],['刘珍妮','心理量表、问卷与数据分析','前测 / 后测问卷、自动评分与结果展示、用户体验报告']].map(t=><article key={t[0]}><span className="team-avatar">{t[0].slice(0,1)}</span><h3>{t[0]}</h3><b>{t[1]}</b><p>{t[2]}</p></article>)}</div><p className="collaborators">协作支持：2D/3D 数字心理健康资源 · VR 场景与交互设计 · 网页 UI 与视觉设计 · 元分析数据库与科研数据整理</p></section></div>}

export function Lab({ onResearch }: { onResearch: () => void }) {
  const [activePartnerCategory, setActivePartnerCategory] =
  useState("industry");
  const directions = [
    ['01', '智能交互', '智能人机交互工程 · 具身交互 · 交互装置设计'],
    ['02', '数字健康', '数字疗愈 · 数字媒介体验 · 多通道交互'],
    ['03', '沉浸叙事', 'XR 多模态叙事 · 场域空间设计 · 数字场景工程'],
    ['04', '数据与设计', '数据分析及可视化 · 智慧场景创新 · 材料创新'],
  ];

  const experience = [
    ['2019.12—至今', '上海电机学院', '设计与艺术学院 · 教师'],
    ['2015.09—2019.07', '清华大学', '设计学 · 博士'],
    ['2018.03—2018.09', '兰卡斯特大学', '媒体学院 · 访问学者'],
    ['2010.09—2012.07', '香港大学', '整合营销传播 · 研究生文凭'],
    ['2000.09—2008.07', '天津美术学院', '工业设计专业 · 学士 / 硕士'],
  ];

 




const contributions = [
  '主持各类纵向、横向课题50余项。',
  '作为第一作者在北大核心、CSSCI、SSCI、SCI、AHCI收录的期刊和会议发表学术论文60余篇。',
  '担任Education and Information Technologies（SSCI）、Digital Creativity（SSCI）、DIGITAL HEALTH（SSCI、SCI）等学术期刊审稿人。',
];



  const team = [
    [
      '谢静瑛',
      '整体框架与系统统筹',
      '网站架构与部署、模块整合与演示流程、项目总体协调',
    ],
    [
      '王玫',
      '人脸识别与情绪分析模块',
      '摄像头调用、人脸与表情识别、情绪数据记录与分析',
    ],
    [
      '刘珍妮',
      '心理量表、问卷与数据分析',
      '前测 / 后测问卷、自动评分与结果展示、用户体验报告',
    ],
  ];


  return (
    <div className="p-container">
      <Intro
        en="DESIGN · TECHNOLOGY · WELLBEING"
        title="用交互设计，连接科技与人的感受"
        desc=""
      />

      <section className="lab-profile">
        <div className="profile-art">
          <span>HE XIUCHUAN</span>
          <b>
            何<br />修传
            <span>设计 · 研究 · 育人</span>
          </b>
          <small>清华大学 · 设计学博士</small>
        </div>

        <div className="profile-copy">
          <span className="p-kicker">
            导师介绍 / RESEARCH ADVISOR
          </span>
          <h2>
            研究方向
          </h2>

          <p>
            致力于智能交互设计、智慧场景创新设计，
            专注于场域空间等数字沉浸、形态体验、
            材料创新、数字健康、多通道交互、
            信息场域化构建等设计创新与研发。
          </p>

          <a
            className="p-secondary"
            href="mailto:hexc@sdju.edu.cn"
          >
            <Mail size={17} />
            hexc@sdju.edu.cn
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      <section className="p-section">
        <div className="p-kicker">RESEARCH DIRECTIONS</div>
        <h2>跨越媒介，探索健康体验</h2>

        <div className="direction-grid">
          {directions.map(d => (
            <div key={d[0]}>
              <span>{d[0]}</span>
              <h3>{d[1]}</h3>
              <p>{d[2]}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lab-columns">
        <section className="panel">
          <span className="p-kicker">
            EDUCATION & EXPERIENCE
          </span>
          <h2>学习与工作经历</h2>

          <div className="timeline">
            {experience.map(x => (
              <div key={x[0]}>
                <small>{x[0]}</small>
                <h3>{x[1]}</h3>
                <p>{x[2]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <span className="p-kicker">
            ACADEMIC CONTRIBUTIONS
          </span>
          <h2>学术与科研成果</h2>

          <ul className="contributions">
            {contributions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="p-section">
        <div className="p-section-head">
          <div>
            <span className="p-kicker">
              RESEARCH TEAM
            </span>
            <h2>研究团队</h2>
          </div>

          <button className="p-link" onClick={onResearch}>
            七篇团队论文 <ArrowRight size={16} />
          </button>
        </div>

        <div className="team-grid">
          {team.map(t => (
            <article key={t[0]}>
              <span className="team-avatar">
                {t[0].slice(0, 1)}
              </span>
              <h3>{t[0]}</h3>
              <b>{t[1]}</b>
              <p>{t[2]}</p>
            </article>
          ))}
        </div>

        <p className="collaborators">
          协作支持：2D/3D 数字心理健康资源 ·
          VR 场景与交互设计 · 网页 UI 与视觉设计 ·
          元分析数据库与科研数据整理
        </p>
      </section>

{/*       <section className="p-section lab-partners" aria-labelledby="partners-title">
        <header className="partners-heading">
          <span className="p-kicker">PARTNERS &amp; LINKS</span>
          <h2 id="partners-title">合作与链接</h2>
          <p>连接高校、医疗机构与科技企业，汇聚跨学科创新资源，探索数字心理健康、智能交互、沉浸式体验及医工交叉领域的研究与应用。</p>
          <ul className="partners-tags" aria-label="机构分类">
            <li>产业合作</li><li>医疗与临床</li><li>学术科研</li>
          </ul>
        </header>
        <p className="partners-disclosure">仅标注「已确认合作」的三家企业为现有合作方；其余机构作为相关资源收录，不代表已建立合作关系。</p>
        {partnerGroups.map(group => (
          <section className={'partners-group partners-group--' + group.id} key={group.id} aria-labelledby={'partners-' + group.id}>
            <header className="partners-group-heading">
              <div>
                <span className="partners-eyebrow">{group.number} / {group.english}</span>
                <h3 id={'partners-' + group.id}>{group.title}</h3>
              </div>
              <p>{group.note}</p>
            </header>
            <div className="partners-grid">
              {partners.filter(partner => partner.category === group.id).map(partner => (
                <article className="partner-card" key={partner.id} data-relationship={partner.relationshipStatus}>
                  <PartnerMark partner={partner} />
                  <div className="partner-copy">
                    <span className="partner-status">{partner.relationshipStatus === 'confirmed' ? '已确认合作' : group.id === 'industry' ? '相关行业资源' : '相关资源'}</span>
                    <h4>{partner.name}</h4>
                    <p>{partner.description}</p>
                    {partner.website && (
                      <a className="partner-link" href={partner.website} target="_blank" rel="noopener noreferrer" aria-label={partner.name + '官方网站（新窗口打开）'}>
                        官方网站 <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section> */}

         
<section
  className="p-section lab-partners partners-section"
  aria-labelledby="partners-title"
>
  <header className="partners-heading">
    <span className="p-kicker">PARTNERS & LINKS</span>
    <h2 id="partners-title">合作与链接</h2>
    <p>
      连接产业、医疗与学术资源，
      探索数字心理健康与智能交互的创新应用。
    </p>
  </header>

  <div className="partners-tabs" role="tablist" aria-label="机构分类">
    {partnerGroups.map(group => (
      <button
        key={group.id}
        type="button"
        role="tab"
        aria-selected={activePartnerCategory === group.id}
        className={activePartnerCategory === group.id ? "active" : ""}
        onClick={() => setActivePartnerCategory(group.id)}
      >
        {group.title}
      </button>
    ))}
  </div>

  {partnerGroups
    .filter(group => group.id === activePartnerCategory)
    .map(group => (
      <div key={group.id} className="partners-logo-grid" role="tabpanel">
        {partners
          .filter(partner => partner.category === group.id)
          .map(partner => {
            const content = (
              <>
                <div className="partners-logo-area">
                  <PartnerMark partner={partner} />
                </div>

                <div className="partners-card-info">
                  <h3>{partner.name}</h3>
                  <p>{partner.description}</p>
                  {partner.relationshipStatus === "confirmed" && (
                    <span className="partners-confirmed">
                      已确认合作
                    </span>
                  )}
                </div>

                {partner.website && (
                  <ArrowUpRight
                    className="partners-card-arrow"
                    size={17}
                    aria-hidden="true"
                  />
                )}
              </>
            );

            return partner.website ? (
              <a
                key={partner.id}
                className="partners-logo-card"
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${partner.name}官方网站`}
              >
                {content}
              </a>
            ) : (
              <div key={partner.id} className="partners-logo-card">
                {content}
              </div>
            );
          })}
      </div>
    ))}

</section>



    </div>
  );
}

function PartnerMark({ partner }: { partner: Partner }) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const logo = partner.logo;
  const showLogo = logo && failedPath !== logo.path;
  return (
    <div className="partner-mark" data-tone={showLogo ? logo.tone : undefined} data-layout={showLogo ? logo.layout : undefined}>
      {showLogo ? (
        <img src={import.meta.env.BASE_URL + logo.path} alt={partner.name + '标识'} loading="lazy" decoding="async" onError={() => setFailedPath(logo.path)} />
      ) : (
        <span aria-hidden="true">{partner.wordmark}</span>
      )}
    </div>
  );
}
