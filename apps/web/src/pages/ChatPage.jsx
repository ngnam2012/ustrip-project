import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { Head } from "./shared";

export function ChatPage() {
  const { tripId } = useParams();
  const { data: user } = useRemote("/auth/me");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    api(`/trips/${tripId}/messages`)
      .then((res) => {
        setMessages(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    const token = localStorage.getItem("ustrip_token");
    const socketUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    ).replace("/api", "");
    const socket = io(socketUrl, { auth: { token } });

    socket.on("connect", () => {
      socket.emit("join_trip", tripId);
    });
    socket.on("new_message", (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [tripId]);

  const send = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    try {
      await api(`/trips/${tripId}/messages`, {
        method: "POST",
        body: { content },
      });
      setContent("");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader />;
  return (
    <>
      <Head eyebrow="Trò chuyện" title="Thảo luận cùng nhóm" />
      <div className="card flex h-[70vh] flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex max-w-[80%] flex-col ${m.user_id === user?.id ? "self-end items-end ml-auto" : "self-start items-start mr-auto"}`}
            >
              <span className="text-xs text-slate-500 mb-1 mx-1">
                {m.sender?.full_name}
              </span>
              <div
                className={`rounded-2xl px-4 py-2 shadow-sm ${m.user_id === user?.id ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-slate-100 text-ink rounded-bl-none"}`}
              >
                <p>{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form
          onSubmit={send}
          className="flex gap-2 border-t border-slate-200 bg-white p-4"
        >
          <input
            required
            className="flex-1 rounded-xl border border-slate-200 px-4 focus:border-travel focus:outline-none focus:ring-2 focus:ring-travel/20"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Nhập tin nhắn..."
          />
          <button className="btn-primary rounded-xl px-5">
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
