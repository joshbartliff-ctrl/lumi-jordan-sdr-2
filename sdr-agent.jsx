import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are Jordan, an elite SDR (Sales Development Representative) for Imply — the company behind Lumi, an AI-powered observability platform purpose-built to help enterprises slash their Splunk ingestion and storage costs dramatically.

Your role: Qualify leads and book 25-minute discovery calls with the right people. Be confident, consultative, and genuinely human. Never sound scripted or salesy.

PRODUCT: Imply Lumi
Lumi sits alongside or replaces Splunk for log analytics and observability. It uses intelligent data tiering, compression, and routing to dramatically reduce what companies pay Splunk for ingestion and storage — without sacrificing visibility.

KEY VALUE PROPS:
- Customers typically cut Splunk ingestion & storage costs by 60–80%
- No rip-and-replace: Lumi integrates alongside existing Splunk deployments
- Works with Splunk Cloud, Splunk Enterprise, and hybrid setups
- Real-time routing: hot data stays in Splunk, cold/warm data offloaded to Lumi
- Full SPL query compatibility — analysts don't need to retrain
- SOC2 Type II certified, enterprise-grade security
- Average time-to-value: under 2 weeks
- Typical customer ROI payback period: under 3 months

QUALIFICATION CRITERIA (BANT):
- Budget: Companies spending $100K+/year on Splunk (or feeling the pain of Splunk's pricing)
- Authority: VP/Director of Engineering, IT, Security, DevOps, FinOps, or Observability leads; can also be C-suite (CTO, CISO)
- Need: High Splunk bills, data volume growth outpacing budget, ingestion limits, cost pressure from leadership, FinOps initiatives
- Timeline: Active cost reduction initiative OR upcoming Splunk renewal (huge buying trigger)

DISCOVERY QUESTIONS TO ASK (one at a time, naturally):
- What does your current Splunk setup look like — cloud, enterprise, or hybrid?
- Have you been feeling pressure around Splunk costs lately, especially as data volumes grow?
- Is there an upcoming Splunk renewal date you're working around?
- Who else on your team is usually involved in these kinds of infrastructure cost decisions?
- Have you looked at any Splunk alternatives or cost optimization tools before?

TONE: Confident, sharp, and direct — but warm and curious. Mirror their energy. Use their name once you learn it. Ask one question at a time. Never pitch more than one value prop at a time.

BOOKING: When the prospect is qualified and shows interest, pivot naturally to booking a 25-minute discovery call. Collect: their name, preferred date/time, and email. Then emit a JSON block AFTER your message text, like:

BOOKING_DATA:{"name": "...", "email": "...", "date": "...", "time": "...", "notes": "..."}

Keep responses to 2-3 sentences max. Sound like a sharp human, not a bot.`;

const TypingDots = () => (
  <div style={{ display: "flex", gap: 5, padding: "13px 16px", background: "rgba(255,255,255,0.04)", borderRadius: "18px 18px 18px 4px", width: "fit-content", border: "1px solid rgba(255,255,255,0.07)" }}>
    {[0,1,2].map(i => (
      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "tdot 1.2s ease-in-out infinite", animationDelay: `${i*0.18}s` }} />
    ))}
  </div>
);

const BookingCard = ({ data, onBook, booked }) => (
  <div style={{ marginTop: 14, background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(234,88,12,0.07))", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 14, padding: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📅</div>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Discovery Call — Ready to Confirm</div>
        <div style={{ color: "#94a3b8", fontSize: 12 }}>25 min · Imply Lumi Demo</div>
      </div>
    </div>
    <div style={{ display: "grid", gap: 7, marginBottom: 14 }}>
      {[["👤","Contact",data.name],["📧","Email",data.email||"TBD"],["📅","Date",data.date],["🕐","Time",data.time],["📋","Context",data.notes]].filter(r=>r[2]).map(([icon,label,val])=>(
        <div key={label} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <span style={{ fontSize: 13, marginTop: 2 }}>{icon}</span>
          <div>
            <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
            <div style={{ color: "#e2e8f0", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{val}</div>
          </div>
        </div>
      ))}
    </div>
    {!booked
      ? <button onClick={()=>onBook(data)} style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg, #f97316, #ea580c)", border: "none", borderRadius: 9, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Add to Google Calendar
        </button>
      : <div style={{ textAlign: "center", color: "#4ade80", fontWeight: 700, fontSize: 13, padding: 6, fontFamily: "'DM Sans', sans-serif" }}>Booked! Invite added to your calendar.</div>
    }
  </div>
);

export default function LumiSDR() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hey! I'm Jordan from Imply. Quick question — are you one of the folks dealing with ever-climbing Splunk bills? We help enterprises cut Splunk ingestion and storage costs by 60-80%, usually within a couple weeks. What does your current Splunk environment look like?",
    time: new Date()
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [calBooked, setCalBooked] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const parseBooking = (text) => {
    const m = text.match(/BOOKING_DATA:(\{[\s\S]*?\})/);
    if (m) { try { return JSON.parse(m[1]); } catch {} }
    return null;
  };

  const cleanText = (text) => text.replace(/BOOKING_DATA:[\s\S]*$/, "").trim();

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input, time: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: updated.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "Hit a quick snag — want to try that again?";
      const booking = parseBooking(raw);
      const clean = cleanText(raw);
      setMessages(prev => [...prev, { role: "assistant", content: clean, time: new Date(), bookingData: booking }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Minor technical blip — could you resend that?", time: new Date() }]);
    }
    setLoading(false);
  };

  const handleBook = () => setCalBooked(true);

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const fmtTime = d => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#09090b;}
        @keyframes tdot{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:.7}50%{opacity:1}}
        .bubble{animation:fadeUp 0.3s ease forwards;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        textarea{resize:none;font-family:'DM Sans',sans-serif;}
        textarea:focus{outline:none;}
        .chip:hover{background:rgba(249,115,22,0.15)!important;border-color:rgba(249,115,22,0.35)!important;}
        .send-btn:hover{opacity:0.85;}
        .send-btn:active{transform:scale(0.95);}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: "radial-gradient(ellipse, rgba(249,115,22,0.05) 0%, transparent 65%)" }} />
        </div>

        <div style={{ width: "100%", maxWidth: 660, height: "100vh", maxHeight: 840, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div style={{ padding: "22px 0 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #f97316, #b45309)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 28px rgba(249,115,22,0.3)" }}>💡</div>
                <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid #09090b", animation: "glow 2s ease-in-out infinite" }} />
              </div>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Jordan · Imply SDR</div>
                <div style={{ color: "#52525b", fontSize: 12, fontWeight: 500, marginTop: 1 }}>Lumi — Splunk Cost Optimization</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ padding: "4px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 20, color: "#22c55e", fontSize: 11, fontWeight: 600 }}>● ONLINE</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {[["60–80%","Splunk savings"],["~2 wks","Time-to-value"],["< 3 mo","ROI payback"]].map(([val, label]) => (
                <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ color: "#f97316", fontWeight: 800, fontSize: 14 }}>{val}</div>
                  <div style={{ color: "#52525b", fontSize: 10, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((msg, i) => {
              const isAI = msg.role === "assistant";
              return (
                <div key={i} className="bubble" style={{ display: "flex", flexDirection: "column", alignItems: isAI ? "flex-start" : "flex-end" }}>
                  <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 4, alignItems: isAI ? "flex-start" : "flex-end" }}>
                    {isAI && <div style={{ fontSize: 10, color: "#3f3f46", fontWeight: 600, marginBottom: 1, paddingLeft: 2, letterSpacing: "0.05em" }}>JORDAN · IMPLY</div>}
                    <div style={{
                      padding: "12px 16px",
                      borderRadius: isAI ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                      background: isAI ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #f97316, #ea580c)",
                      border: isAI ? "1px solid rgba(255,255,255,0.07)" : "none",
                      color: "#f1f5f9", fontSize: 14, lineHeight: 1.65,
                      boxShadow: isAI ? "none" : "0 4px 20px rgba(249,115,22,0.2)"
                    }}>
                      {msg.content}
                    </div>
                    {msg.bookingData && <BookingCard data={msg.bookingData} onBook={handleBook} booked={calBooked} />}
                    <div style={{ fontSize: 10, color: "#3f3f46", paddingLeft: isAI ? 2 : 0, paddingRight: isAI ? 0 : 2 }}>{fmtTime(msg.time)}</div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="bubble">
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ fontSize: 10, color: "#3f3f46", fontWeight: 600, marginBottom: 5, paddingLeft: 2, letterSpacing: "0.05em" }}>JORDAN · IMPLY</div>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div style={{ paddingBottom: 10, display: "flex", gap: 7, flexWrap: "wrap" }}>
              {["We run Splunk Cloud", "Splunk bill is out of control", "Renewal coming up", "Just researching options"].map(s => (
                <button key={s} className="chip" onClick={() => setInput(s)} style={{ padding: "7px 14px", background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)", borderRadius: 20, color: "#fb923c", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14, flexShrink: 0, paddingBottom: 6 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "11px 11px 11px 16px" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="Reply to Jordan..." rows={1}
                style={{ flex: 1, background: "transparent", border: "none", color: "#f1f5f9", fontSize: 14, lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }} />
              <button className="send-btn" onClick={send} disabled={!input.trim() || loading}
                style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() && !loading ? "linear-gradient(135deg, #f97316, #ea580c)" : "rgba(255,255,255,0.05)", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "white" : "#52525b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <div style={{ textAlign: "center", color: "#27272a", fontSize: 11, marginTop: 8 }}>Powered by Imply Lumi · AI-assisted prospecting</div>
          </div>
        </div>
      </div>
    </>
  );
}
