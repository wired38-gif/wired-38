import React, { useState } from "react";
import { Play, ExternalLink, ChevronRight, Youtube, Layers, Clock, X } from "lucide-react";
import { TRAINING_VIDEOS, PLAYLIST_ID, TrainingVideo } from "../../data/videos";
import { RoleType } from "../../entrataTypes";

const CATEGORY_COLORS: Record<string, string> = {
  "Overview":        "bg-slate-700/60 text-slate-300 border-slate-600",
  "Leasing":         "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Move-In/Move-Out":"bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Maintenance":     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Financial":       "bg-rose-500/15 text-rose-300 border-rose-500/30",
  "Reports":         "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "Resident Services":"bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

function VideoThumbnail({ youtubeId, isPlaylist }: { youtubeId: string; isPlaylist: boolean }) {
  const thumbUrl = isPlaylist
    ? `https://img.youtube.com/vi/${youtubeId}/0.jpg`
    : `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  return (
    <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
      <img
        src={thumbUrl}
        alt="Video thumbnail"
        className="w-full h-full object-cover"
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
          <Play size={18} className="text-white translate-x-0.5" fill="white" />
        </div>
      </div>
      {isPlaylist && (
        <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
          <Layers size={9} /> PLAYLIST
        </div>
      )}
    </div>
  );
}

interface VideoPlayerModalProps {
  video: TrainingVideo;
  onClose: () => void;
}

function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const isPlaylist = video.youtubeId === PLAYLIST_ID;
  const embedSrc = isPlaylist
    ? `https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&rel=0`
    : `https://www.youtube.com/embed/${video.youtubeId}?rel=0&autoplay=1`;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-slate-800">
            <div className="flex-1 pr-4">
              <h3 className="text-sm font-bold text-white leading-tight">{video.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{video.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={isPlaylist
                  ? `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`
                  : `https://www.youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Youtube size={12} /> YouTube
              </a>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Embed */}
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedSrc}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </>
  );
}

interface VideoPanelProps {
  selectedRole: RoleType;
}

export function VideoPanel({ selectedRole }: VideoPanelProps) {
  const [activeVideo, setActiveVideo] = useState<TrainingVideo | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const filtered = selectedRole === "All"
    ? TRAINING_VIDEOS
    : TRAINING_VIDEOS.filter(v => v.role.includes(selectedRole));

  const playlistVideo = TRAINING_VIDEOS.find(v => v.youtubeId === PLAYLIST_ID);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-slate-800 bg-gradient-to-b from-red-600/10 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Youtube size={18} className="text-red-500" />
          <h2 className="text-lg font-bold text-white">Training Videos</h2>
        </div>
        <p className="text-sm text-slate-400 leading-snug">
          Official Entrata training videos and the CRM playlist from your library.
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">

        {/* Full Playlist Card — prominent */}
        {playlistVideo && (
          <div className="bg-gradient-to-br from-red-600/15 to-slate-800/40 border border-red-500/25 rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-36">
                  <VideoThumbnail youtubeId="4ZZjZ8O5sL0" isPlaylist={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 rounded">
                      Your Playlist
                    </span>
                    <span className="text-[10px] text-slate-500">Entrata CRM</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 leading-tight">
                    Community Relationship Management — Entrata CRM Playlist
                  </h3>
                  <p className="text-xs text-slate-400 leading-snug mb-3">
                    Browse all videos from the Entrata CRM training playlist you provided — covers leasing, prospect management, workflows, and more.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveVideo(playlistVideo)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <Play size={12} fill="white" /> Watch Playlist
                    </button>
                    <a
                      href={`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 border border-slate-600 hover:border-slate-400 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      <ExternalLink size={11} /> Open in YouTube
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Video Cards */}
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1">
          Tutorial Videos
        </div>

        {filtered
          .filter(v => v.youtubeId !== PLAYLIST_ID)
          .map(video => (
            <div
              key={video.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden transition-all duration-150 group cursor-pointer"
              onClick={() => setActiveVideo(video)}
            >
              <div className="p-3 flex gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-28">
                  <VideoThumbnail youtubeId={video.youtubeId} isPlaylist={false} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[video.category] || CATEGORY_COLORS.Overview}`}>
                      {video.category}
                    </span>
                    {video.duration && (
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                        <Clock size={9} /> {video.duration}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug mb-1 group-hover:text-indigo-300 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {video.description}
                  </p>

                  {/* Related workflows */}
                  {video.relatedWorkflows.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.relatedWorkflows.slice(0, 3).map(wfId => (
                        <span key={wfId} className="text-[9px] text-slate-600 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                          {wfId.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight size={14} className="flex-shrink-0 self-center text-slate-700 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>
          ))}

        {/* External Resources */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-1 mb-2">
            Official Resources
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Entrata Academy (LMS)", url: "https://www.entrata.com/products/training", desc: "Official onboarding courses and compliance training" },
              { label: "Entrata Knowledge Base", url: "https://docs.entrata.com", desc: "Articles, FAQs, and how-to guides in the Entrata portal" },
              { label: "Live Training Webinars", url: "https://www.entrata.com/resources", desc: "Free daily product-focused webinars and calendar" },
            ].map(link => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 bg-slate-900/40 border border-slate-800 hover:border-slate-600 rounded-xl transition-all group"
              >
                <ExternalLink size={14} className="flex-shrink-0 text-slate-600 group-hover:text-indigo-400 mt-0.5 transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{link.label}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{link.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
