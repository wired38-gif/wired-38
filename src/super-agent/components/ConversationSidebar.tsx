import React from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import type { SAConversationSummary } from "../types";

interface Props {
  conversations: SAConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ConversationSidebar({ conversations, activeId, onSelect, onDelete }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="mt-4 text-center">
        <MessageSquare size={24} className="text-slate-700 mx-auto mb-2" />
        <p className="text-xs text-slate-600">No conversations yet.</p>
        <p className="text-[10px] text-slate-700 mt-1">Start chatting above.</p>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-0.5">
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-1 mb-1">
        Conversations
      </p>
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={`group relative flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
            activeId === conv.id
              ? "bg-violet-600/20 border border-violet-500/30"
              : "hover:bg-slate-800 border border-transparent"
          }`}
          onClick={() => onSelect(conv.id)}
        >
          <MessageSquare
            size={12}
            className={`mt-0.5 flex-shrink-0 ${activeId === conv.id ? "text-violet-400" : "text-slate-600"}`}
          />
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-medium truncate ${activeId === conv.id ? "text-violet-200" : "text-slate-300"}`}>
              {conv.title}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-600">{timeAgo(conv.updatedAt)}</span>
              <span className="text-[10px] text-slate-700">·</span>
              <span className="text-[10px] text-slate-600">{conv.messageCount} msgs</span>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}
