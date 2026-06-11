import { useState, useCallback, useRef } from "react";

// ─── brand palette ────────────────────────────────────────────────────────────
const B = {
  coral:  "#F46D56", peach:  "#F4B081", sand:   "#E9D2BF",
  cream:  "#FFF7ED", cacao:  "#57362B", ink:    "#3D302F",
  aqua:   "#A7D5D2", mist:   "#B8D5DE", taupe:  "#9B7A66",
};

// metric card accent colours — each one distinct
const METRIC_ACCENTS = [
  { bg: "#FFF0EB", border: "#F4B081", num: "#D05C3A", label: "#B07050" }, // warm coral
  { bg: "#EBF4FF", border: "#93C5FD", num: "#1D6FB8", label: "#4A7FA8" }, // sky blue
  { bg: "#F0FBF4", border: "#86EFAC", num: "#1A7A3F", label: "#3D7A55" }, // sage green
  { bg: "#FEF9EC", border: "#FCD34D", num: "#927209", label: "#8A6E20" }, // amber
  { bg: "#F3EEFF", border: "#C4B5FD", num: "#5B34B8", label: "#7058A0" }, // violet
];

// ─── primitives ───────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background:"#fff", border:"1px solid #e8e0d8", borderRadius:12,
    padding:"18px 20px", marginBottom:12, ...style }}>{children}</div>
);

const Badge = ({ children, color="#f0ece6", text="#6b5c50" }) => (
  <span style={{ background:color, color:text, fontSize:11, fontWeight:600,
    padding:"3px 9px", borderRadius:20, display:"inline-block",
    marginRight:4, marginBottom:2 }}>{children}</span>
);

const Btn = ({ children, onClick, primary, disabled, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: primary ? B.coral : "#f5ede6",
    color: primary ? "#fff" : B.ink,
    border:"none", borderRadius:8,
    padding: small ? "8px 16px" : "12px 24px",
    fontSize: small ? 13 : 14, fontWeight:600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    marginRight:8, marginTop:8,
  }}>{children}</button>
);

const SecTitle = ({ children }) => (
  <p style={{ fontSize:11, fontWeight:600, color:B.taupe, letterSpacing:"0.07em",
    textTransform:"uppercase", marginBottom:14, paddingBottom:8,
    borderBottom:"1px solid #ede5db" }}>{children}</p>
);

// coloured metric card — accent index cycles through METRIC_ACCENTS
const MetricCard = ({ label, value, sub, idx=0 }) => {
  const a = METRIC_ACCENTS[idx % METRIC_ACCENTS.length];
  return (
    <div style={{ background:a.bg, border:`1.5px solid ${a.border}`,
      borderRadius:10, padding:"14px 16px", flex:"1 1 120px" }}>
      <div style={{ fontSize:11, color:a.label, marginBottom:4, fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:a.num }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:a.label, marginTop:2, opacity:0.8 }}>{sub}</div>}
    </div>
  );
};

