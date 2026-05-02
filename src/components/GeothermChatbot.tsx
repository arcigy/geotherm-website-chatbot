"use client";

import { FormEvent, KeyboardEvent, PointerEvent, WheelEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatMode = "panel" | "perplexity" | "codex";

const modeLabels: Record<ChatMode, string> = {
  panel: "Panel",
  perplexity: "Perplexity",
  codex: "Codex",
};

function MarkdownMessage({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
}

export function GeothermChatbot() {
  const [mode, setMode] = useState<ChatMode>("codex");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceLevels, setVoiceLevels] = useState<number[]>(() => Array(36).fill(0.1));
  const [windowSize, setWindowSize] = useState({ width: 520, height: 720 });
  const [perplexityCollapsed, setPerplexityCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const voiceAnimationRef = useRef<number | null>(null);
  const lastVoiceSampleRef = useRef(0);

  const hasConversation = messages.length > 0;
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearInterval(typingTimerRef.current);
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      stopVoiceMeter();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;

    function stopWithEnter(event: globalThis.KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        stopRecording();
      }
    }

    window.addEventListener("keydown", stopWithEnter);

    return () => {
      window.removeEventListener("keydown", stopWithEnter);
    };
  }, [isRecording]);

  function animateAssistantMessage(content: string) {
    const id = crypto.randomUUID();
    let index = 0;

    setMessages((current) => [...current, { id, role: "assistant", content: "" }]);

    return new Promise<void>((resolve) => {
      typingTimerRef.current = window.setInterval(() => {
        index += 4;
        const nextContent = content.slice(0, index);

        setMessages((current) =>
          current.map((message) => (message.id === id ? { ...message, content: nextContent } : message)),
        );

        if (index >= content.length) {
          if (typingTimerRef.current) {
            window.clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          resolve();
        }
      }, 12);
    });
  }

  function animateInputText(content: string) {
    let index = 0;
    setInput("");

    return new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        index += 1;
        setInput(content.slice(0, index));

        if (index >= content.length) {
          window.clearInterval(timer);
          resolve();
        }
      }, 18);
    });
  }

  function formatRecordingTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function stopVoiceMeter() {
    if (voiceAnimationRef.current) {
      window.cancelAnimationFrame(voiceAnimationRef.current);
      voiceAnimationRef.current = null;
    }

    analyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setVoiceLevels(Array(36).fill(0.1));
  }

  function startVoiceMeter(stream: MediaStream) {
    const audioContextConstructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!audioContextConstructor) {
      setVoiceLevels(Array(36).fill(0.16));
      return;
    }

    const audioContext = new audioContextConstructor();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.72;
    const samples = new Uint8Array(analyser.fftSize);
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    lastVoiceSampleRef.current = 0;
    setVoiceLevels(Array(36).fill(0.1));

    function tick(time: number) {
      if (!analyserRef.current) return;

      analyserRef.current.getByteTimeDomainData(samples);

      let sum = 0;
      for (const sample of samples) {
        const centered = (sample - 128) / 128;
        sum += centered * centered;
      }

      const rms = Math.sqrt(sum / samples.length);
      const level = Math.min(1, Math.max(0.08, rms * 8.5));

      if (time - lastVoiceSampleRef.current > 72) {
        lastVoiceSampleRef.current = time;
        setVoiceLevels((current) => [...current.slice(1), level]);
      }

      voiceAnimationRef.current = window.requestAnimationFrame(tick);
    }

    voiceAnimationRef.current = window.requestAnimationFrame(tick);
  }

  function blobToBase64(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("Audio sa nepodarilo načítať."));
      reader.readAsDataURL(blob);
    });
  }

  async function transcribeAudio(audioBlob: Blob) {
    setIsTranscribing(true);

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const response = await fetch("/api/geotherm-transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioBlob.type || "audio/webm",
        }),
      });
      const data = (await response.json()) as { text?: string; error?: string };

      if (!response.ok || !data.text?.trim()) {
        throw new Error(data.error ?? "Transkripcia zlyhala.");
      }

      await animateInputText(data.text.trim());
    } catch {
      await animateInputText("Nepodarilo sa prepísať hlas. Skúste to ešte raz.");
    } finally {
      setIsTranscribing(false);
    }
  }

  async function startRecording() {
    if (isRecording || isTranscribing || isLoading) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecordingSeconds(0);
      setInput("");
      setIsRecording(true);
      startVoiceMeter(stream);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((current) => current + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        stopVoiceMeter();
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        audioChunksRef.current = [];

        if (audioBlob.size > 0) {
          void transcribeAudio(audioBlob);
        }
      };

      recorder.start();
    } catch {
      stopVoiceMeter();
      setIsRecording(false);
      await animateInputText("Mikrofón sa nepodarilo spustiť.");
    }
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    recorderRef.current.stop();
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    if (!isOpen) setIsOpen(true);
    if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setPerplexityCollapsed(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = mode === "codex" ? "34px" : "48px";
    }

    try {
      const response = await fetch("/api/geotherm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };
      const assistantContent = response.ok
        ? data.message ?? "Nemám pripravenú odpoveď."
        : `Nepodarilo sa spojiť s AI modelom. ${data.error ?? ""}`;

      setIsLoading(false);
      await animateAssistantMessage(assistantContent);
    } catch {
      setIsLoading(false);
      await animateAssistantMessage("Spojenie sa prerušilo. Skúste to ešte raz.");
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input || textareaRef.current?.value || "");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input || textareaRef.current?.value || "");
    }
  }

  function onInputChange(value: string) {
    setInput(value);

    if (!textareaRef.current) return;

    const minHeight = mode === "codex" ? 34 : 48;
    const maxHeight = mode === "codex" ? 86 : 132;

    textareaRef.current.style.height = `${minHeight}px`;
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
  }

  function containWheelScroll(event: WheelEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const isScrollable = element.scrollHeight > element.clientHeight;

    event.stopPropagation();

    if (!isScrollable) {
      event.preventDefault();
      return;
    }

    const atTop = element.scrollTop <= 0;
    const atBottom = Math.ceil(element.scrollTop + element.clientHeight) >= element.scrollHeight;

    if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
      event.preventDefault();
    }
  }

  function startResize(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = windowSize.width;
    const startHeight = windowSize.height;

    function onPointerMove(pointerEvent: globalThis.PointerEvent) {
      const maxWidth = window.innerWidth - 28;
      const maxHeight = window.innerHeight - 40;

      setWindowSize({
        width: Math.min(Math.max(390, startWidth + pointerEvent.clientX - startX), maxWidth),
        height: Math.min(Math.max(520, startHeight + pointerEvent.clientY - startY), maxHeight),
      });
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  const modeSwitcher = (
    <div className="chat-mode-switch" aria-label="Výber vzhľadu chatbota">
      {(Object.keys(modeLabels) as ChatMode[]).map((option) => (
        <button
          className={mode === option ? "active" : ""}
          type="button"
          key={option}
          onClick={() => {
            setMode(option);
            setIsOpen(option !== "panel" || isOpen);
          }}
        >
          {modeLabels[option]}
        </button>
      ))}
    </div>
  );

  const inputForm = (variant: "panel" | "perplexity" | "codex") => (
    <form className={`chat-input ${variant} ${isRecording ? "is-recording" : ""}`} onSubmit={onSubmit}>
      {variant === "perplexity" && isRecording ? (
        <div className="voice-recorder" aria-live="polite">
          <div className="voice-wave" aria-hidden="true">
            {voiceLevels.map((level, index) => (
              <i
                key={index}
                style={{
                  opacity: 0.38 + level * 0.62,
                  transform: `scaleY(${0.24 + level * 2.2})`,
                }}
              />
            ))}
          </div>
          <span className="voice-time">{formatRecordingTime(recordingSeconds)}</span>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={variant === "codex" ? "Zadajte / pre režimy vyhľadávania a skratky" : "Napíšte správu..."}
        />
      )}
      {variant === "perplexity" ? (
        <button
          className={`chat-mic-button ${isRecording ? "recording" : ""}`}
          type="button"
          aria-label={isRecording ? "Zastaviť nahrávanie" : "Mikrofón"}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
        >
          {isRecording ? (
            <span aria-hidden="true" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3Z" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v3" />
              <path d="M9 21h6" />
            </svg>
          )}
        </button>
      ) : null}
      <button type="submit" disabled={isLoading || isRecording || isTranscribing} aria-label="Odoslať správu">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 19V5" />
          <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
        </svg>
      </button>
    </form>
  );

  if (mode === "codex") {
    return (
      <>
        <div className="floating-mode-control">{modeSwitcher}</div>
        {(hasConversation && isOpen) || isLoading ? (
          <section className="perplexity-answer codex-glass-answer" aria-label="GEOTHERM AI odpovede">
            <button className="perplexity-answer-top" type="button" onClick={() => setIsOpen(false)}>
              <span>GEOTHERM AI</span>
              <div className="codex-answer-actions">
                <span aria-hidden="true">⌄</span>
              </div>
            </button>
            <div className="messages compact" ref={scrollRef} onWheel={containWheelScroll}>
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  {message.role === "assistant" ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}
                </article>
              ))}
              {isLoading ? (
                <div className="assistant-thinking">
                  <span>Pripravujem odpoveď</span>
                  <i />
                  <i />
                  <i />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
        {hasConversation || isLoading ? (
          <button
            className="codex-context-popup"
            type="button"
            onClick={() => setIsOpen(true)}
            disabled={!hasConversation && !isLoading}
          >
            <span>Najnovší príspevok</span>
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
        <section className="perplexity-composer codex-glass-composer" aria-label="GEOTHERM AI Codex asistent">
          {inputForm("perplexity")}
        </section>
      </>
    );
  }

  if (mode === "perplexity") {
    return (
      <>
        <aside className="codex-dock" aria-label="GEOTHERM AI Perplexity panel">
          <header className="codex-header">
            <span>•••</span>
            {modeSwitcher}
          </header>

          <div className="codex-center" ref={scrollRef}>
            {!lastAssistantMessage ? (
              <div className="codex-empty">
                <span className="codex-mark">◖</span>
                <strong>Asistent</strong>
              </div>
            ) : (
              <article className={`codex-response ${perplexityCollapsed ? "collapsed" : ""}`}>
                <button type="button" onClick={() => setPerplexityCollapsed((current) => !current)}>
                  <span>GEOTHERM odpoveď</span>
                  <span>{perplexityCollapsed ? "Rozbaliť" : "Minimalizovať"}</span>
                </button>
                {!perplexityCollapsed ? (
                  <div className="message assistant">
                    <MarkdownMessage content={lastAssistantMessage.content} />
                  </div>
                ) : null}
              </article>
            )}
            {isLoading ? (
              <div className="assistant-thinking codex-thinking">
                <span>Pripravujem odpoveď</span>
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>

          <div className="codex-bottom">
            <div className="codex-agent-label">
              <span>◉</span>
              <span>GEOTHERM AI Asistent</span>
            </div>
            {inputForm("codex")}
          </div>
        </aside>
      </>
    );
  }

  if (!isOpen) {
    return (
      <>
        <div className="floating-mode-control">{modeSwitcher}</div>
        <button className="chat-launcher" type="button" onClick={() => setIsOpen(true)}>
          <span className="launcher-orb">AI</span>
          <span>GEOTHERM asistent</span>
        </button>
      </>
    );
  }

  return (
    <>
      <div className="floating-mode-control">{modeSwitcher}</div>
      <aside
        className="chat-shell"
        style={{ width: windowSize.width, height: windowSize.height }}
        aria-label="GEOTHERM AI chatbot"
      >
        <header className="chat-header">
          <div className="chat-title">
            <span className="chat-logo">G</span>
            <div>
              <p>GEOTHERM AI</p>
              <span>Odborný návrhový asistent</span>
            </div>
          </div>
          <button type="button" aria-label="Zavrieť chat" onClick={() => setIsOpen(false)}>
            ×
          </button>
        </header>

        <div className="chat-body" ref={scrollRef}>
          {messages.length === 0 ? (
            <section className="chat-empty">
              <span className="empty-mark">AI</span>
              <h2>GEOTHERM AI</h2>
              <p>Profesionálny poradca pre vykurovanie, chladenie a vetranie domu.</p>
            </section>
          ) : null}

          <div className="messages">
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}
              </article>
            ))}

            {isLoading ? (
              <div className="assistant-thinking">
                <span>Pripravujem odpoveď</span>
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>
        </div>

        {inputForm("panel")}
        <div className="chat-resize-grip" aria-hidden="true" onPointerDown={startResize} />
      </aside>
    </>
  );
}
