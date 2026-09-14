"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendChat, speak } from "@/lib/api";

export default function PlanDayButton() {
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleClick() {
    setLoading(true);
    setReply(null);
    try {
      const response = await sendChat(
        "Planeje meu dia: liste minhas tarefas pendentes e diga por onde comecar."
      );
      setReply(response);
      router.refresh();
    } catch (err) {
      setReply(err instanceof Error ? err.message : "erro ao planejar o dia");
    } finally {
      setLoading(false);
    }
  }

  async function handleSpeak() {
    if (!reply) return;
    setSpeaking(true);
    try {
      const audioBlob = await speak(reply);
      const url = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch (err) {
      setReply((current) => `${current}\n\n(nao foi possivel gerar audio: ${
        err instanceof Error ? err.message : String(err)
      })`);
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <section>
      <button onClick={handleClick} disabled={loading} className="plan-button">
        {loading ? "Planejando..." : "Planejar meu dia"}
      </button>
      {reply && (
        <>
          <p className="agent-reply">{reply}</p>
          <button onClick={handleSpeak} disabled={speaking} className="speak-button">
            {speaking ? "Gerando audio..." : "🔊 Ouvir resposta"}
          </button>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio ref={audioRef} hidden />
        </>
      )}
    </section>
  );
}