// post thumbnail — loads the Instagram CDN image URL from the CSV
const Thumb = ({ url, type }) => {
  const [err, setErr] = useState(false);
  const typeColor = type==="Video"||type==="Reel" ? "#185FA5" : "#1A7A3F";
  const typeEmoji = type==="Video" ? "▶" : type==="Reel" ? "🎬" : "🖼";

  if (!url || err) return (
    <div style={{ width:72, height:72, borderRadius:8, background:"#f0ece6",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      flexShrink:0, border:"1px solid #e0d5cc" }}>
      <span style={{ fontSize:20 }}>{typeEmoji}</span>
      <span style={{ fontSize:9, color:B.taupe, marginTop:2, fontWeight:600 }}>{type}</span>
    </div>
  );

  return (
    <div style={{ position:"relative", width:72, height:72, flexShrink:0 }}>
      <img src={url} alt="" onError={()=>setErr(true)}
        style={{ width:72, height:72, borderRadius:8, objectFit:"cover",
          display:"block", border:"1px solid #e0d5cc" }} />
      <span style={{ position:"absolute", bottom:3, right:3,
        background: typeColor, color:"#fff", fontSize:8, fontWeight:700,
        padding:"1px 4px", borderRadius:4, lineHeight:"14px" }}>
        {type.slice(0,3).toUpperCase()}
      </span>
    </div>
  );
};

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const parseRow = (line) => {
    const cols=[]; let cur=""; let inQ=false;
    for (let i=0;i<line.length;i++) {
      const c=line[i];
      if (c==='"') { inQ=!inQ; }
      else if (c===","&&!inQ) { cols.push(cur.trim()); cur=""; }
      else cur+=c;
    }
    cols.push(cur.trim());
    return cols;
  };
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(l => {
    const vals = parseRow(l);
    const obj={};
    headers.forEach((h,i) => { obj[h]=vals[i]??""; });
    return obj;
  });
}

function findCol(obj, candidates) {
  for (const k of Object.keys(obj))
    for (const c of candidates)
      if (k.toLowerCase().includes(c.toLowerCase())) return k;
  return null;
}

// ─── analysis engine ──────────────────────────────────────────────────────────
function analysePosts(posts) {
  if (!posts.length) return null;
  const s = posts[0];
  const likeCol = findCol(s,["like_count","likes"]);
  const commCol = findCol(s,["comment_count","comments"]);
  const typeCol = findCol(s,["type","post_type","media_type"]);
  const dateCol = findCol(s,["date","timestamp","created"]);
  const captCol = findCol(s,["caption","text","description"]);
  const viewCol = findCol(s,["view_count","views"]);
  const imgCol  = findCol(s,["image","thumbnail","display_url","media_url","img","cover","photo"]);

  const enriched = posts.map(p => {
    const likes    = parseInt(p[likeCol]||0)||0;
    const comments = parseInt(p[commCol]||0)||0;
    const views    = parseFloat(p[viewCol]||0)||0;
    const score    = likes + comments*3;
    const type     = p[typeCol]||"Image";
    const caption  = p[captCol]||"";
    const dateStr  = p[dateCol]||"";
    const dateObj  = dateStr ? new Date(dateStr) : null;
    const hour     = dateObj ? dateObj.getUTCHours() : -1;
    const htCount  = Object.keys(p).filter(k=>k.toLowerCase().startsWith("hashtag")&&p[k]?.trim()).length;
    const hasCta   = /COMMENT|DM|drop|reply|tag|send/i.test(caption);
    const capLen   = caption.length;
    const imgUrl   = imgCol ? p[imgCol] : "";
    return { ...p, _likes:likes, _comments:comments, _views:views, _score:score,
             _type:type, _caption:caption, _date:dateObj, _hour:hour,
             _htCount:htCount, _hasCta:hasCta, _capLen:capLen, _imgUrl:imgUrl };
  });

  const sorted  = [...enriched].sort((a,b)=>b._score-a._score);
  const top10   = sorted.slice(0,10);
  const bot10   = sorted.slice(-10).reverse();

  const byType={};
  enriched.forEach(p=>{
    if(!byType[p._type]) byType[p._type]={likes:0,comments:0,n:0};
    byType[p._type].likes+=p._likes;
    byType[p._type].comments+=p._comments;
    byType[p._type].n+=1;
  });
  Object.keys(byType).forEach(k=>{
    byType[k].avgLikes=+(byType[k].likes/byType[k].n).toFixed(1);
    byType[k].avgComments=+(byType[k].comments/byType[k].n).toFixed(1);
  });

  const byHour={};
  enriched.forEach(p=>{
    if(p._hour<0) return;
    if(!byHour[p._hour]) byHour[p._hour]={total:0,n:0};
    byHour[p._hour].total+=p._score;
    byHour[p._hour].n+=1;
  });
  const hourData = Object.keys(byHour)
    .map(h=>({hour:parseInt(h),avg:+(byHour[h].total/byHour[h].n).toFixed(1),n:byHour[h].n}))
    .sort((a,b)=>a.hour-b.hour);

  const withHt    = enriched.filter(p=>p._htCount>0);
  const withoutHt = enriched.filter(p=>p._htCount===0);
  const avgWith   = withHt.length ? +(withHt.reduce((s,p)=>s+p._likes,0)/withHt.length).toFixed(1):0;
  const avgWithout= withoutHt.length ? +(withoutHt.reduce((s,p)=>s+p._likes,0)/withoutHt.length).toFixed(1):0;
  const deadZone  = enriched.filter(p=>p._hour>=1&&p._hour<=5).length;
  const hasImages = enriched.some(p=>p._imgUrl);

  return { enriched, sorted, top10, bot10, byType, hourData,
           avgWith, avgWithout, deadZonePosts:deadZone,
           total:enriched.length, hasImages };
}

