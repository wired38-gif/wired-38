import React, { useState, useCallback } from "react";
import {
  Search, ChevronDown, ChevronRight, Plus, Filter,
  Bell, HelpCircle, User, Home, FileText,
  Wrench, BarChart2, CheckCircle2, X,
  AlertTriangle, Phone, Mail, DollarSign,
  Clipboard, MoreHorizontal, Eye, Edit,
  Download, Camera, ClipboardList, Building2
} from "lucide-react";
import { SIM_CONFIG } from "../../../data/simulationConfig";
import {
  PROPERTY, PROSPECTS, RESIDENTS, APPLICANTS, WORK_ORDERS,
  LEDGER_108, DAILY_OPS_DATA, UNIT_TYPES
} from "../../../data/sandboxProperty";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function PageBreadcrumb({ path }: { path: string[] }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
      {path.map((p, i) => (
        <React.Fragment key={i}>
          <span className={i === path.length - 1 ? "text-gray-800 font-semibold" : "text-blue-600 hover:underline cursor-pointer"}>{p}</span>
          {i < path.length - 1 && <ChevronRight size={12} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function TH({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-gray-100 border-b border-gray-200">
        {cols.map(col => (
          <th key={col} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{col}</th>
        ))}
      </tr>
    </thead>
  );
}

function Badge({ status }: { status: string }) {
  const m: Record<string, string> = {
    "Current": "bg-green-100 text-green-700 border-green-200",
    "Notice": "bg-amber-100 text-amber-700 border-amber-200",
    "Pending Review": "bg-blue-100 text-blue-700 border-blue-200",
    "Applied": "bg-purple-100 text-purple-700 border-purple-200",
    "Approved": "bg-green-100 text-green-700 border-green-200",
    "Open": "bg-blue-100 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
    "Complete": "bg-green-100 text-green-700 border-green-200",
    "Scheduled": "bg-gray-100 text-gray-600 border-gray-200",
    "New Lead": "bg-cyan-100 text-cyan-700 border-cyan-200",
    "Tour Sched.": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Urgent": "bg-orange-100 text-orange-700 border-orange-200",
    "Standard": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{status}</span>;
}

// ─── Highlight wrapper ────────────────────────────────────────────────────────
interface SimTargetProps {
  targetId: string;
  activeTargetId: string;
  hint: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  inline?: boolean;
}

function SimTarget({ targetId, activeTargetId, hint, onClick, children, className = "", inline = false }: SimTargetProps) {
  const isTarget = targetId === activeTargetId;
  const Tag = inline ? "span" : "div";
  return (
    <Tag
      className={`relative cursor-pointer select-none transition-all duration-150 ${className} ${
        isTarget ? "ring-2 ring-[#0066cc] ring-offset-1 rounded shadow-lg shadow-blue-500/30" : ""
      }`}
      onClick={e => { e.stopPropagation(); if (isTarget) onClick(); }}
    >
      {isTarget && (
        <>
          <span className="absolute inset-0 rounded ring-2 ring-[#0066cc]/50 animate-pulse pointer-events-none z-10" />
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#003087] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-30 shadow-lg">
            ↓ {hint}
          </span>
        </>
      )}
      {children}
    </Tag>
  );
}

interface SimProps { activeTargetId: string; hint: string; onTargetClick: () => void; openMenu?: string; }

// ─── Top Navigation ───────────────────────────────────────────────────────────
function EntrataNav({ activeTargetId, hint, onTargetClick }: SimProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const navItems = [
    { id: "nav-residents", label: "Residents", children: [
      { id: "nav-prospects", label: "Prospects" },
      { id: "nav-applicants", label: "Applicants" },
      { id: "nav-residents-sub", label: "Residents" },
    ]},
    { id: "nav-services", label: "Services", children: [
      { id: "nav-workorders", label: "Work Orders" },
      { id: "nav-inspections", label: "Inspections" },
      { id: "nav-vendors", label: "Vendors" },
    ]},
    { id: "nav-reports", label: "Reports", children: [
      { id: "nav-reports-pm", label: "Property Management" },
      { id: "nav-reports-financial", label: "Financial" },
    ]},
    { id: "nav-accounting", label: "Accounting", children: [] },
  ];

  return (
    <div className="bg-[#003087] select-none" onClick={() => setOpenMenu(null)}>
      <div className="flex items-center h-11 px-3 gap-1">
        <div className="flex items-center gap-2 mr-3">
          <div className="text-white font-black text-base tracking-tight">entrata</div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-1 text-white/70 text-[11px]">
            <Building2 size={11} />
            <span className="font-semibold">{PROPERTY.shortName}</span>
          </div>
        </div>

        {navItems.map(item => (
          <div key={item.id} className="relative">
            <SimTarget targetId={item.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} inline>
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[12px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === item.id ? null : item.id); }}
              >
                {item.label}
                {item.children.length > 0 && <ChevronDown size={11} />}
              </button>
            </SimTarget>
            {openMenu === item.id && item.children.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[160px] py-1" onClick={e => e.stopPropagation()}>
                {item.children.map(child => (
                  <SimTarget key={child.id} targetId={child.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      {child.label}
                    </button>
                  </SimTarget>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <button className="text-white/60 hover:text-white p-1"><Bell size={15} /></button>
          <button className="text-white/60 hover:text-white p-1"><HelpCircle size={15} /></button>
          <div className="flex items-center gap-1.5 ml-1 bg-white/10 rounded-lg px-2 py-1">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <User size={11} className="text-white" />
            </div>
            <span className="text-white/80 text-[11px]">Tyler Brooks</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Resident Profile Shell ───────────────────────────────────────────────────
function ResidentTabs({ activeTab, activeTargetId, hint, onTargetClick }: { activeTab: string } & SimProps) {
  const tabs = ["Overview", "Lease", "Financial", "Documents", "Maintenance", "Messages", "Renewals", "History"];
  return (
    <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
      {tabs.map(tab => {
        const id = tab === "Financial" ? "tab-financial" : tab === "Renewals" ? "tab-renewals" : tab === "Overview" ? "tab-overview" : `tab-${tab.toLowerCase()}`;
        const isActive = tab.toLowerCase() === activeTab.toLowerCase();
        return (
          <SimTarget key={tab} targetId={id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} inline>
            <button className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive ? "border-[#003087] text-[#003087]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab}
            </button>
          </SimTarget>
        );
      })}
    </div>
  );
}

function ResidentHeader({ resident, activeTargetId, hint, onTargetClick, showMenu }: {
  resident: typeof RESIDENTS[0]; showMenu?: boolean;
} & SimProps) {
  const [menuOpen, setMenuOpen] = useState(showMenu ?? false);
  const actions = [
    { id: "action-move-in", label: "Move In" },
    { id: "action-move-out", label: "Move Out Resident" },
    { id: "action-ntv", label: "Notice to Vacate" },
    { id: "action-notice", label: "Generate Notice" },
    { id: "action-renewal", label: "Create Renewal" },
    { id: "action-transfer", label: "Transfer Unit" },
  ];
  const forceOpen = ["action-move-in","action-move-out","action-ntv","action-notice","action-renewal"].includes(activeTargetId);

  return (
    <div className="bg-white border-b border-gray-200 px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-900">{resident.name}</h1>
          <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500 flex-wrap">
            <span className="font-bold text-gray-700">Apt {resident.unit} — {resident.unitType}</span>
            <span>·</span><span>{resident.sqft} sq ft · ${resident.rent.toLocaleString()}/mo</span>
            <span>·</span><Badge status={resident.status} />
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-[12px] text-gray-500">
            <span className="flex items-center gap-1"><Phone size={11} /> {resident.phone}</span>
            <span className="flex items-center gap-1"><Mail size={11} /> {resident.email}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Lease: {resident.lease} · Deposit held: ${resident.depositHeld.toLocaleString()}
            {resident.pets !== "None" && <span className="ml-2 text-amber-600">🐾 {resident.pets}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <SimTarget targetId="portal-status" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border ${resident.portalActive ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${resident.portalActive ? "bg-green-500" : "bg-gray-400"}`} />
              {resident.portalActive ? "Portal Active" : "No Portal"}
            </div>
          </SimTarget>
          <SimTarget targetId="btn-add-note" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-[12px] text-gray-600 bg-white hover:bg-gray-50">+ Note</button>
          </SimTarget>
          <SimTarget targetId="btn-finalize-lease" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-3 py-1.5 bg-[#003087] hover:bg-blue-800 text-white text-[12px] font-bold rounded-lg">Finalize Lease</button>
          </SimTarget>
          <div className="relative">
            <button
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-[12px] font-semibold text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              Actions <ChevronDown size={12} />
            </button>
            {(menuOpen || forceOpen) && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 min-w-[200px] py-1">
                {actions.map(a => (
                  <SimTarget key={a.id} targetId={a.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#003087]">{a.label}</button>
                  </SimTarget>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────
function ScreenMainNav(p: SimProps) {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-md w-full text-center">
        <Building2 size={32} className="text-[#003087] mx-auto mb-3" />
        <div className="text-lg font-black text-[#003087] mb-1">{PROPERTY.name}</div>
        <div className="text-sm text-gray-500 mb-1">{PROPERTY.address}, {PROPERTY.city}</div>
        <div className="text-xs text-gray-400 mb-4">{PROPERTY.totalUnits} units · Manager: {PROPERTY.manager}</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 rounded-xl p-3"><div className="text-2xl font-black text-green-700">{DAILY_OPS_DATA.physicalOccupancy}</div><div className="text-[10px] text-gray-500">Occupancy</div></div>
          <div className="bg-blue-50 rounded-xl p-3"><div className="text-2xl font-black text-blue-700">{DAILY_OPS_DATA.openWorkOrders}</div><div className="text-[10px] text-gray-500">Open WOs</div></div>
          <div className="bg-amber-50 rounded-xl p-3"><div className="text-2xl font-black text-amber-700">{DAILY_OPS_DATA.delinquentAccounts}</div><div className="text-[10px] text-gray-500">Delinquent</div></div>
        </div>
        <div className="mt-4 text-xs text-indigo-600 font-semibold">↑ Use the navigation bar above to continue</div>
      </div>
    </div>
  );
}

function ScreenProspectsList(p: SimProps) {
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Residents", "Prospects"]} />
      <div className="flex items-center justify-between mb-3">
        <div><h1 className="text-base font-black text-gray-800">Prospects</h1><div className="text-xs text-gray-500">{PROSPECTS.length} active prospects</div></div>
        <SimTarget targetId="btn-add-prospect" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-lg"><Plus size={13} /> Add Prospect</button>
        </SimTarget>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm text-gray-400"><Search size={13} /> Search prospects…</div>
        <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white"><Filter size={13} /> Filter</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TH cols={["Name", "Unit Pref.", "Phone", "Source", "Desired Move-In", "Status", ""]} />
          <tbody>
            {PROSPECTS.map((pr, i) => (
              <SimTarget key={pr.id} targetId={i === 0 ? "row-sarah" : `row-prospect-${pr.id}`} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
                <tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                  <td className="px-3 py-2.5 font-semibold text-[#003087]">{pr.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{pr.unitPref}</td>
                  <td className="px-3 py-2.5 text-gray-600">{pr.phone}</td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{pr.source}</td>
                  <td className="px-3 py-2.5 text-gray-600">{pr.desiredMoveIn}</td>
                  <td className="px-3 py-2.5"><Badge status={pr.status} /></td>
                  <td className="px-3 py-2.5"><ChevronRight size={14} className="text-gray-400" /></td>
                </tr>
              </SimTarget>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenApplicantsList(p: SimProps) {
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Residents", "Applicants"]} />
      <div className="flex items-center justify-between mb-3">
        <div><h1 className="text-base font-black text-gray-800">Applicants</h1><div className="text-xs text-gray-500">{APPLICANTS.length} active applications</div></div>
        <SimTarget targetId="filter-pending" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-blue-400 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg"><Filter size={13} /> Pending Review</button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TH cols={["Applicant", "Unit", "Applied", "Employer", "Monthly Income", "Credit", "Status", ""]} />
          <tbody>
            {APPLICANTS.map((a, i) => (
              <SimTarget key={a.id} targetId={i === 0 ? "row-applicant-1" : `row-applicant-${a.id}`} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
                <tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                  <td className="px-3 py-2.5 font-semibold text-[#003087]">{a.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">Apt {a.unit} — {a.unitType}</td>
                  <td className="px-3 py-2.5 text-gray-600">{a.applied}</td>
                  <td className="px-3 py-2.5 text-gray-600">{a.employer}</td>
                  <td className="px-3 py-2.5 font-semibold text-green-700">{a.income}</td>
                  <td className="px-3 py-2.5"><span className={`font-bold ${a.creditScore >= 720 ? "text-green-700" : a.creditScore >= 680 ? "text-amber-600" : "text-red-600"}`}>{a.creditScore}</span></td>
                  <td className="px-3 py-2.5"><Badge status={a.status} /></td>
                  <td className="px-3 py-2.5"><ChevronRight size={14} className="text-gray-400" /></td>
                </tr>
              </SimTarget>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenResidentsList(p: SimProps) {
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Residents", "Residents"]} />
      <div className="flex items-center justify-between mb-3">
        <div><h1 className="text-base font-black text-gray-800">Residents</h1><div className="text-xs text-gray-500">{RESIDENTS.length} current residents · {DAILY_OPS_DATA.totalUnits} total units</div></div>
      </div>
      <div className="flex gap-2 mb-3">
        <SimTarget targetId="search-resident" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick} className="flex-1">
          <div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg px-3 py-2 bg-white w-full">
            <Search size={13} className="text-gray-400" /><span className="text-sm text-gray-400">Search name, unit, phone…</span>
          </div>
        </SimTarget>
        <button className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white flex items-center gap-1"><Filter size={13} /> Filter</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TH cols={["Resident", "Unit", "Lease Term", "Rent", "Balance", "Status", ""]} />
          <tbody>
            {RESIDENTS.map((r, i) => {
              const tid = r.id === "r-001" ? "row-marcus" : r.id === "r-002" ? "row-jennifer" : r.id === "r-004" ? "row-maria" : `row-res-${r.id}`;
              return (
                <SimTarget key={r.id} targetId={tid} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
                  <tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                    <td className="px-3 py-2.5 font-semibold text-[#003087]">{r.name}</td>
                    <td className="px-3 py-2.5"><span className="font-bold">Apt {r.unit}</span> <span className="text-gray-500 text-xs">({r.unitType})</span></td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{r.lease}</td>
                    <td className="px-3 py-2.5 text-gray-700">${r.rent.toLocaleString()}/mo</td>
                    <td className={`px-3 py-2.5 font-bold ${r.balance > 0 ? "text-red-600" : "text-gray-500"}`}>${r.balance.toFixed(2)}</td>
                    <td className="px-3 py-2.5"><Badge status={r.status} /></td>
                    <td className="px-3 py-2.5"><ChevronRight size={14} className="text-gray-400" /></td>
                  </tr>
                </SimTarget>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenResidentProfile(p: SimProps) {
  const r = PROSPECTS[0]; // Sarah Johnson — prospect ready for move-in
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">{PROPERTY.shortName} · Prospect Profile</div>
            <h1 className="text-lg font-black text-gray-900">{r.name}</h1>
            <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
              <span className="font-bold text-gray-700">Apt 204 — {r.unitPref}</span>
              <span>·</span><span>Move-in: {r.desiredMoveIn}</span>
              <span>·</span><Badge status="Approved" />
            </div>
            <div className="text-xs text-gray-500 mt-1">{r.phone} · {r.email} · Income: {r.income}</div>
          </div>
          <div className="flex items-center gap-2">
            <SimTarget targetId="btn-finalize-lease" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <button className="px-4 py-2 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow">Finalize Lease</button>
            </SimTarget>
          </div>
        </div>
      </div>
      <ResidentTabs activeTab="overview" activeTargetId={p.activeTargetId} hint={p.hint} onTargetClick={p.onTargetClick} />
      <div className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Lease Terms", items: [["Unit", "Apt 204 — 2BD/2BA"], ["Start Date", "08/01/2026"], ["End Date", "07/31/2027"], ["Monthly Rent", "$1,895.00"], ["Security Deposit", "$1,895.00"]] },
            { label: "Charges Due at Move-In", items: [["First Month Rent", "$1,895.00"], ["Security Deposit", "$1,895.00"], ["Pet Fee (1 Dog)", "$400.00"], ["Total Due", "$4,190.00"]] },
          ].map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{card.label}</div>
              {card.items.map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-gray-50 text-sm last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className={`font-semibold ${k === "Total Due" ? "text-[#003087]" : "text-gray-800"}`}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenResidentFinancial(p: SimProps) {
  const r = RESIDENTS[1]; // Jennifer Park - has a balance
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <ResidentHeader resident={r} activeTargetId={p.activeTargetId} hint={p.hint} onTargetClick={p.onTargetClick} />
      <ResidentTabs activeTab="financial" activeTargetId={p.activeTargetId} hint={p.hint} onTargetClick={p.onTargetClick} />
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div><span className="text-sm font-bold text-gray-700">Ledger — Apt {r.unit}</span><span className={`ml-3 text-sm font-black ${r.balance > 0 ? "text-red-600" : "text-green-600"}`}>Balance: ${r.balance.toFixed(2)}</span></div>
          <div className="flex gap-2">
            <SimTarget targetId="btn-accept-payment" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <button className="px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 font-semibold hover:bg-gray-50">Accept Payment</button>
            </SimTarget>
            <SimTarget targetId="btn-post-charge" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <button className="px-3 py-1.5 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-lg">Post Charge</button>
            </SimTarget>
            <SimTarget targetId="btn-close-ledger" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <button className="px-3 py-1.5 border border-amber-400 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-100">Close Ledger</button>
            </SimTarget>
            <SimTarget targetId="btn-generate-soda" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <button className="px-3 py-1.5 border border-purple-400 bg-purple-50 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-100">Generate SODA</button>
            </SimTarget>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <TH cols={["Date", "Description", "Code", "Charge", "Payment", "Balance"]} />
            <tbody>
              {LEDGER_108.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{row.date}</td>
                  <td className="px-3 py-2.5 text-gray-700">{row.desc}</td>
                  <td className="px-3 py-2.5">{row.code && <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{row.code}</code>}</td>
                  <td className="px-3 py-2.5 text-red-600 font-medium">{row.charge}</td>
                  <td className="px-3 py-2.5 text-green-600 font-medium">{row.payment}</td>
                  <td className={`px-3 py-2.5 font-bold ${row.balance === "$0.00" ? "text-green-600" : "text-gray-800"}`}>{row.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScreenResidentActions(p: SimProps) {
  const r = RESIDENTS[3]; // Maria Rodriguez — Notice
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <ResidentHeader resident={r} activeTargetId={p.activeTargetId} hint={p.hint} onTargetClick={p.onTargetClick} showMenu />
      <ResidentTabs activeTab="overview" activeTargetId={p.activeTargetId} hint={p.hint} onTargetClick={p.onTargetClick} />
      <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-400">Click Actions above to select an operation.</div>
    </div>
  );
}

function ScreenResidentRenewals(p: SimProps) {
  const r = RESIDENTS[0]; // Marcus Williams
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <ResidentHeader resident={r} activeTargetId={p.activeTargetId} hint={p.hint} onTargetClick={p.onTargetClick} />
      <ResidentTabs activeTab="renewals" activeTargetId={p.activeTargetId} hint={p.hint} onTargetClick={p.onTargetClick} />
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="text-sm font-bold text-gray-700">Renewals — Apt {r.unit}</h2><div className="text-xs text-gray-500">Lease ends {r.leaseEnd} · {Math.ceil((new Date(r.leaseEnd).getTime() - Date.now()) / 86400000)} days remaining</div></div>
          <SimTarget targetId="btn-create-renewal" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800"><Plus size={13} /> Create Renewal Offer</button>
          </SimTarget>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-500 italic">No renewal offer on file yet. Current rent: ${r.rent.toLocaleString()}/mo.</div>
      </div>
    </div>
  );
}

function ScreenWorkOrdersList(p: SimProps) {
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Services", "Maintenance", "Work Orders"]} />
      <div className="flex items-center justify-between mb-3">
        <div><h1 className="text-base font-black text-gray-800">Work Orders</h1><div className="text-xs text-gray-500">{WORK_ORDERS.filter(w => w.status !== "Complete").length} open · {WORK_ORDERS.filter(w => w.priority === "Urgent").length} urgent</div></div>
        <SimTarget targetId="btn-add-wo" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-lg"><Plus size={13} /> Add Work Order</button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TH cols={["WO #", "Unit", "Resident", "Category", "Issue", "Priority", "Status", "Assigned"]} />
          <tbody>
            {WORK_ORDERS.map(wo => (
              <tr key={wo.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                <td className="px-3 py-2.5 text-[#003087] font-bold">{wo.id}</td>
                <td className="px-3 py-2.5 font-medium">Apt {wo.unit}</td>
                <td className="px-3 py-2.5 text-gray-600">{wo.resident}</td>
                <td className="px-3 py-2.5 text-gray-600">{wo.cat}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[140px] truncate">{wo.desc}</td>
                <td className="px-3 py-2.5"><Badge status={wo.priority} /></td>
                <td className="px-3 py-2.5"><Badge status={wo.status} /></td>
                <td className="px-3 py-2.5 text-gray-600">{wo.assigned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenWorkOrderForm(p: SimProps) {
  const wo = WORK_ORDERS[0]; // WO-2847 - Marcus Williams plumbing
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Services", "Maintenance", "Work Orders", "Add Work Order"]} />
      <h1 className="text-base font-black text-gray-800 mb-3">Create Work Order — {PROPERTY.name}</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 grid grid-cols-2 gap-4">
          <SimTarget targetId="field-wo-unit" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Unit / Location *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                {RESIDENTS.map(r => <option key={r.id}>Apt {r.unit} — {r.name}</option>)}
                <option>Common Area — Parking Lot</option>
                <option>Common Area — Laundry Room</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-priority" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Category & Priority *</label>
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                  {["Plumbing", "HVAC", "Electrical", "Appliance", "Grounds", "Interior", "Exterior"].map(c => <option key={c}>{c}</option>)}
                </select>
                <SimTarget targetId="field-wo-priority-emergency" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick} inline>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                    <option>Standard (3–5 days)</option><option>Urgent (24 hrs)</option><option>Emergency (4 hrs)</option><option>Scheduled</option>
                  </select>
                </SimTarget>
              </div>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-description" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick} className="col-span-2">
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Description *</label>
              <textarea readOnly rows={3} value={wo.desc} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 resize-none outline-none cursor-pointer" />
              <div className="text-[10px] text-gray-400 mt-1">Resident reported: {new Date().toLocaleDateString()}</div>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-pte" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div className="flex items-start gap-3 p-3 border-2 border-[#003087]/30 rounded-xl bg-blue-50 cursor-pointer">
              <div className="w-5 h-5 bg-[#003087] border-2 border-[#003087] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <div><div className="text-sm font-bold text-[#003087]">✓ Permission to Enter</div><div className="text-xs text-gray-600 mt-0.5">Resident {RESIDENTS[0].name} has granted entry authorization for this unit.</div></div>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-tech" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Assign Technician</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>{PROPERTY.maintenanceSupervisor}</option><option>{PROPERTY.onCallTech}</option><option>Unassigned — Dispatch Later</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-notes" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick} className="col-span-2">
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Notes / Update Log</label>
              <textarea rows={2} placeholder="Add technician notes, timeline updates, parts needed…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none cursor-pointer" />
            </div>
          </SimTarget>
        </div>
        <div className="px-4 pb-4 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-submit-wo" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-5 py-2 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-lg flex items-center gap-2"><Clipboard size={14} /> Submit Work Order</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenMoveInDialog(p: SimProps) {
  const prospect = PROSPECTS[0];
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <div className="text-xs text-white/60 mb-0.5">{PROPERTY.name}</div>
          <h3 className="font-black text-base">Move-In — {prospect.name}</h3>
          <div className="text-white/70 text-xs">Apt 204 · {prospect.unitPref} · $1,895/mo</div>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
            <div className="font-bold text-green-700 flex items-center gap-1.5"><CheckCircle2 size={14} /> Ledger Verified — Balance: $0.00</div>
            <div className="text-green-600 text-xs mt-0.5">All move-in funds collected: First month + deposit + pet fee</div>
          </div>
          {[
            { id: "field-movein-date", label: "Official Move-In Date *", value: "08/01/2026" },
            { id: "field-fob-number", label: "Key / Fob Number", value: "FOB-0204 · Key #K-204A" },
          ].map(f => (
            <SimTarget key={f.id} targetId={f.id} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer font-semibold" />
              </div>
            </SimTarget>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            Unit 204 was inspected on 07/30/2026 — condition logged as Move-In Ready.
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-save-movein" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-5 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800 flex items-center gap-2"><CheckCircle2 size={14} /> Save Move-In</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenMoveOutDialog(p: SimProps) {
  const r = RESIDENTS[3]; // Maria Rodriguez
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <div className="text-xs text-white/60">{PROPERTY.name}</div>
          <h3 className="font-black text-base">Move Out — {r.name}</h3>
          <div className="text-white/70 text-xs">Apt {r.unit} · {r.unitType} · Notice filed: 07/15/2026</div>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[["Move-Out Date *","08/15/2026"],["Unit Condition","Normal Wear & Tear"]].map(([l, v]) => (
              <div key={l}><label className="block text-xs font-bold text-gray-600 mb-1">{l}</label><input readOnly value={v} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" /></div>
            ))}
          </div>
          <SimTarget targetId="field-forwarding-addr" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Forwarding Address * <span className="text-red-500">(required for SODA)</span></label>
              <input readOnly value={r.forwardingAddr} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" />
              <div className="text-[10px] text-amber-600 mt-1">SODA must be mailed within Texas state deadline (30 days)</div>
            </div>
          </SimTarget>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <span className="font-bold">Deposit held:</span> ${r.depositHeld.toLocaleString()} · <span className="font-bold">Outstanding balance:</span> ${r.balance.toFixed(2)}
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <button className="px-5 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800 flex items-center gap-2"><CheckCircle2 size={14} /> Confirm Move-Out</button>
        </div>
      </div>
    </div>
  );
}

function ScreenNTVDialog(p: SimProps) {
  const r = RESIDENTS[3];
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <div className="text-xs text-white/60">{PROPERTY.name}</div>
          <h3 className="font-black text-base">Notice to Vacate — {r.name}, Apt {r.unit}</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <SimTarget targetId="field-notice-date" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Notice Received *</label><input readOnly value="07/15/2026" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" /></div>
            </SimTarget>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Expected Move-Out *</label><input readOnly value={r.moveOut} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" /></div>
          </div>
          <SimTarget targetId="field-vacate-reason" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Reason for Vacating *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>{r.vacateReason}</option><option>Job Relocation</option><option>Transfer</option><option>Lease Not Renewed</option><option>Financial Hardship</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="field-ntv-notes" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Notes</label>
              <textarea readOnly rows={2} value={`Resident purchasing a home on ${r.forwardingAddr}. Spoke with resident on 07/15 — no retention interest.`} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 resize-none outline-none cursor-pointer" />
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-save-ntv" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-5 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800 flex items-center gap-2"><CheckCircle2 size={14} /> Save Notice</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenPostChargeDialog(p: SimProps) {
  const r = RESIDENTS[1];
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <div className="text-xs text-white/60">{PROPERTY.name}</div>
          <h3 className="font-black text-base">Post Charge — {r.name}, Apt {r.unit}</h3>
          <div className="text-white/70 text-xs">Current balance: <span className="font-bold text-amber-300">${r.balance.toFixed(2)}</span></div>
        </div>
        <div className="p-5 space-y-3">
          <SimTarget targetId="field-income-code" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Income Code *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>LATE01 — Late Fee ($100)</option><option>PET01 — Pet Fee</option><option>PARK01 — Parking</option><option>UTIL01 — Utility Reconciliation</option><option>CLEAN01 — Cleaning Fee</option><option>NSFCK — NSF Check Fee</option>
              </select>
            </div>
          </SimTarget>
          <div className="grid grid-cols-2 gap-3">
            <SimTarget targetId="field-charge-amount" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Amount *</label>
                <input readOnly value="$100.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer font-bold" /></div>
            </SimTarget>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Posting Date *</label>
              <input readOnly value="07/30/2026" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" /></div>
          </div>
          <SimTarget targetId="field-charge-desc" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
              <textarea readOnly rows={2} value="Late fee per lease Section 4.2 — July rent received 07/07 (grace period ends 07/05). Check #5512." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 resize-none outline-none cursor-pointer" />
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-post-charge-submit" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-5 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800 flex items-center gap-2"><DollarSign size={14} /> Post Charge</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenAcceptPaymentDialog(p: SimProps) {
  const r = RESIDENTS[1];
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <div className="text-xs text-white/60">{PROPERTY.name}</div>
          <h3 className="font-black text-base">Accept Payment — {r.name}, Apt {r.unit}</h3>
          <div className="text-white/70 text-xs">Balance due: <span className="font-bold text-amber-300">${r.balance.toFixed(2)}</span></div>
        </div>
        <div className="p-5 space-y-3">
          <SimTarget targetId="field-payment-method" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-2">Payment Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {["Check", "Money Order", "Cash"].map((m, i) => (
                  <div key={m} className={`border rounded-lg px-3 py-2 text-sm text-center cursor-pointer font-semibold ${i === 0 ? "border-[#003087] bg-blue-50 text-[#003087]" : "border-gray-200 text-gray-500"}`}>{m}</div>
                ))}
              </div>
            </div>
          </SimTarget>
          <div className="grid grid-cols-2 gap-3">
            <SimTarget targetId="field-payment-amount" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Amount *</label>
                <input readOnly value="$150.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer font-bold" /></div>
            </SimTarget>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Check #</label>
              <input readOnly value="#5513" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" /></div>
          </div>
          <SimTarget targetId="field-payment-apply" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
              <div className="text-xs font-bold text-gray-600 mb-2">Applied To (oldest first)</div>
              <div className="flex justify-between text-sm mb-1"><span>Late Fee (LATE01) 07/08</span><span className="font-semibold text-red-600">$100.00</span></div>
              <div className="flex justify-between text-sm"><span>Pet Fee (PET01) 07/08</span><span className="font-semibold text-red-600">$50.00</span></div>
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-post-payment" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 flex items-center gap-2"><CheckCircle2 size={14} /> Post Payment & Print Receipt</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenApplicationReview(p: SimProps) {
  const a = APPLICANTS[0];
  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="text-xs text-gray-400 mb-0.5">{PROPERTY.name} · Application Review</div>
        <h1 className="text-base font-black text-gray-900">{a.name} — Application #{a.id.toUpperCase()}</h1>
        <div className="text-sm text-gray-500 mt-0.5">Applied {a.applied} · Apt {a.unit} — {a.unitType} · Rent: $1,895/mo</div>
      </div>
      <div className="flex border-b border-gray-200 bg-white">
        {["Application", "Screening Results", "Documents", "Messages"].map(tab => (
          <SimTarget key={tab} targetId={tab === "Application" ? "tab-application" : tab === "Screening Results" ? "tab-screening" : `tab-${tab.toLowerCase()}`} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick} inline>
            <button className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${tab === "Application" ? "border-[#003087] text-[#003087]" : "border-transparent text-gray-500"}`}>{tab}</button>
          </SimTarget>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Employment", items: [["Employer", a.employer], ["Monthly Income", a.income], ["Income/Rent Ratio", "3.06× ✓"]] },
            { label: "Rental History", items: [["Previous Address", "891 Rio Grande St, Austin TX"], ["Previous Landlord", "Meadows Apts — (512) 555-7200"], ["Reason for Leaving", "Lease expired — upgrading to larger unit"]] },
          ].map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{card.label}</div>
              {card.items.map(([k, v]) => <div key={k} className="flex justify-between text-sm py-0.5"><span className="text-gray-500">{k}</span><span className="font-semibold text-gray-800">{v}</span></div>)}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <SimTarget targetId="btn-run-screening" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-4 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg flex items-center gap-2"><Eye size={13} /> Run Screening</button>
          </SimTarget>
          <SimTarget targetId="btn-set-status" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-semibold rounded-lg flex items-center gap-2"><Edit size={12} /> Set Status</button>
          </SimTarget>
          <SimTarget targetId="btn-send-letter" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-semibold rounded-lg flex items-center gap-2"><Mail size={12} /> Send Letter</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenReportsList(p: SimProps) {
  const reports = [
    { id: "report-daily-ops", name: "Daily Operations Report", cat: "Property Management", desc: "Occupancy, moves, delinquency, open WOs — today's snapshot." },
    { id: "report-delinquency", name: "Delinquency Report", cat: "Financial", desc: "All residents with outstanding balances." },
    { id: "report-lease-expiration", name: "Lease Expiration Report", cat: "Property Management", desc: "Leases expiring within 30/60/90 days." },
    { id: "report-occupancy", name: "Occupancy Report", cat: "Property Management", desc: "Physical and economic occupancy by unit type." },
    { id: "report-rent-roll", name: "Rent Roll", cat: "Financial", desc: "All units with rent, status, and concessions." },
  ];
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Reports", "Report Library"]} />
      <h1 className="text-base font-black text-gray-800 mb-3">Reports — {PROPERTY.name}</h1>
      <div className="space-y-2">
        {reports.map(r => (
          <SimTarget key={r.id} targetId={r.id} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer group">
              <BarChart2 size={18} className="text-gray-400 group-hover:text-[#003087] flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-800 group-hover:text-[#003087]">{r.name}</div>
                <div className="text-xs text-gray-500">{r.cat} · {r.desc}</div>
              </div>
              <SimTarget targetId="cat-property-mgmt" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick} inline>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">{r.cat}</span>
              </SimTarget>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400" />
            </div>
          </SimTarget>
        ))}
      </div>
    </div>
  );
}

function ScreenReportConfig(p: SimProps) {
  const d = DAILY_OPS_DATA;
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Reports", "Property Management", "Daily Operations Report"]} />
      <h1 className="text-base font-black text-gray-800 mb-3">Daily Operations Report</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Filters</div>
        <div className="grid grid-cols-3 gap-4">
          <SimTarget targetId="filter-property" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Property *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>{PROPERTY.name}</option><option>All Properties</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="filter-date-today" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
              <div className="flex gap-2">
                <input readOnly value={d.date} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" />
                <button className="px-3 py-2 border border-[#003087] text-[#003087] text-xs font-bold rounded-lg">Today</button>
              </div>
            </div>
          </SimTarget>
          <SimTarget targetId="filter-occ-type" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Occupancy View</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Physical & Economic</option><option>Physical Only</option><option>Economic Only</option>
              </select>
            </div>
          </SimTarget>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <SimTarget targetId="btn-export" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg bg-white hover:bg-gray-50"><Download size={13} /> Export</button>
          </SimTarget>
          <SimTarget targetId="btn-generate-report" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="flex items-center gap-2 px-5 py-2 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-lg"><BarChart2 size={14} /> Generate Report</button>
          </SimTarget>
        </div>
      </div>
      {/* Live preview of report */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Live Snapshot — {d.date}</div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Physical Occ.", value: d.physicalOccupancy, color: "text-green-700", bg: "bg-green-50 border-green-200" },
            { label: "Economic Occ.", value: d.economicOccupancy, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
            { label: "Open Work Orders", value: String(d.openWorkOrders), color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
            { label: "Delinquent Accts", value: `${d.delinquentAccounts} · ${d.delinquentBalance}`, color: "text-red-700", bg: "bg-red-50 border-red-200" },
          ].map(m => (
            <div key={m.label} className={`${m.bg} border rounded-xl p-3 text-center`}>
              <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 text-center text-sm">
          {[
            ["Move-Ins Today", d.moveInsToday], ["Move-Outs Today", d.moveOutsToday],
            ["Upcoming Move-Outs (30d)", d.movingOutThisMonth], ["Tours Scheduled", d.toursScheduled],
            ["New Leads", d.prospectsTodayNew], ["Leases Expiring (30d)", d.leasesExpiring30Days],
          ].map(([l, v]) => (
            <div key={String(l)} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="text-base font-black text-gray-800">{v}</div>
              <div className="text-[10px] text-gray-500">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenDelinquencyReport(p: SimProps) {
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Reports", "Financial", "Delinquency Report"]} />
      <div className="flex items-center justify-between mb-3">
        <div><h1 className="text-base font-black text-gray-800">Delinquency Report</h1><div className="text-xs text-gray-500">As of {DAILY_OPS_DATA.date} · {PROPERTY.name} · Total: {DAILY_OPS_DATA.delinquentBalance}</div></div>
        <SimTarget targetId="btn-escalate" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
          <button className="flex items-center gap-1 px-3 py-2 border border-orange-400 bg-orange-50 text-orange-700 text-sm font-semibold rounded-lg"><AlertTriangle size={13} /> Escalate to Manager</button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TH cols={["Resident", "Unit", "Balance", "Days Overdue", "Charge Type", "Status", ""]} />
          <tbody>
            {RESIDENTS.filter(r => r.balance > 0).map((r, i) => (
              <SimTarget key={r.id} targetId={i === 0 ? "row-delinquent-1" : `row-del-${r.id}`} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
                <tr className="border-b border-gray-100 hover:bg-red-50 cursor-pointer">
                  <td className="px-3 py-2.5 font-semibold text-[#003087]">{r.name}</td>
                  <td className="px-3 py-2.5">Apt {r.unit}</td>
                  <td className="px-3 py-2.5 font-black text-red-600">${r.balance.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-orange-600 font-semibold">22 days</td>
                  <td className="px-3 py-2.5 text-gray-500">Late Fee + Charges</td>
                  <td className="px-3 py-2.5"><Badge status="Current" /></td>
                  <td className="px-3 py-2.5"><ChevronRight size={14} className="text-gray-400" /></td>
                </tr>
              </SimTarget>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenInspectionsList(p: SimProps) {
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Services", "Inspections"]} />
      <div className="flex items-center justify-between mb-3">
        <div><h1 className="text-base font-black text-gray-800">Inspections</h1><div className="text-xs text-gray-500">1 scheduled · {PROPERTY.name}</div></div>
        <SimTarget targetId="btn-add-inspection" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800"><Plus size={13} /> Add Inspection</button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-2">
          <ClipboardList size={16} className="text-amber-600" />
          <div><div className="font-bold text-amber-700">Move-Out Inspection Pending</div><div className="text-xs text-amber-600">Apt 220 — Maria Rodriguez · Due by 08/15/2026</div></div>
        </div>
        <div className="text-xs text-gray-400 italic">Click + Add Inspection to create a new inspection for any unit.</div>
      </div>
    </div>
  );
}

function ScreenInspectionForm(p: SimProps) {
  const r = RESIDENTS[3];
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Services", "Inspections", "Add Inspection"]} />
      <h1 className="text-base font-black text-gray-800 mb-3">Create Inspection</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 grid grid-cols-2 gap-4">
          <SimTarget targetId="field-insp-unit" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Unit *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Apt 220 — {r.name} (Move-Out 08/15)</option>
                {RESIDENTS.filter(rs => rs.id !== r.id).map(rs => <option key={rs.id}>Apt {rs.unit} — {rs.name}</option>)}
              </select>
            </div>
          </SimTarget>
          <div><label className="block text-xs font-bold text-gray-600 mb-1">Inspection Type</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default">
              <option>Move-Out Inspection</option><option>Move-In Inspection</option><option>Make Ready</option><option>Annual Renewal</option>
            </select>
          </div>
        </div>
        <div className="border-t border-gray-100 p-4">
          <SimTarget targetId="field-insp-checklist" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Room Checklist — Apt 220 ({r.unitType})</div>
              {["Living Room", "Kitchen", "Bathroom", "Bedroom / Closet", "Balcony/Patio", "Appliances", "Walls & Paint", "Flooring"].map(room => (
                <div key={room} className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-blue-50">
                  <span className="text-sm font-medium text-gray-700">{room}</span>
                  <select className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer bg-white">
                    <option>Excellent</option><option>Good</option><option>Fair</option><option>Damaged</option><option>Missing</option>
                  </select>
                </div>
              ))}
            </div>
          </SimTarget>
        </div>
        <div className="p-4 border-t border-gray-100">
          <SimTarget targetId="field-insp-photos" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50 hover:border-blue-400 cursor-pointer">
              <Camera size={22} className="mx-auto text-gray-400 mb-2" />
              <div className="text-sm font-semibold text-gray-600">Tap to add inspection photos</div>
              <div className="text-xs text-gray-400 mt-1">Required for any item marked Damaged or Missing</div>
            </div>
          </SimTarget>
        </div>
        <div className="px-4 pb-4 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-submit-inspection" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-5 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800 flex items-center gap-2"><CheckCircle2 size={14} /> Submit & Generate Report</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenRenewalForm(p: SimProps) {
  const r = RESIDENTS[0];
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Residents", r.name, "Renewals"]} />
      <h1 className="text-base font-black text-gray-800 mb-3">Renewal — {r.name}, Apt {r.unit}</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-sm"><span className="font-bold text-[#003087]">Current Lease:</span> <span className="text-gray-700">{r.lease}</span></div>
          <div className="text-sm"><span className="font-bold text-[#003087]">Current Rent:</span> <span className="text-gray-700">${r.rent.toLocaleString()}/mo</span></div>
        </div>
        <SimTarget targetId="btn-create-renewal" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800"><Plus size={13} /> Create Renewal Offer</button>
        </SimTarget>
        <div className="grid grid-cols-2 gap-4">
          {[["New Lease Start", "04/01/2027"], ["New Lease End", "03/31/2028"], ["Proposed Rent", "$1,545.00 (+3.3%)"]].map(([l, v]) => (
            <div key={l}><label className="block text-xs font-bold text-gray-600 mb-1">{l}</label><input readOnly value={v} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default font-semibold" /></div>
          ))}
          <SimTarget targetId="field-renewal-type" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Renewal Type *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Fixed-Term (12 months)</option><option>Month-to-Month (MTM +$200/mo)</option><option>Short-Term (6 months +$150/mo)</option>
              </select>
            </div>
          </SimTarget>
        </div>
        <div className="flex gap-3">
          <SimTarget targetId="btn-send-renewal" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-4 py-2 bg-[#003087] text-white text-sm font-bold rounded-lg hover:bg-blue-800 flex items-center gap-2"><Mail size={12} /> Send Renewal Offer</button>
          </SimTarget>
          <SimTarget targetId="btn-countersign" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-4 py-2 border border-green-500 bg-green-50 text-green-700 text-sm font-bold rounded-lg flex items-center gap-2"><CheckCircle2 size={12} /> Countersign</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenPortalInvite(p: SimProps) {
  const r = RESIDENTS[2]; // David Chen — no portal
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <div className="text-xs text-white/60">{PROPERTY.name}</div>
          <h3 className="font-black text-base">Send Resident Portal Invite</h3>
          <div className="text-white/70 text-xs">{r.name} · Apt {r.unit}</div>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{r.name} does not yet have an active Resident Portal. Invite them to enable online payments and maintenance requests.</span>
          </div>
          <div><label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
            <input readOnly value={r.email} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" /></div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <div className="font-bold">Portal Benefits:</div>
            <div>✓ Online rent payment (ACH/card) · ✓ 24/7 maintenance requests</div>
            <div>✓ Download lease documents · ✓ View ledger & payment history</div>
          </div>
          <SimTarget targetId="btn-send-invite" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="w-full py-3 bg-[#003087] text-white font-bold rounded-xl hover:bg-blue-800 flex items-center justify-center gap-2"><Mail size={16} /> Send Portal Invitation</button>
          </SimTarget>
          <SimTarget targetId="btn-confirm-invite" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="w-full py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Confirm Delivery</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenAddProspectForm(p: SimProps) {
  const pr = PROSPECTS[0];
  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={[PROPERTY.shortName, "Residents", "Prospects", "Add Prospect"]} />
      <h1 className="text-base font-black text-gray-800 mb-3">Add New Prospect</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-2.5"><span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Contact Information</span></div>
        <div className="p-4 grid grid-cols-2 gap-4">
          {[
            { id: "field-first-name", label: "First Name *", value: "Sarah" },
            { id: "field-last-name", label: "Last Name *", value: "Johnson" },
            { id: "field-email", label: "Email Address *", value: pr.email },
            { id: "field-phone", label: "Phone Number", value: pr.phone },
          ].map(f => (
            <SimTarget key={f.id} targetId={f.id} activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" />
              </div>
            </SimTarget>
          ))}
        </div>
        <div className="bg-gray-50 border-t border-b px-4 py-2.5"><span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Unit Preferences</span></div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <SimTarget targetId="field-unit-pref" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Unit Type *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                {UNIT_TYPES.map(u => <option key={u.type}>{u.type} — {u.sqft} sqft · ${u.rent.toLocaleString()}/mo</option>)}
              </select>
            </div>
          </SimTarget>
          <div><label className="block text-xs font-bold text-gray-600 mb-1">Desired Move-In</label>
            <input readOnly value={pr.desiredMoveIn} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" /></div>
          <SimTarget targetId="field-source" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <div><label className="block text-xs font-bold text-gray-600 mb-1">Lead Source *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                {["Apartment List", "Zillow", "Apartments.com", "Walk-In", "Referral", "Google", "Facebook"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </SimTarget>
        </div>
        <div className="px-4 pb-4 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-save-prospect" activeTargetId={p.activeTargetId} hint={p.hint} onClick={p.onTargetClick}>
            <button className="px-5 py-2 bg-[#003087] hover:bg-blue-800 text-white text-sm font-bold rounded-lg flex items-center gap-2"><CheckCircle2 size={14} /> Save & Send Portal Invite</button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
interface MockEntrataUIProps {
  workflowId: string;
  stepId: string;
  onStepComplete: () => void;
}

export function MockEntrataUI({ workflowId, stepId, onStepComplete }: MockEntrataUIProps) {
  const [flash, setFlash] = useState(false);
  const config = SIM_CONFIG[stepId];

  const handleComplete = useCallback(() => {
    setFlash(true);
    setTimeout(() => { setFlash(false); onStepComplete(); }, 600);
  }, [onStepComplete]);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-gray-400 text-sm text-center p-8">
        <div><div className="text-4xl mb-3">🖥️</div><div className="font-semibold mb-1">Simulation loading…</div><div className="text-xs">Mark step complete in the Coach Panel →</div></div>
      </div>
    );
  }

  const simProps: SimProps = {
    activeTargetId: config.targetId,
    hint: config.hint,
    onTargetClick: handleComplete,
    openMenu: config.openMenu,
  };

  const screens: Record<string, React.ReactNode> = {
    "main-nav":                 <ScreenMainNav {...simProps} />,
    "prospects-list":           <ScreenProspectsList {...simProps} />,
    "applicants-list":          <ScreenApplicantsList {...simProps} />,
    "residents-list":           <ScreenResidentsList {...simProps} />,
    "resident-profile":         <ScreenResidentProfile {...simProps} />,
    "resident-profile-financial": <ScreenResidentFinancial {...simProps} />,
    "resident-profile-actions": <ScreenResidentActions {...simProps} />,
    "resident-profile-renewals": <ScreenResidentRenewals {...simProps} />,
    "add-prospect-form":        <ScreenAddProspectForm {...simProps} />,
    "application-review":       <ScreenApplicationReview {...simProps} />,
    "work-orders-list":         <ScreenWorkOrdersList {...simProps} />,
    "work-order-form":          <ScreenWorkOrderForm {...simProps} />,
    "post-charge-dialog":       <ScreenPostChargeDialog {...simProps} />,
    "accept-payment-dialog":    <ScreenAcceptPaymentDialog {...simProps} />,
    "move-in-dialog":           <ScreenMoveInDialog {...simProps} />,
    "move-out-dialog":          <ScreenMoveOutDialog {...simProps} />,
    "ntv-dialog":               <ScreenNTVDialog {...simProps} />,
    "reports-list":             <ScreenReportsList {...simProps} />,
    "report-config":            <ScreenReportConfig {...simProps} />,
    "renewal-form":             <ScreenRenewalForm {...simProps} />,
    "inspections-list":         <ScreenInspectionsList {...simProps} />,
    "inspection-form":          <ScreenInspectionForm {...simProps} />,
    "portal-invite":            <ScreenPortalInvite {...simProps} />,
    "delinquency-report":       <ScreenDelinquencyReport {...simProps} />,
  };

  return (
    <div className={`h-full flex flex-col relative overflow-hidden ${flash ? "ring-4 ring-inset ring-green-400" : ""}`}>
      {flash && (
        <div className="absolute inset-0 bg-green-500/10 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-5 flex items-center gap-3 border-2 border-green-400">
            <CheckCircle2 size={28} className="text-green-500" />
            <span className="text-lg font-black text-green-700">Step Complete!</span>
          </div>
        </div>
      )}

      {/* Entrata nav shell */}
      <EntrataNav activeTargetId={config.targetId} hint={config.hint} onTargetClick={handleComplete} />

      {/* Screen content */}
      <div className="flex-1 overflow-hidden bg-white">
        {screens[config.screenType] ?? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm p-6 text-center">
            <div>No simulation for screen type: <code className="bg-gray-100 px-1 rounded">{config.screenType}</code></div>
          </div>
        )}
      </div>
    </div>
  );
}
