"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "bot" | "user"; text: string; success?: boolean };

const STEPS = [
  { question: "Sur quelle page est-ce arrivé ?", placeholder: "Ex : la page d'une offre, le tableau de bord..." },
  { question: "Qu'est-ce qui s'est passé exactement ?", placeholder: "Décris ce que tu as vu ou le message d'erreur..." },
  { question: "Qu'est-ce qui aurait dû se passer normalement ?", placeholder: "Le résultat que tu attendais..." },
];

export default function BugChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Tu as rencontré un bug ? Je suis là 👀" },
    { role: "bot", text: STEPS[0].question },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", text: input.trim() };
    const newAnswers = [...answers, input.trim()];
    const newMessages: Message[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "bot", text: STEPS[nextStep].question }]);
      }, 400);
    } else {
      setLoading(true);
      try {
        await fetch("/api/bug-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: newAnswers[0],
            what_happened: newAnswers[1],
            expected: newAnswers[2],
          }),
        });
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { role: "bot", text: "Merci ! Bug transmis à Mary. Elle revient vers toi rapidement 🙏", success: true },
          ]);
          setLoading(false);
        }, 400);
      } catch {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { role: "bot", text: "Oups, une erreur s'est produite. Réessaie dans un instant." },
          ]);
          setLoading(false);
        }, 400);
      }
    }
  };

  const isDone = step === STEPS.length - 1 && answers.length === STEPS.length;
  const currentPlaceholder = isDone ? "Envoyé !" : STEPS[Math.min(step, STEPS.length - 1)].placeholder;

  return (
    <>
      {/* BOUTON FLOTTANT */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#111",
          border: "3px solid #111",
          boxShadow: "4px 4px 0px #F5C400",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 22,
          zIndex: 999,
        }}
      >
        💬
      </button>

      {/* FENÊTRE CHAT */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: 300,
            background: "#fff",
            border: "3px solid #111",
            boxShadow: "6px 6px 0px #111",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "#111",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 900 }}>
              <span style={{ color: "#fff" }}>Jean </span>
              <span style={{ color: "#F5C400" }}>find my</span>
              <span style={{ color: "#fff" }}> Job</span>
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                background: "#F5C400",
                color: "#111",
                padding: "2px 8px",
                borderRadius: 20,
                fontWeight: 900,
              }}
            >
              {Math.min(step + 1, STEPS.length)} / {STEPS.length}
            </span>
          </div>

          {/* MESSAGES */}
          <div
            style={{
              height: 240,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <span
                  style={{
                    maxWidth: "85%",
                    padding: "8px 12px",
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontFamily: "'Montserrat', sans-serif",
                    border: "2px solid #111",
                    background: m.success ? "#F5C400" : m.role === "user" ? "#1B4F72" : "#fff",
                    color: m.role === "user" ? "#fff" : "#111",
                    borderRadius: m.role === "user" ? "12px 0 12px 12px" : "0 12px 12px 12px",
                    fontWeight: m.success ? 700 : 400,
                  }}
                >
                  {m.text}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex" }}>
                <span style={{ padding: "8px 12px", border: "2px solid #111", borderRadius: "0 12px 12px 12px", display: "flex", gap: 4 }}>
                  {[0, 150, 300].map((d, i) => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: "#111",
                      display: "inline-block",
                      animation: `bounce 1s ${d}ms infinite`,
                    }} />
                  ))}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div style={{ display: "flex", borderTop: "2px solid #111" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={currentPlaceholder}
              disabled={isDone || loading}
              style={{
                flex: 1,
                border: "none",
                padding: "10px 12px",
                fontSize: 12,
                fontFamily: "'Montserrat', sans-serif",
                outline: "none",
                background: "#fff",
                color: "#111",
              }}
            />
            <button
              onClick={handleSend}
              disabled={isDone || loading}
              style={{
                padding: "0 16px",
                background: "#F5C400",
                border: "none",
                borderLeft: "2px solid #111",
                fontSize: 16,
                fontWeight: 900,
                cursor: isDone ? "default" : "pointer",
                color: "#111",
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}