// ─── reason generators ────────────────────────────────────────────────────────
const cap = (s,n=90) => s?.length>n ? s.slice(0,n)+"…" : s;

function topReason(p) {
  const r=[];
  if (p._type==="Video"||p._type==="Reel") r.push("Video format outperforms images on average.");
  if (p._htCount===0) r.push("No hashtags — resonance, not discovery, drove this.");
  if (p._htCount>15) r.push(`${p._htCount} hashtags — likely boosted reach in an earlier algorithm era.`);
  if (p._hour>=7&&p._hour<=11) r.push("Posted in the optimal AU + US crossover window (7–11h AEST).");
  if (p._hasCta) r.push("Has a comment-trigger CTA — strong algorithm signal.");
  if (p._likes>=30) r.push("High absolute likes suggest content spread beyond existing followers.");
  if (p._comments>=5) r.push(`${p._comments} comments — real conversations, not passive scrolling.`);
  return r.length ? r.join(" ") : "Strong engagement relative to account average. Content resonated with core community.";
}

function botReason(p) {
  const r=[];
  if (p._hour>=1&&p._hour<=5) r.push(`Posted at ${p._hour}h UTC — outside both AU and US active windows.`);
  if (p._type==="Image"&&p._capLen>700) r.push("Very long caption on a static image — high scroll-past risk.");
  if (p._capLen<30&&!p._caption?.trim()) r.push("Little or no caption — no context for algorithm or viewer.");
  if (p._htCount>20) r.push("Heavy hashtag use without matching engagement — misaligned targeting.");
  if (p._score===0) r.push("Zero engagement — very recently posted or reached no feed.");
  return r.length ? r.join(" ") : "Low engagement. Post at 7–10h AEST and lead with a more specific hook.";
}

