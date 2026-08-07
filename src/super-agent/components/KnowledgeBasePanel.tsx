import React, { useState, useEffect, useCallback } from "react";
import {
  Database, Plus, Trash2, Search, Upload, Tag,
  FileText, RefreshCw, X, Check, ChevronDown, ChevronUp
} from "lucide-react";
import type { KBEntry } from "../types";

interface Props {
  onStatusRefresh: () => void;
}

function EntryCard({ entry, onDelete }: { entry: KBEntry; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/sa/kb/${entry.id}`, { method: "DELETE" });
    onDelete(entry.id);
  };

  const sourceLabel: Record<string, string> = {
    manual: "Manual",
    "cursor-chat": "Cursor Chat",
    import: "Import",
    auto: "Auto",
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        <FileText size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold text-white truncate flex-1">{entry.title}</h3>
            <span className="text-[10px] text-slate-600 flex-shrink-0">
              {sourceLabel[entry.source] ?? entry.source}
            </span>
          </div>
          <p className={`text-xs text-slate-400 mt-1 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {entry.content}
          </p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 text-slate-600 hover:text-slate-300 rounded transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors"
          >
            {deleting ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
          </button>
        </div>
      </div>
      <div className="px-3 pb-2 flex items-center gap-2 border-t border-slate-700/30">
        <span className="text-[10px] text-slate-600">
          {entry.content.length.toLocaleString()} chars
        </span>
        <span className="text-slate-700">·</span>
        <span className="text-[10px] text-slate-600">
          {new Date(entry.updatedAt).toLocaleDateString()}
        </span>
        {(entry as any).score !== undefined && (
          <>
            <span className="text-slate-700">·</span>
            <span className="text-[10px] text-violet-400">score: {(entry as any).score}</span>
          </>
        )}
      </div>
    </div>
  );
}

type AddMode = "manual" | "cursor-chat";

export function KnowledgeBasePanel({ onStatusRefresh }: Props) {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(KBEntry & { score: number })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState<AddMode | null>(null);
  const [form, setForm] = useState({ title: "", content: "", tags: "", rawText: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/sa/kb");
      const data = await r.json() as { entries: KBEntry[] };
      setEntries(data.entries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const r = await fetch("/api/sa/kb/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery, limit: 20 }),
    });
    const data = await r.json() as { results: (KBEntry & { score: number })[] };
    setSearchResults(data.results);
  }, [searchQuery]);

  const clearSearch = () => { setSearchQuery(""); setSearchResults(null); };

  const handleDelete = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setSearchResults(prev => prev ? prev.filter(e => e.id !== id) : null);
    onStatusRefresh();
  }, [onStatusRefresh]);

  const handleAdd = useCallback(async () => {
    setSaving(true);
    try {
      if (addMode === "manual") {
        await fetch("/api/sa/kb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            content: form.content,
            tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
            source: "manual",
          }),
        });
      } else if (addMode === "cursor-chat") {
        await fetch("/api/sa/kb/import-cursor-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: form.rawText, title: form.title || undefined }),
        });
      }
      setSaveSuccess(true);
      setForm({ title: "", content: "", tags: "", rawText: "" });
      setTimeout(() => { setSaveSuccess(false); setAddMode(null); }, 1500);
      await loadEntries();
      onStatusRefresh();
    } finally {
      setSaving(false);
    }
  }, [addMode, form, loadEntries, onStatusRefresh]);

  const displayedEntries = searchResults ?? entries;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-violet-400" />
            <h2 className="text-sm font-bold text-white">Knowledge Base</h2>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {entries.length} entries
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAddMode("cursor-chat")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Upload size={11} />
              Import Chat
            </button>
            <button
              onClick={() => setAddMode("manual")}
              className="flex items-center gap-1.5 text-xs text-white px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              <Plus size={11} />
              Add Entry
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-violet-500 transition-colors">
            <Search size={13} className="text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search your knowledge base…"
              className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="text-slate-600 hover:text-slate-400">
                <X size={11} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 rounded-lg text-xs transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Add Entry Form */}
      {addMode && (
        <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-white">
              {addMode === "manual" ? "Add Knowledge Entry" : "Import Cursor Chat"}
            </h3>
            <button onClick={() => setAddMode(null)} className="ml-auto text-slate-600 hover:text-slate-300">
              <X size={14} />
            </button>
          </div>

          {addMode === "manual" ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
              <textarea
                placeholder="Content * — paste docs, notes, project info, chat snippets…"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={5}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
              />
              <div className="flex items-center gap-2">
                <Tag size={11} className="text-slate-600" />
                <input
                  type="text"
                  placeholder="Tags (comma separated): react, cursor, myk, entrata…"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Title (optional — auto-generated if blank)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
              <textarea
                placeholder={`Paste raw Cursor chat content here.\n\nSupported formats:\n• Plain conversation text\n• JSON array of messages: [{role, content}, ...]\n• Any chat export format`}
                value={form.rawText}
                onChange={e => setForm(f => ({ ...f, rawText: e.target.value }))}
                rows={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none font-mono"
              />
              <p className="text-[10px] text-slate-600">
                Tip: In Cursor, use "Export Chat" or copy the conversation. Tags are auto-extracted from content.
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={saving || (addMode === "manual" ? !form.title || !form.content : !form.rawText)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {saving ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : saveSuccess ? (
                <Check size={12} className="text-emerald-300" />
              ) : (
                <Plus size={12} />
              )}
              {saveSuccess ? "Saved!" : saving ? "Saving…" : "Save to KB"}
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <RefreshCw size={18} className="animate-spin text-violet-400" />
          </div>
        ) : displayedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Database size={24} className="text-slate-700 mb-3" />
            {searchResults !== null ? (
              <p className="text-sm text-slate-500">No results for "{searchQuery}"</p>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-1">No knowledge entries yet.</p>
                <p className="text-xs text-slate-600">
                  Add project notes, Cursor chats, or documentation to power the Super Agent's memory.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {searchResults !== null && (
              <p className="text-xs text-slate-500">
                Found {displayedEntries.length} result{displayedEntries.length !== 1 ? "s" : ""} for "{searchQuery}"
              </p>
            )}
            {displayedEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
