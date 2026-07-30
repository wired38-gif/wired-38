import React, { useRef } from "react";
import { Printer, Download, X, CheckCircle2, Award } from "lucide-react";
import { EntrataWorkflow } from "../../entrataTypes";

interface CertificateProps {
  workflow: EntrataWorkflow;
  traineeName: string;
  completedAt: string;
  onClose: () => void;
}

export function Certificate({ workflow, traineeName, completedAt, onClose }: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const date = new Date(completedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  function handlePrint() {
    const printContents = certRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=900,height=650");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Training Certificate — ${traineeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Playfair+Display:wght@400;700;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: white; }
          .cert { width: 850px; min-height: 580px; padding: 50px; background: white;
            border: 12px double #003087; margin: 20px auto; position: relative; }
          .cert::before { content: ''; position: absolute; inset: 18px;
            border: 1px solid #c8d8f0; pointer-events: none; }
          .header { text-align: center; margin-bottom: 32px; }
          .logo { font-size: 13px; font-weight: 900; color: #003087; letter-spacing: 3px;
            text-transform: uppercase; margin-bottom: 6px; }
          .title { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700;
            color: #1a1a2e; line-height: 1.1; margin-bottom: 4px; }
          .subtitle { font-size: 14px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
          .divider { width: 80px; height: 3px; background: linear-gradient(90deg, #003087, #4f46e5);
            margin: 20px auto; border-radius: 2px; }
          .body { text-align: center; margin-bottom: 28px; }
          .certifies { font-size: 14px; color: #888; letter-spacing: 1px; text-transform: uppercase;
            margin-bottom: 12px; }
          .name { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700;
            color: #003087; margin-bottom: 12px; }
          .completed-text { font-size: 14px; color: #555; margin-bottom: 10px; }
          .workflow-name { font-size: 22px; font-weight: 900; color: #1a1a2e; margin-bottom: 8px; }
          .workflow-cat { font-size: 12px; color: #888; letter-spacing: 1px; text-transform: uppercase;
            margin-bottom: 18px; }
          .steps-badge { display: inline-block; background: #f0f4ff; border: 1px solid #c8d8f0;
            color: #003087; font-size: 12px; font-weight: 700; padding: 6px 16px;
            border-radius: 20px; margin-bottom: 28px; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end;
            padding-top: 24px; border-top: 1px solid #e0e8f0; }
          .sig-block { text-align: center; flex: 1; }
          .sig-line { width: 160px; height: 1px; background: #333; margin: 0 auto 6px; }
          .sig-label { font-size: 10px; color: #888; letter-spacing: 1px; text-transform: uppercase; }
          .date-block { text-align: center; flex: 1; }
          .date-value { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 4px; }
          .seal { text-align: center; flex: 1; }
          .seal-circle { width: 72px; height: 72px; border: 3px solid #003087; border-radius: 50%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            margin: 0 auto; background: #f0f4ff; }
          .seal-check { font-size: 24px; color: #003087; }
          .seal-text { font-size: 8px; font-weight: 900; color: #003087; letter-spacing: 1px;
            text-transform: uppercase; }
          .watermark { position: absolute; bottom: 60px; right: 60px; font-size: 60px;
            opacity: 0.04; font-weight: 900; color: #003087; transform: rotate(-30deg);
            pointer-events: none; user-select: none; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .cert { border: 12px double #003087 !important; }
          }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="watermark">ENTRATA</div>
          <div class="header">
            <div class="logo">Entrata Property Management</div>
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">Training Achievement</div>
            <div class="divider"></div>
          </div>
          <div class="body">
            <div class="certifies">This certifies that</div>
            <div class="name">${traineeName}</div>
            <div class="completed-text">has successfully completed the Entrata training module</div>
            <div class="workflow-name">${workflow.taskName}</div>
            <div class="workflow-cat">${workflow.category} · ${workflow.role.join(" / ")}</div>
            <div class="steps-badge">✓ All ${workflow.steps.length} Steps Completed · ${workflow.estimatedTime}</div>
          </div>
          <div class="footer">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">Property Manager</div>
            </div>
            <div class="seal">
              <div class="seal-circle">
                <div class="seal-check">✓</div>
                <div class="seal-text">Verified</div>
              </div>
            </div>
            <div class="date-block">
              <div class="date-value">${date}</div>
              <div class="sig-label">Date Completed</div>
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="bg-[#003087] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award size={22} className="text-yellow-300" />
            <div>
              <div className="font-bold text-base">Training Certificate</div>
              <div className="text-white/70 text-xs">Ready to print or save as PDF</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Certificate Preview */}
        <div ref={certRef} className="p-8 bg-white relative" style={{ fontFamily: "Georgia, serif" }}>
          {/* Outer border */}
          <div className="border-8 border-double border-[#003087] p-6 relative">
            <div className="absolute inset-3 border border-blue-200 pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-[11px] font-black text-[#003087] tracking-[4px] uppercase mb-2">Entrata Property Management</div>
              <h1 className="text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: "Georgia, serif" }}>Certificate of Completion</h1>
              <p className="text-xs text-gray-500 tracking-[2px] uppercase">Training Achievement</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-[#003087] to-indigo-500 mx-auto mt-3" />
            </div>

            {/* Body */}
            <div className="text-center mb-6">
              <p className="text-xs text-gray-400 tracking-widest uppercase mb-2">This certifies that</p>
              <p className="text-3xl font-black text-[#003087] mb-3" style={{ fontFamily: "Georgia, serif" }}>{traineeName}</p>
              <p className="text-sm text-gray-500 mb-2">has successfully completed the Entrata training module</p>
              <p className="text-xl font-black text-gray-900 mb-1">{workflow.taskName}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">{workflow.category} · {workflow.role.join(" / ")}</p>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-[#003087] text-xs font-bold px-4 py-2 rounded-full">
                <CheckCircle2 size={14} />
                All {workflow.steps.length} Steps Completed · {workflow.estimatedTime}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between pt-4 border-t border-gray-200">
              <div className="text-center flex-1">
                <div className="w-32 h-px bg-gray-400 mx-auto mb-1.5" />
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Property Manager</p>
              </div>
              <div className="text-center flex-1">
                <div className="w-16 h-16 border-4 border-[#003087] rounded-full flex flex-col items-center justify-center mx-auto bg-blue-50">
                  <CheckCircle2 size={20} className="text-[#003087]" />
                  <span className="text-[8px] font-black text-[#003087] tracking-widest uppercase">Verified</span>
                </div>
              </div>
              <div className="text-center flex-1">
                <p className="text-sm font-black text-gray-700 mb-1">{date}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Date Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors shadow-lg"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