// ─── main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step,      setStep]      = useState("handles");
  const [handles,   setHandles]   = useState("");
  const [niche,     setNiche]     = useState("");
  const [nicheOther,setNicheOther]= useState("");
  const [audience,  setAudience]  = useState("");
  const [geo,       setGeo]       = useState("");
  const [csvText,   setCsvText]   = useState("");
  const [fileName,  setFileName]  = useState("");
  const [analysis,  setAnalysis]  = useState(null);
  const [apiKey,    setApiKey]    = useState("");
  const [aiReport,  setAiReport]  = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showKey,   setShowKey]   = useState(false);
  const fileRef = useRef();

  const nicheOpts = ["Somatic / nervous system coach","Business coach","Healer / therapist","Creative / content creator","Fitness / wellness","Other"];
  const geoOpts   = ["Australia only","AU + US (English)","US only","UK / Europe","Global English","Portuguese / Brazil"];
  const audOpts   = ["Coaches and healers","Women entrepreneurs","ADHD / neurodivergent","General wellness seekers","Other practitioners"];

  const handleFile = e => {
    const f=e.target.files[0]; if(!f) return;
    setFileName(f.name);
    const r=new FileReader();
    r.onload=ev=>setCsvText(ev.target.result);
    r.readAsText(f);
  };

  const runAnalysis = useCallback(()=>{
    if(!csvText.trim()) return;
    setAnalysis(analysePosts(parseCSV(csvText)));
    setStep("report");
  },[csvText]);

  const runAI = useCallback(async()=>{
    if(!apiKey){ setShowKey(true); return; }
    setAiLoading(true);
    const nl = niche==="Other"?nicheOther:niche;
    const t3 = analysis?.top10?.slice(0,3).map(p=>`"${cap(p._caption,70)}" (${p._likes}L ${p._comments}C)`).join("; ")||"";
    const b3 = analysis?.bot10?.slice(0,3).map(p=>`"${cap(p._caption,70)}" (${p._likes}L)`).join("; ")||"";
    const prompt = `You are an expert Instagram growth strategist for the wellness/coaching/healing niche.

Creator context:
- Handle(s): ${handles}
- Niche: ${nl}
- Audience: ${audience}
- Geography: ${geo}
- Total posts: ${analysis?.total}
- Top posts: ${t3}
- Bottom posts: ${b3}
- Video avg likes: ${analysis?.byType?.Video?.avgLikes||"n/a"}
- Image avg likes: ${analysis?.byType?.Image?.avgLikes||"n/a"}
- Posts in dead zone: ${analysis?.deadZonePosts}

Return ONLY valid JSON (no markdown, no preamble):
{
  "executive_summary": "3-4 sentence plain summary",
  "competitors": [
    { "name":"Real name", "handle":"@handle", "url":"https://instagram.com/handle",
      "followers":"approx e.g. 12K", "why_bigger":"one sentence",
      "what_to_steal":"one concrete tactic", "your_edge":"one advantage creator has" }
  ],
  "white_space": "One paragraph on unclaimed territory this creator could own",
  "recommendations": [
    { "format":"Format name", "why":"Why for this niche/audience", "hook_example":"Actual hook line" }
  ],
  "dance_video_tip": "Specific tip if creator does dance/movement content, else null"
}
Exactly 3 competitors, exactly 5 recommendations. Real accounts only.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"";
      setAiReport(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    } catch { setAiReport({error:"Could not load AI insights. Check your API key and try again."}); }
    setAiLoading(false);
  },[apiKey,handles,niche,nicheOther,audience,geo,analysis]);

  const selBtn = (val, current, set) => (
    <button key={val} onClick={()=>set(val)} style={{
      padding:"9px 14px", borderRadius:8, fontSize:13, cursor:"pointer",
      border:`2px solid ${current===val?B.coral:"#e0d5cc"}`,
      background:current===val?"#fff0eb":"#fff",
      color:current===val?B.coral:B.ink, fontWeight:current===val?600:400,
    }}>{val}</button>
  );

  // ── step: handles ───────────────────────────────────────────────────────────
  if (step==="handles") return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:600,margin:"0 auto",padding:24,background:B.cream,minHeight:"100vh"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:22,fontWeight:700,color:B.ink,marginBottom:4}}>Instagram performance analyser</div>
        <div style={{fontSize:14,color:B.taupe}}>Find out what's working, what's not, and who to watch. ~2 minutes.</div>
      </div>
      <Card>
        <SecTitle>Your Instagram handle(s)</SecTitle>
        <div style={{fontSize:13,color:B.taupe,marginBottom:10}}>One or more handles separated by commas.</div>
        <input value={handles} onChange={e=>setHandles(e.target.value)} placeholder="@yourhandle"
          style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #ddd3c8",
            fontSize:14,fontFamily:"inherit",background:"#fff",boxSizing:"border-box"}} />
        <Btn primary onClick={()=>handles.trim()&&setStep("niche")} disabled={!handles.trim()}>Next →</Btn>
      </Card>
      <div style={{fontSize:11,color:"#bbb",marginTop:12}}>Data stays in your browser. No account access needed.</div>
    </div>
  );

  // ── step: niche ─────────────────────────────────────────────────────────────
  if (step==="niche") return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:600,margin:"0 auto",padding:24,background:B.cream,minHeight:"100vh"}}>
      <div style={{fontSize:18,fontWeight:700,color:B.ink,marginBottom:4}}>What's your niche?</div>
      <div style={{fontSize:13,color:B.taupe,marginBottom:20}}>Calibrates the competitor search and analysis framing.</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
        {nicheOpts.map(n=>selBtn(n,niche,setNiche))}
      </div>
      {niche==="Other"&&<input value={nicheOther} onChange={e=>setNicheOther(e.target.value)}
        placeholder="Describe in a few words…"
        style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #ddd3c8",
          fontSize:14,marginBottom:12,fontFamily:"inherit",background:"#fff",boxSizing:"border-box"}} />}
      <Btn onClick={()=>setStep("handles")}>← Back</Btn>
      <Btn primary onClick={()=>setStep("audience")} disabled={!niche||(niche==="Other"&&!nicheOther.trim())}>Next →</Btn>
    </div>
  );

  // ── step: audience ──────────────────────────────────────────────────────────
  if (step==="audience") return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:600,margin:"0 auto",padding:24,background:B.cream,minHeight:"100vh"}}>
      <div style={{fontSize:18,fontWeight:700,color:B.ink,marginBottom:4}}>Your audience</div>
      <div style={{fontSize:13,color:B.taupe,marginBottom:20}}>Two quick questions — these calibrate the timing analysis.</div>
      <Card>
        <SecTitle>Who do you primarily serve?</SecTitle>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{audOpts.map(a=>selBtn(a,audience,setAudience))}</div>
      </Card>
      <Card>
        <SecTitle>Target geography (for timing advice)</SecTitle>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{geoOpts.map(g=>selBtn(g,geo,setGeo))}</div>
      </Card>
      <Btn onClick={()=>setStep("niche")}>← Back</Btn>
      <Btn primary onClick={()=>setStep("data")} disabled={!audience||!geo}>Next →</Btn>
    </div>
  );

  // ── step: data ──────────────────────────────────────────────────────────────
  if (step==="data") return (
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:600,margin:"0 auto",padding:24,background:B.cream,minHeight:"100vh"}}>
      <div style={{fontSize:18,fontWeight:700,color:B.ink,marginBottom:4}}>Your post data</div>
      <div style={{fontSize:13,color:B.taupe,marginBottom:20}}>
        Upload a CSV or paste data. Works with Phantombuster, Apify, or any post-level export with likes, comments, type, date.
      </div>
      <Card>
        <SecTitle>Option 1 — Upload CSV file</SecTitle>
        <input type="file" accept=".csv,.txt" ref={fileRef} onChange={handleFile} style={{display:"none"}} />
        <Btn onClick={()=>fileRef.current.click()}>📁 Choose file</Btn>
        {fileName&&<span style={{fontSize:12,color:B.taupe,marginLeft:8}}>{fileName}</span>}
      </Card>
      <Card>
        <SecTitle>Option 2 — Paste CSV text</SecTitle>
        <textarea value={csvText} onChange={e=>setCsvText(e.target.value)}
          placeholder={"pk,image,type,caption,like_count,comment_count,date\n...paste data here..."}
          rows={6} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #ddd3c8",
            fontSize:12,fontFamily:"monospace",background:"#fafafa",resize:"vertical",boxSizing:"border-box"}} />
      </Card>
      <div style={{fontSize:12,color:B.taupe,background:"#fdf3ea",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
        <strong>Required:</strong> type, like_count, comment_count, date &nbsp;|&nbsp;
        <strong>For thumbnails:</strong> image (URL column)
      </div>
      <Btn onClick={()=>setStep("audience")}>← Back</Btn>
      <Btn primary onClick={runAnalysis} disabled={!csvText.trim()}>Analyse →</Btn>
    </div>
  );

  // ── step: report ────────────────────────────────────────────────────────────
  if (step==="report"&&analysis) {
    const nl       = niche==="Other"?nicheOther:niche;
    const typeKeys = Object.keys(analysis.byType);
    const topType  = [...typeKeys].sort((a,b)=>analysis.byType[b].avgLikes-analysis.byType[a].avgLikes)[0];
    const tzMap = {
      "AU + US (English)":  {window:"7–10am AEST",why:"AU morning + US afternoon–evening"},
      "Australia only":     {window:"7–9am AEST", why:"Prime morning scroll window"},
      "US only":            {window:"9am–12pm ET",why:"Peak US morning engagement"},
      "UK / Europe":        {window:"8–10am GMT", why:"Morning commute + work-start window"},
      "Global English":     {window:"8am AEST or GMT",why:"Best multi-timezone overlap"},
      "Portuguese / Brazil":{window:"8–10am BRT",why:"Brazilian morning scroll peak"},
    };
    const tz = tzMap[geo]||{window:"7–10am local",why:"General best practice"};
    const htDelta = (analysis.avgWith-analysis.avgWithout).toFixed(1);
    const htLabel = Math.abs(htDelta)<1 ? "~0% difference" : `${htDelta>0?"+":""}${htDelta} avg likes`;

    return (
      <div style={{fontFamily:"system-ui,sans-serif",maxWidth:760,margin:"0 auto",
        padding:"20px 16px",background:B.cream,minHeight:"100vh"}}>

        {/* ── header */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:22,fontWeight:700,color:B.ink}}>{handles}</div>
          <div style={{fontSize:13,color:B.taupe}}>
            {analysis.total} posts · {nl} · {geo}
            {analysis.hasImages && <span style={{marginLeft:8,fontSize:11,background:"#eaf3de",color:"#3b6d11",
              padding:"2px 8px",borderRadius:10,fontWeight:600}}>thumbnails loaded</span>}
          </div>
        </div>

        {/* ── coloured metric cards */}
        <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:24}}>
          <MetricCard idx={0} label="Total posts" value={analysis.total}
            sub={typeKeys.map(k=>`${analysis.byType[k].n} ${k}`).join(" · ")} />
          <MetricCard idx={1} label={`Avg likes (${topType})`}
            value={analysis.byType[topType]?.avgLikes} sub="best performing format" />
          <MetricCard idx={2} label="Hashtag impact"
            value={htLabel} sub="with tags vs without" />
          <MetricCard idx={3} label="Dead-zone posts"
            value={analysis.deadZonePosts} sub="published 1–5am UTC" />
          <MetricCard idx={4} label="Best window"
            value={tz.window} sub={tz.why} />
        </div>

        {/* ── top 10 */}
        <SecTitle>Top 10 posts</SecTitle>
        {analysis.top10.map((p,i)=>(
          <Card key={i} style={{borderLeft:`3px solid ${B.peach}`}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              {/* rank */}
              <div style={{fontSize:18,fontWeight:700,color:"#d0c0b0",
                minWidth:26,paddingTop:2}}>#{i+1}</div>
              {/* thumbnail */}
              <Thumb url={p._imgUrl} type={p._type} />
              {/* content */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:B.ink,marginBottom:6,lineHeight:1.4}}>
                  {cap(p._caption)||(
                    <em style={{color:B.taupe}}>No caption</em>
                  )}
                </div>
                <div style={{marginBottom:6}}>
                  <Badge color="#e3eefa" text="#185FA5">{p._type}</Badge>
                  <Badge color="#faeeda" text="#854F0B">♥ {p._likes} · 💬 {p._comments}</Badge>
                  {p._htCount>0&&<Badge color="#fef3cd" text="#856404">{p._htCount} tags</Badge>}
                  {p._hour>=7&&p._hour<=11&&<Badge color="#eeedfe" text="#534ab7">Good timing</Badge>}
                  {p._hasCta&&<Badge color="#f0faf5" text="#1a7a3f">Has CTA</Badge>}
                </div>
                <div style={{fontSize:11,color:B.taupe,lineHeight:1.6}}>{topReason(p)}</div>
                {p.post_url&&(
                  <a href={p.post_url} target="_blank" rel="noreferrer"
                    style={{fontSize:11,color:"#185FA5",marginTop:4,display:"inline-block"}}>
                    View post ↗
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* ── bottom 10 */}
        <div style={{marginTop:24}}>
          <SecTitle>Bottom 10 posts — what went wrong</SecTitle>
          {analysis.bot10.map((p,i)=>(
            <Card key={i} style={{borderLeft:"3px solid #E24B4A"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{fontSize:18,fontWeight:700,color:"#e0b0b0",minWidth:26,paddingTop:2}}>
                  ↓{i+1}
                </div>
                <Thumb url={p._imgUrl} type={p._type} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:B.ink,marginBottom:6,lineHeight:1.4}}>
                    {cap(p._caption)||<em style={{color:B.taupe}}>No caption</em>}
                  </div>
                  <div style={{marginBottom:6}}>
                    <Badge>{p._type}</Badge>
                    <Badge color="#fde8e8" text="#922">♥ {p._likes} · 💬 {p._comments}</Badge>
                    {p._htCount>0&&<Badge color="#fef3cd" text="#856404">{p._htCount} tags</Badge>}
                    {p._hour>=1&&p._hour<=5&&<Badge color="#fde8e8" text="#922">Dead zone</Badge>}
                  </div>
                  <div style={{fontSize:11,color:B.taupe,lineHeight:1.6}}>{botReason(p)}</div>
                  {p.post_url&&(
                    <a href={p.post_url} target="_blank" rel="noreferrer"
                      style={{fontSize:11,color:"#185FA5",marginTop:4,display:"inline-block"}}>
                      View post ↗
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── AI section */}
        <div style={{marginTop:28,background:"#fff",border:"1px solid #e8e0d8",
          borderRadius:12,padding:"18px 20px"}}>
          <SecTitle>Competitor research + AI recommendations</SecTitle>
          {!aiReport&&!aiLoading&&(
            <>
              <div style={{fontSize:13,color:B.taupe,marginBottom:12,lineHeight:1.6}}>
                Get real competitor accounts in your niche, gap analysis, and 5 tailored content format recommendations — powered by Claude AI.
              </div>
              {showKey&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:12,color:B.taupe,marginBottom:6}}>
                    Anthropic API key (sk-ant-…). Stays in your browser session only.
                  </div>
                  <input value={apiKey} onChange={e=>setApiKey(e.target.value)}
                    type="password" placeholder="sk-ant-api03-…"
                    style={{width:"100%",padding:"9px 12px",borderRadius:8,
                      border:"1.5px solid #ddd3c8",fontSize:13,
                      fontFamily:"monospace",boxSizing:"border-box"}} />
                </div>
              )}
              <Btn primary onClick={runAI} disabled={showKey&&!apiKey}>
                {showKey?"Run AI analysis →":"Add API key to unlock AI insights"}
              </Btn>
            </>
          )}
          {aiLoading&&<div style={{fontSize:13,color:B.taupe,padding:"12px 0"}}>Researching competitors and generating recommendations…</div>}
          {aiReport&&!aiReport.error&&(
            <div>
              {aiReport.executive_summary&&(
                <div style={{fontSize:13,color:B.ink,lineHeight:1.7,marginBottom:16,
                  padding:"12px 14px",background:"#fdf7f0",borderRadius:8}}>
                  {aiReport.executive_summary}
                </div>
              )}
              {aiReport.competitors?.map((c,i)=>(
                <Card key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:B.ink}}>{c.name}</div>
                      <a href={c.url} target="_blank" rel="noreferrer"
                        style={{fontSize:12,color:"#185FA5"}}>{c.handle}</a>
                    </div>
                    <Badge color="#eaf3de" text="#3b6d11">{c.followers} followers</Badge>
                  </div>
                  <div style={{fontSize:13,color:B.taupe,marginBottom:5,lineHeight:1.5}}>
                    <strong style={{color:B.ink}}>Why they grew:</strong> {c.why_bigger}
                  </div>
                  <div style={{fontSize:13,color:B.taupe,marginBottom:5,lineHeight:1.5}}>
                    <strong style={{color:B.ink}}>What to steal:</strong> {c.what_to_steal}
                  </div>
                  <div style={{fontSize:12,color:"#3b6d11",background:"#eaf3de",
                    borderRadius:6,padding:"6px 10px",lineHeight:1.5}}>
                    <strong>Your edge:</strong> {c.your_edge}
                  </div>
                </Card>
              ))}
              {aiReport.white_space&&(
                <Card style={{borderLeft:`3px solid ${B.coral}`,marginTop:12}}>
                  <div style={{fontSize:12,fontWeight:600,color:B.coral,marginBottom:4}}>White space — what nobody is doing yet</div>
                  <div style={{fontSize:13,color:B.ink,lineHeight:1.6}}>{aiReport.white_space}</div>
                </Card>
              )}
              {aiReport.recommendations?.map((r,i)=>(
                <Card key={i} style={{borderLeft:`3px solid ${B.aqua}`,marginTop:10}}>
                  <div style={{fontSize:14,fontWeight:600,color:B.ink,marginBottom:4}}>{i+1}. {r.format}</div>
                  <div style={{fontSize:13,color:B.taupe,marginBottom:6,lineHeight:1.5}}>{r.why}</div>
                  <div style={{fontSize:12,fontStyle:"italic",color:"#5a4a3a",
                    background:"#fdf3ea",borderRadius:6,padding:"6px 10px"}}>
                    Hook: "{r.hook_example}"
                  </div>
                </Card>
              ))}
              {aiReport.dance_video_tip&&(
                <Card style={{marginTop:12,background:"#f0f8f8"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1a7a77",marginBottom:4}}>Dance / movement content tip</div>
                  <div style={{fontSize:13,color:B.ink,lineHeight:1.6}}>{aiReport.dance_video_tip}</div>
                </Card>
              )}
            </div>
          )}
          {aiReport?.error&&(
            <div style={{fontSize:13,color:"#922",padding:12,background:"#fde8e8",borderRadius:8}}>
              {aiReport.error}
            </div>
          )}
        </div>

        {/* ── PDF CTA */}
        <div style={{marginTop:28,textAlign:"center",padding:"20px",background:"#fff",
          borderRadius:12,border:"1px solid #e8e0d8"}}>
          <div style={{fontSize:15,fontWeight:600,color:B.ink,marginBottom:6}}>Download as PDF report</div>
          <div style={{fontSize:13,color:B.taupe,marginBottom:12}}>
            Formatted for sharing with clients, your team, or your own records.
          </div>
          <Btn primary onClick={()=>sendPrompt(`Generate the PDF report for ${handles} — include post thumbnails in the top and bottom 10 lists`)}>
            Generate PDF →
          </Btn>
        </div>

        <div style={{textAlign:"center",marginTop:20}}>
          <Btn small onClick={()=>{setStep("handles");setAnalysis(null);setAiReport(null);
            setCsvText("");setHandles("");setFileName("");}}>
            Start new analysis
          </Btn>
        </div>
      </div>
    );
  }

  return <div style={{fontFamily:"system-ui,sans-serif",padding:24,color:B.taupe}}>Loading…</div>;
}
