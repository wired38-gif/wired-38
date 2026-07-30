import React, { useState, useCallback } from "react";
import {
  Search, ChevronDown, ChevronRight, Plus, Filter,
  Bell, Settings, HelpCircle, User, Home, FileText,
  Wrench, BarChart2, Users, Star, CheckCircle2, X,
  AlertTriangle, Phone, Mail, Calendar, DollarSign,
  Clipboard, MoreHorizontal, Eye, Edit, Trash2, Download,
  Upload, Camera, ClipboardList
} from "lucide-react";
import { SIM_CONFIG, ScreenType } from "../../../data/simulationConfig";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────────────────────
const MOCK_PROSPECTS = [
  { id: 1, name: "Sarah Johnson", unitPref: "2BD/2BA", phone: "(555) 234-7890", source: "Apartment List", status: "Tour Sched.", date: "07/28/2026" },
  { id: 2, name: "Tyler Brooks", unitPref: "1BD/1BA", phone: "(555) 678-3421", source: "Zillow", status: "Applied", date: "07/26/2026" },
  { id: 3, name: "Keisha Nwankwo", unitPref: "Studio", phone: "(555) 912-0034", source: "Walk-In", status: "New Lead", date: "07/30/2026" },
  { id: 4, name: "Devon Patel", unitPref: "2BD/1BA", phone: "(555) 445-7823", source: "Referral", status: "Applied", date: "07/25/2026" },
];

const MOCK_RESIDENTS = [
  { id: 1, name: "Marcus T. Williams", unit: "312", lease: "04/01/2026 – 03/31/2027", balance: "$0.00", status: "Current" },
  { id: 2, name: "Jennifer M. Park", unit: "108", lease: "01/01/2026 – 12/31/2026", balance: "$150.00", status: "Current" },
  { id: 3, name: "Robert & Lisa Chen", unit: "415", lease: "07/01/2026 – 06/30/2027", balance: "$0.00", status: "Current" },
  { id: 4, name: "Maria Rodriguez", unit: "220", lease: "08/15/2025 – 08/14/2026", balance: "$75.00", status: "Notice" },
  { id: 5, name: "James & Tara Brooks", unit: "105", lease: "03/01/2026 – 02/28/2027", balance: "$0.00", status: "Current" },
];

const MOCK_APPLICANTS = [
  { id: 1, name: "Kevin Osei-Bonsu", unit: "204", applied: "07/27/2026", income: "$5,800/mo", status: "Pending Review" },
  { id: 2, name: "Amanda Reyes", unit: "116", applied: "07/25/2026", income: "$4,200/mo", status: "Pending Review" },
  { id: 3, name: "Christopher Lane", unit: "308", applied: "07/20/2026", income: "$6,100/mo", status: "Approved" },
];

const MOCK_WORK_ORDERS = [
  { id: "WO-2847", unit: "312", resident: "M. Williams", cat: "Plumbing", priority: "Standard", status: "Open", assigned: "Carlos M.", date: "07/29/2026" },
  { id: "WO-2846", unit: "415", resident: "R. Chen", cat: "HVAC", priority: "Urgent", status: "In Progress", assigned: "Sam R.", date: "07/28/2026" },
  { id: "WO-2844", unit: "108", resident: "J. Park", cat: "Electrical", priority: "Standard", status: "Complete", assigned: "Carlos M.", date: "07/25/2026" },
  { id: "WO-2840", unit: "Common", resident: "—", cat: "Grounds", priority: "Scheduled", status: "Scheduled", assigned: "Sam R.", date: "08/02/2026" },
];

const MOCK_LEDGER = [
  { date: "07/01/2026", desc: "Monthly Rent — August 2026", code: "RENT01", charge: "$1,895.00", payment: "", balance: "$1,895.00" },
  { date: "07/01/2026", desc: "Pet Fee — Recurring", code: "PET01", charge: "$50.00", payment: "", balance: "$1,945.00" },
  { date: "07/05/2026", desc: "Rent Payment — Check #4421", code: "", charge: "", payment: "($1,945.00)", balance: "$0.00" },
];

const MOCK_REPORTS = [
  { id: "report-daily-ops", name: "Daily Operations Report", cat: "Property Management", desc: "Occupancy, move-ins, move-outs, delinquency summary." },
  { id: "report-delinquency", name: "Delinquency Report", cat: "Financial", desc: "All residents with outstanding balances past due date." },
  { id: "report-lease-expiration", name: "Lease Expiration Report", cat: "Property Management", desc: "Upcoming lease end dates with renewal status." },
  { id: "report-occupancy", name: "Occupancy Report", cat: "Property Management", desc: "Physical and economic occupancy by unit type." },
  { id: "report-rent-roll", name: "Rent Roll", cat: "Financial", desc: "All units with current rent, status, and concessions." },
  { id: "report-move-in-out", name: "Move-In / Move-Out Report", cat: "Property Management", desc: "All moves within a date range." },
];

// ─────────────────────────────────────────────────────────────
//  HIGHLIGHT WRAPPER — the pulsing ring on the target element
// ─────────────────────────────────────────────────────────────
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
  const [wrongClick, setWrongClick] = useState(false);

  const Tag = inline ? "span" : "div";

  return (
    <Tag
      className={`relative cursor-pointer select-none transition-all duration-150 ${className} ${
        isTarget
          ? "ring-2 ring-[#0066cc] ring-offset-1 rounded shadow-lg shadow-blue-500/30"
          : ""
      } ${wrongClick ? "opacity-60" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        if (isTarget) {
          onClick();
        } else {
          setWrongClick(true);
          setTimeout(() => setWrongClick(false), 400);
        }
      }}
    >
      {isTarget && (
        <>
          {/* Pulsing glow */}
          <span className="absolute inset-0 rounded ring-2 ring-[#0066cc]/50 animate-pulse pointer-events-none z-10" />
          {/* Hint tooltip */}
          <span
            className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#0066cc] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-30 shadow-lg"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,102,204,0.4))" }}
          >
            ↓ {hint}
          </span>
        </>
      )}
      {children}
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────
//  ENTRATA TOP NAVIGATION SHELL
// ─────────────────────────────────────────────────────────────
function EntrataTopNav({
  activeTargetId, hint, onTargetClick, activePage
}: {
  activeTargetId: string; hint: string; onTargetClick: () => void; activePage?: string;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const navItems = [
    {
      id: "nav-residents", label: "Residents", children: [
        { id: "nav-prospects", label: "Prospects" },
        { id: "nav-applicants", label: "Applicants" },
        { id: "nav-residents-sub", label: "Residents" },
      ]
    },
    {
      id: "nav-services", label: "Services", children: [
        { id: "nav-workorders", label: "Work Orders" },
        { id: "nav-inspections", label: "Inspections" },
        { id: "nav-vendors", label: "Vendors" },
      ]
    },
    {
      id: "nav-reports", label: "Reports", children: [
        { id: "nav-reports-pm", label: "Property Management" },
        { id: "nav-reports-financial", label: "Financial" },
        { id: "nav-reports-marketing", label: "Marketing" },
      ]
    },
    { id: "nav-admin", label: "Admin", children: [] },
  ];

  return (
    <div className="bg-[#003087] select-none" onClick={() => setOpenMenu(null)}>
      <div className="flex items-center h-12 px-4 gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="text-white font-extrabold text-lg tracking-tight">entrata</div>
        </div>

        {/* Nav Items */}
        {navItems.map(item => (
          <div key={item.id} className="relative">
            <SimTarget
              targetId={item.id}
              activeTargetId={activeTargetId}
              hint={hint}
              onClick={onTargetClick}
              inline
            >
              <button
                className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activePage === item.id
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === item.id ? null : item.id); }}
              >
                {item.label}
                {item.children.length > 0 && <ChevronDown size={12} />}
              </button>
            </SimTarget>

            {/* Dropdown */}
            {openMenu === item.id && item.children.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[160px] py-1" onClick={e => e.stopPropagation()}>
                {item.children.map(child => (
                  <SimTarget
                    key={child.id}
                    targetId={child.id}
                    activeTargetId={activeTargetId}
                    hint={hint}
                    onClick={onTargetClick}
                  >
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      {child.label}
                    </button>
                  </SimTarget>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <button className="text-white/60 hover:text-white p-1"><Bell size={16} /></button>
          <button className="text-white/60 hover:text-white p-1"><HelpCircle size={16} /></button>
          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-white/80 text-xs">Admin User</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
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

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-gray-100 border-b border-gray-200">
        {cols.map(col => (
          <th key={col} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{col}</th>
        ))}
      </tr>
    </thead>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
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
    "Emergency": "bg-red-100 text-red-700 border-red-200",
    "Urgent": "bg-orange-100 text-orange-700 border-orange-200",
    "Standard": "bg-gray-100 text-gray-600 border-gray-200",
  };
  const cls = colors[status] || "bg-gray-100 text-gray-600 border-gray-200";
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>{status}</span>;
}

// ─────────────────────────────────────────────────────────────
//  INDIVIDUAL SCREEN RENDERERS
// ─────────────────────────────────────────────────────────────

function ScreenMainNav({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-lg text-center">
        <div className="text-gray-400 text-sm mb-6">Use the navigation bar above to go to the next screen.</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Users size={22} className="text-blue-600" />, label: "Residents", sub: "Prospects · Applicants · Residents" },
            { icon: <Wrench size={22} className="text-green-600" />, label: "Services", sub: "Work Orders · Inspections" },
            { icon: <BarChart2 size={22} className="text-purple-600" />, label: "Reports", sub: "Property Mgmt · Financial" },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <div className="text-sm font-bold text-gray-700">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenProspectsList({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto">
      <PageBreadcrumb path={["Residents", "Prospects"]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Prospects</h1>
        <SimTarget targetId="btn-add-prospect" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={14} /> Add Prospect
          </button>
        </SimTarget>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <Search size={14} className="text-gray-400" />
          <span className="text-sm text-gray-400">Search prospects…</span>
        </div>
        <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white">
          <Filter size={13} /> Filter
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TableHeader cols={["Name", "Unit Pref.", "Phone", "Source", "Status", "Date", ""]} />
          <tbody>
            {MOCK_PROSPECTS.map((p, i) => (
              <SimTarget
                key={p.id}
                targetId={i === 0 ? "row-sarah" : `row-prospect-${p.id}`}
                activeTargetId={activeTargetId}
                hint={hint}
                onClick={onTargetClick}
              >
                <tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-3 py-3 font-medium text-blue-600">{p.name}</td>
                  <td className="px-3 py-3 text-gray-600">{p.unitPref}</td>
                  <td className="px-3 py-3 text-gray-600">{p.phone}</td>
                  <td className="px-3 py-3 text-gray-600">{p.source}</td>
                  <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-3 text-gray-500">{p.date}</td>
                  <td className="px-3 py-3"><MoreHorizontal size={16} className="text-gray-400" /></td>
                </tr>
              </SimTarget>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenApplicantsList({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto">
      <PageBreadcrumb path={["Residents", "Applicants"]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Applicants</h1>
        <SimTarget targetId="filter-pending" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-blue-500 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg">
            <Filter size={13} /> Status: Pending Review
          </button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TableHeader cols={["Name", "Unit", "Applied", "Income", "Status", ""]} />
          <tbody>
            {MOCK_APPLICANTS.map((a, i) => (
              <SimTarget
                key={a.id}
                targetId={i === 0 ? "row-applicant-1" : `row-applicant-${a.id}`}
                activeTargetId={activeTargetId}
                hint={hint}
                onClick={onTargetClick}
              >
                <tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                  <td className="px-3 py-3 font-medium text-blue-600">{a.name}</td>
                  <td className="px-3 py-3 text-gray-600">{a.unit}</td>
                  <td className="px-3 py-3 text-gray-600">{a.applied}</td>
                  <td className="px-3 py-3 text-gray-600">{a.income}</td>
                  <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-3"><ChevronRight size={14} className="text-gray-400" /></td>
                </tr>
              </SimTarget>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenResidentsList({ activeTargetId, hint, onTargetClick }: SimProps) {
  const targetMap: Record<string, string> = {
    "row-marcus": "0", "row-jennifer": "1", "row-maria": "3", "search-resident": "search"
  };
  return (
    <div className="p-5 h-full overflow-auto">
      <PageBreadcrumb path={["Residents", "Residents"]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Residents</h1>
        <div className="text-sm text-gray-500">56 total residents</div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <SimTarget targetId="search-resident" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} className="flex-1">
          <div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg px-3 py-2 bg-white w-full">
            <Search size={14} className="text-gray-400" />
            <span className="text-sm text-gray-400">Search by name, unit, or phone…</span>
          </div>
        </SimTarget>
        <button className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white">
          <Filter size={13} /> Filter
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TableHeader cols={["Name", "Unit", "Lease Term", "Balance", "Status", ""]} />
          <tbody>
            {MOCK_RESIDENTS.map((r, i) => {
              const tid = i === 0 ? "row-marcus" : i === 1 ? "row-jennifer" : i === 3 ? "row-maria" : `row-resident-${r.id}`;
              return (
                <SimTarget key={r.id} targetId={tid} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
                  <tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer">
                    <td className="px-3 py-3 font-medium text-blue-600">{r.name}</td>
                    <td className="px-3 py-3 text-gray-600">Apt {r.unit}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{r.lease}</td>
                    <td className={`px-3 py-3 font-semibold ${r.balance !== "$0.00" ? "text-red-600" : "text-gray-600"}`}>{r.balance}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-3"><ChevronRight size={14} className="text-gray-400" /></td>
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

function ResidentProfileTabs({ activeTab, activeTargetId, hint, onTargetClick }: {
  activeTab: string; activeTargetId: string; hint: string; onTargetClick: () => void;
}) {
  const tabs = ["Overview", "Lease", "Financial", "Documents", "Maintenance", "Messages", "Renewals", "History"];
  return (
    <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
      {tabs.map(tab => {
        const tabId = tab === "Financial" ? "tab-financial"
          : tab === "Renewals" ? "tab-renewals"
          : tab === "Overview" ? "tab-overview"
          : `tab-${tab.toLowerCase()}`;
        const isActive = tab.toLowerCase() === activeTab.toLowerCase();
        return (
          <SimTarget key={tab} targetId={tabId} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} inline>
            <button className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? "border-[#0066cc] text-[#0066cc]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
              {tab}
            </button>
          </SimTarget>
        );
      })}
    </div>
  );
}

function ResidentProfileHeader({ resident, activeTargetId, hint, onTargetClick, showActionsMenu, showNoticesMenu }: {
  resident: typeof MOCK_RESIDENTS[0]; activeTargetId: string; hint: string; onTargetClick: () => void;
  showActionsMenu?: boolean; showNoticesMenu?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(showActionsMenu ?? false);

  const actionItems = [
    { id: "action-move-in", label: "Move In" },
    { id: "action-move-out", label: "Move Out Resident" },
    { id: "action-ntv", label: "Notice to Vacate" },
    { id: "action-notice", label: "Generate Notice" },
    { id: "action-renewal", label: "Create Renewal" },
    { id: "action-transfer", label: "Transfer Unit" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{resident.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">Apt {resident.unit}</span>
            <span>·</span>
            <span>{resident.lease}</span>
            <span>·</span>
            <StatusBadge status={resident.status} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1 text-gray-500"><Phone size={12} /> (555) 234-7890</span>
            <span className="flex items-center gap-1 text-gray-500"><Mail size={12} /> resident@email.com</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Portal status */}
          <SimTarget targetId="portal-status" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full" /> Portal Active
            </div>
          </SimTarget>

          <SimTarget targetId="btn-add-note" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors">
              + Note
            </button>
          </SimTarget>

          <SimTarget targetId="btn-message" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors">
              Message
            </button>
          </SimTarget>

          <SimTarget targetId="btn-finalize-lease" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-3 py-2 bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
              Finalize Lease
            </button>
          </SimTarget>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              Actions <ChevronDown size={13} />
            </button>
            {(menuOpen || showActionsMenu || showNoticesMenu) && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[200px] py-1">
                {actionItems.map(item => (
                  <SimTarget key={item.id} targetId={item.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      {item.label}
                    </button>
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

function ScreenResidentProfile({ activeTargetId, hint, onTargetClick }: SimProps) {
  const resident = MOCK_RESIDENTS[0];
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <ResidentProfileHeader resident={resident} activeTargetId={activeTargetId} hint={hint} onTargetClick={onTargetClick} />
      <ResidentProfileTabs activeTab="overview" activeTargetId={activeTargetId} hint={hint} onTargetClick={onTargetClick} />
      <div className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Lease Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Unit</span><span className="font-semibold">Apt 204</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Lease Start</span><span>08/01/2026</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Lease End</span><span>07/31/2027</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly Rent</span><span className="font-semibold text-green-700">$1,895.00</span></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account Balance</div>
            <div className="text-3xl font-black text-green-600 mb-1">$0.00</div>
            <div className="text-xs text-gray-400">No outstanding balance</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenResidentFinancial({ activeTargetId, hint, onTargetClick }: SimProps) {
  const resident = MOCK_RESIDENTS[1];
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <ResidentProfileHeader resident={resident} activeTargetId={activeTargetId} hint={hint} onTargetClick={onTargetClick} />
      <ResidentProfileTabs activeTab="financial" activeTargetId={activeTargetId} hint={hint} onTargetClick={onTargetClick} />
      <div className="flex-1 overflow-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-700">Ledger</h2>
          <div className="flex items-center gap-2">
            <SimTarget targetId="btn-accept-payment" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <button className="px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                Accept Payment
              </button>
            </SimTarget>
            <SimTarget targetId="btn-post-charge" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <button className="px-3 py-1.5 bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                Post Charge
              </button>
            </SimTarget>
            <SimTarget targetId="btn-close-ledger" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <button className="px-3 py-1.5 border border-amber-400 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-colors">
                Close Ledger
              </button>
            </SimTarget>
            <SimTarget targetId="btn-generate-soda" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <button className="px-3 py-1.5 border border-purple-400 bg-purple-50 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-100 transition-colors">
                Generate SODA
              </button>
            </SimTarget>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <TableHeader cols={["Date", "Description", "Code", "Charge", "Payment", "Balance"]} />
            <tbody>
              {MOCK_LEDGER.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{row.date}</td>
                  <td className="px-3 py-2.5 text-gray-700">{row.desc}</td>
                  <td className="px-3 py-2.5"><code className="text-xs bg-gray-100 text-gray-600 px-1 rounded">{row.code}</code></td>
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

function ScreenResidentActions({ activeTargetId, hint, onTargetClick, openMenu }: SimProps) {
  const resident = MOCK_RESIDENTS[3];
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <ResidentProfileHeader
        resident={resident}
        activeTargetId={activeTargetId}
        hint={hint}
        onTargetClick={onTargetClick}
        showActionsMenu={openMenu === "actions" || ["action-move-in", "action-move-out", "action-ntv", "action-renewal"].includes(activeTargetId)}
        showNoticesMenu={openMenu === "notices" || activeTargetId === "action-notice"}
      />
      <ResidentProfileTabs activeTab="overview" activeTargetId={activeTargetId} hint={hint} onTargetClick={onTargetClick} />
      <div className="flex-1 overflow-auto p-5 flex items-center justify-center">
        <div className="text-sm text-gray-400">Click Actions above to select an option.</div>
      </div>
    </div>
  );
}

function ScreenResidentRenewals({ activeTargetId, hint, onTargetClick }: SimProps) {
  const resident = MOCK_RESIDENTS[0];
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <ResidentProfileHeader resident={resident} activeTargetId={activeTargetId} hint={hint} onTargetClick={onTargetClick} />
      <ResidentProfileTabs activeTab="renewals" activeTargetId={activeTargetId} hint={hint} onTargetClick={onTargetClick} />
      <div className="flex-1 overflow-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-700">Renewals</h2>
          <SimTarget targetId="btn-create-renewal" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0066cc] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={13} /> Create Renewal Offer
            </button>
          </SimTarget>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-500 italic">
          No renewal offers on file. Lease expires 07/31/2027.
        </div>
      </div>
    </div>
  );
}

function ScreenAddProspectForm({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={["Residents", "Prospects", "Add Prospect"]} />
      <h1 className="text-lg font-bold text-gray-800 mb-4">Add New Prospect</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <span className="text-sm font-bold text-gray-600">Contact Information</span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[
            { id: "field-first-name", label: "First Name *", value: "Sarah" },
            { id: "field-last-name", label: "Last Name *", value: "Johnson" },
            { id: "field-email", label: "Email Address *", value: "sjohnson@email.com" },
            { id: "field-phone", label: "Phone Number", value: "(555) 234-7890" },
          ].map(f => (
            <SimTarget key={f.id} targetId={f.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 text-gray-800 outline-none cursor-pointer" />
              </div>
            </SimTarget>
          ))}
        </div>
        <div className="bg-gray-50 border-t border-b border-gray-200 px-5 py-3 mt-1">
          <span className="text-sm font-bold text-gray-600">Unit Preferences</span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[
            { id: "field-unit-pref", label: "Unit Type *", value: "2 Bedroom / 2 Bath" },
            { id: "field-movein-pref", label: "Desired Move-In", value: "08/01/2026" },
          ].map(f => (
            <SimTarget key={f.id} targetId={f.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 text-gray-800 outline-none cursor-pointer" />
              </div>
            </SimTarget>
          ))}
          <SimTarget targetId="field-source" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Lead Source *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 text-gray-800 outline-none cursor-pointer appearance-none">
                <option>Apartment List</option>
              </select>
            </div>
          </SimTarget>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-save-prospect" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-5 py-2 bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
              <CheckCircle2 size={14} /> Save & Send Portal Invite
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenWorkOrdersList({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto">
      <PageBreadcrumb path={["Services", "Maintenance", "Work Orders"]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Work Orders</h1>
        <SimTarget targetId="btn-add-wo" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus size={14} /> Add Work Order
          </button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TableHeader cols={["WO #", "Unit", "Resident", "Category", "Priority", "Status", "Assigned", "Date"]} />
          <tbody>
            {MOCK_WORK_ORDERS.map(wo => (
              <tr key={wo.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                <td className="px-3 py-3 text-blue-600 font-medium">{wo.id}</td>
                <td className="px-3 py-3">Apt {wo.unit}</td>
                <td className="px-3 py-3 text-gray-600">{wo.resident}</td>
                <td className="px-3 py-3 text-gray-600">{wo.cat}</td>
                <td className="px-3 py-3"><StatusBadge status={wo.priority} /></td>
                <td className="px-3 py-3"><StatusBadge status={wo.status} /></td>
                <td className="px-3 py-3 text-gray-600">{wo.assigned}</td>
                <td className="px-3 py-3 text-gray-500 text-xs">{wo.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenWorkOrderForm({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={["Services", "Maintenance", "Work Orders", "Add Work Order"]} />
      <h1 className="text-lg font-bold text-gray-800 mb-4">Create Work Order</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 grid grid-cols-2 gap-4">
          <SimTarget targetId="field-wo-unit" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unit / Location *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Apt 312 — M. Williams</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-priority" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category & Priority *</label>
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                  <option>Plumbing</option>
                </select>
                <SimTarget targetId="field-wo-priority-emergency" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} inline>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                    <option>Standard</option>
                    <option>Urgent</option>
                    <option>Emergency</option>
                    <option>Scheduled</option>
                  </select>
                </SimTarget>
              </div>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-description" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} className="col-span-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
              <textarea readOnly rows={3} value="Kitchen faucet dripping from cold handle. Located under the window above the sink. Resident reports it has been dripping for 2 days." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 text-gray-800 resize-none outline-none cursor-pointer" />
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-pte" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="w-4 h-4 border-2 border-[#0066cc] rounded bg-[#0066cc] flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700">Permission to Enter</div>
                <div className="text-xs text-gray-500">Resident has authorized entry without being present</div>
              </div>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-tech" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Technician</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Carlos Martinez</option>
                <option>Sam Rodriguez</option>
                <option>Unassigned</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="field-wo-notes" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} className="col-span-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Notes</label>
              <textarea rows={2} placeholder="Technician notes, update log, timestamp updates…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer resize-none" />
            </div>
          </SimTarget>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-submit-wo" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-5 py-2 bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
              <Clipboard size={14} /> Submit Work Order
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenMoveInDialog({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Move-In — Sarah Johnson</h3>
          <X size={16} className="opacity-60 cursor-pointer" />
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            <strong>Unit 204</strong> · 2BD/2BA · Monthly Rent: $1,895.00
          </div>
          {[
            { id: "field-movein-date", label: "Official Move-In Date *", value: "08/01/2026", type: "date" },
            { id: "field-fob-number", label: "Key / Fob Number", value: "FOB-2847", type: "text" },
          ].map(f => (
            <SimTarget key={f.id} targetId={f.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer font-medium" />
              </div>
            </SimTarget>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-2 text-xs text-amber-700">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            Verify ledger balance is $0.00 or at required amount before saving.
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-save-movein" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-5 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <CheckCircle2 size={14} /> Save Move-In
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenMoveOutDialog({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Move Out — Maria Rodriguez</h3>
          <X size={16} className="opacity-60 cursor-pointer" />
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Move-Out Date *", value: "08/15/2026" },
              { label: "Unit Condition", value: "Normal Wear" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" />
              </div>
            ))}
          </div>
          <SimTarget targetId="field-forwarding-addr" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Forwarding Address *</label>
              <input readOnly value="123 New Street, Austin TX 78701" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" />
              <div className="text-[10px] text-amber-600 mt-1">Required for SODA mailing within legal timeframe</div>
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <button className="px-5 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <CheckCircle2 size={14} /> Confirm Move-Out
          </button>
        </div>
      </div>
    </div>
  );
}

function ScreenNTVDialog({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <h3 className="font-bold text-base">Notice to Vacate — Maria Rodriguez, Apt 220</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SimTarget targetId="field-notice-date" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Notice Received *</label>
                <input readOnly value="07/15/2026" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" />
              </div>
            </SimTarget>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Expected Move-Out *</label>
              <input readOnly value="08/15/2026" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" />
            </div>
          </div>
          <SimTarget targetId="field-vacate-reason" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Reason for Vacating *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Buying a Home</option>
                <option>Job Relocation</option>
                <option>Transfer</option>
                <option>Lease Not Renewed</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="field-ntv-notes" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Notes</label>
              <textarea readOnly rows={2} value="Resident purchasing home nearby. Provided verbal notice 07/14, written notice received 07/15." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 resize-none outline-none cursor-pointer" />
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-save-ntv" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-5 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <CheckCircle2 size={14} /> Save Notice
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenPostChargeDialog({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <h3 className="font-bold text-base">Post Charge — Jennifer Park, Apt 108</h3>
        </div>
        <div className="p-5 space-y-4">
          <SimTarget targetId="field-income-code" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Income Code *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>LATE01 — Late Fee</option>
                <option>PET01 — Pet Fee</option>
                <option>PARK01 — Parking</option>
                <option>UTIL01 — Utility Reconciliation</option>
                <option>CLEAN01 — Cleaning Fee</option>
              </select>
            </div>
          </SimTarget>
          <div className="grid grid-cols-2 gap-3">
            <SimTarget targetId="field-charge-amount" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Amount *</label>
                <input readOnly value="$150.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer font-semibold" />
              </div>
            </SimTarget>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Posting Date *</label>
              <input readOnly value="07/30/2026" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" />
            </div>
          </div>
          <SimTarget targetId="field-charge-desc" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Description / Notes</label>
              <textarea readOnly rows={2} value="Late fee per lease Section 4.2 — rent received 07/08, grace period expired 07/05." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 resize-none outline-none cursor-pointer" />
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-post-charge-submit" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-5 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <DollarSign size={14} /> Post Charge
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenAcceptPaymentDialog({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <h3 className="font-bold text-base">Accept Payment — Jennifer Park, Apt 108</h3>
        </div>
        <div className="p-5 space-y-4">
          <SimTarget targetId="field-payment-method" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Payment Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {["Check", "Money Order", "Cash"].map((m, i) => (
                  <div key={m} className={`border rounded-lg px-3 py-2 text-sm text-center cursor-pointer ${i === 0 ? "border-[#0066cc] bg-blue-50 text-blue-700 font-semibold" : "border-gray-200 text-gray-500"}`}>{m}</div>
                ))}
              </div>
            </div>
          </SimTarget>
          <div className="grid grid-cols-2 gap-3">
            <SimTarget targetId="field-payment-amount" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Amount *</label>
                <input readOnly value="$1,895.00" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer font-semibold" />
              </div>
            </SimTarget>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Check Number</label>
              <input readOnly value="#4422" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" />
            </div>
          </div>
          <SimTarget targetId="field-payment-apply" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-bold text-gray-600 mb-2">Applied To</div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Monthly Rent — Aug 2026</span><span className="font-semibold">$1,895.00</span></div>
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-post-payment" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
              <CheckCircle2 size={14} /> Post Payment & Print Receipt
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenReportsList({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto">
      <PageBreadcrumb path={["Reports", "Report Library"]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Reports</h1>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-400">
          <Search size={13} /> Search reports…
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {MOCK_REPORTS.map(r => (
          <SimTarget key={r.id} targetId={r.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors group">
              <BarChart2 size={18} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{r.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.cat} · {r.desc}</div>
              </div>
              <SimTarget targetId="cat-property-mgmt" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} inline>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{r.cat}</span>
              </SimTarget>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400" />
            </div>
          </SimTarget>
        ))}
      </div>
    </div>
  );
}

function ScreenReportConfig({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={["Reports", "Property Management", "Daily Operations Report"]} />
      <h1 className="text-lg font-bold text-gray-800 mb-4">Daily Operations Report</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Report Filters</div>
        <div className="grid grid-cols-2 gap-4">
          <SimTarget targetId="filter-property" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Property *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Elmwood Apartments</option>
                <option>All Properties</option>
              </select>
            </div>
          </SimTarget>
          <SimTarget targetId="filter-date-today" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Date *</label>
              <div className="flex gap-2">
                <input readOnly value="07/30/2026" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" />
                <button className="px-3 py-2 border border-[#0066cc] text-[#0066cc] text-xs font-bold rounded-lg">Today</button>
              </div>
            </div>
          </SimTarget>
          <SimTarget targetId="filter-occ-type" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Occupancy Type</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Physical & Economic</option>
                <option>Physical Only</option>
                <option>Economic Only</option>
              </select>
            </div>
          </SimTarget>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <SimTarget targetId="btn-export" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50">
              <Download size={13} /> Export
            </button>
          </SimTarget>
          <SimTarget targetId="btn-generate-report" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="flex items-center gap-2 px-5 py-2 bg-[#0066cc] hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
              <BarChart2 size={14} /> Generate Report
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenDelinquencyReport({ activeTargetId, hint, onTargetClick }: SimProps) {
  const rows = [
    { name: "Jennifer M. Park", unit: "108", balance: "$150.00", days: "25", type: "Late Fee" },
    { name: "Maria Rodriguez", unit: "220", balance: "$75.00", days: "18", type: "Balance" },
    { name: "Unit 501 — Vacant", unit: "501", balance: "$0.00", days: "—", type: "—" },
  ];
  return (
    <div className="p-5 h-full overflow-auto">
      <PageBreadcrumb path={["Reports", "Financial", "Delinquency Report"]} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Delinquency Report</h1>
          <div className="text-xs text-gray-500 mt-0.5">As of 07/30/2026 · Elmwood Apartments</div>
        </div>
        <SimTarget targetId="btn-escalate" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-orange-400 bg-orange-50 text-orange-700 text-sm font-semibold rounded-lg">
            <AlertTriangle size={13} /> Escalate to Manager
          </button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <TableHeader cols={["Resident", "Unit", "Balance", "Days Overdue", "Type", ""]} />
          <tbody>
            {rows.map((r, i) => (
              <SimTarget key={i} targetId={i === 0 ? "row-delinquent-1" : `row-del-${i}`} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
                <tr className="border-b border-gray-100 hover:bg-red-50 cursor-pointer">
                  <td className="px-3 py-3 font-medium text-blue-600">{r.name}</td>
                  <td className="px-3 py-3">Apt {r.unit}</td>
                  <td className={`px-3 py-3 font-bold ${r.balance !== "$0.00" ? "text-red-600" : "text-gray-400"}`}>{r.balance}</td>
                  <td className={`px-3 py-3 ${r.days !== "—" ? "text-orange-600 font-semibold" : "text-gray-400"}`}>{r.days !== "—" ? `${r.days} days` : "—"}</td>
                  <td className="px-3 py-3 text-gray-500">{r.type}</td>
                  <td className="px-3 py-3"><ChevronRight size={14} className="text-gray-400" /></td>
                </tr>
              </SimTarget>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenApplicationReview({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <h1 className="text-lg font-bold text-gray-800">Kevin Osei-Bonsu — Application #A-3847</h1>
        <div className="text-sm text-gray-500 mt-0.5">Applied 07/27/2026 · Unit 204 · 2BD/2BA</div>
      </div>
      <div className="flex border-b border-gray-200 bg-white">
        {["Application", "Screening Results", "Documents", "Messages"].map(tab => (
          <SimTarget key={tab} targetId={tab === "Application" ? "tab-application" : tab === "Screening Results" ? "tab-screening" : `tab-${tab.toLowerCase()}`} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick} inline>
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === "Application" ? "border-[#0066cc] text-[#0066cc]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab}
            </button>
          </SimTarget>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Employment</div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Employer</span><span>Acme Corp</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly Income</span><span className="font-bold text-green-700">$5,800</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rent-to-Income</span><span className="font-semibold">32.6%</span></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Screening Status</div>
            <div className="flex items-center gap-2 text-sm text-gray-500 italic">Not yet run</div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <SimTarget targetId="btn-run-screening" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-4 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Eye size={14} /> Run Screening
            </button>
          </SimTarget>
          <SimTarget targetId="btn-set-status" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Edit size={13} /> Set Status
            </button>
          </SimTarget>
          <SimTarget targetId="btn-send-letter" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-4 py-2 border border-gray-300 bg-white text-sm font-semibold rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Mail size={13} /> Send Letter
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenInspectionsList({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto">
      <PageBreadcrumb path={["Services", "Inspections"]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">Inspections</h1>
        <SimTarget targetId="btn-add-inspection" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0066cc] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Add Inspection
          </button>
        </SimTarget>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
        <ClipboardList size={32} className="mx-auto mb-3 text-gray-300" />
        No inspections scheduled. Click + Add Inspection to create one.
      </div>
    </div>
  );
}

function ScreenInspectionForm({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={["Services", "Inspections", "Add Inspection"]} />
      <h1 className="text-lg font-bold text-gray-800 mb-4">Create Inspection</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 grid grid-cols-2 gap-4">
          {[
            { id: "field-insp-unit", label: "Unit *", value: "Apt 220 — Maria Rodriguez" },
          ].map(f => (
            <SimTarget key={f.id} targetId={f.id} activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-blue-50 outline-none cursor-pointer" />
              </div>
            </SimTarget>
          ))}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Inspection Type</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default">
              <option>Move-Out Inspection</option>
            </select>
          </div>
        </div>
        <div className="border-t border-gray-200 p-5">
          <SimTarget targetId="field-insp-checklist" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Room Checklist</div>
              {["Living Room", "Kitchen", "Master Bedroom", "Bathroom"].map(room => (
                <div key={room} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{room}</span>
                  <select className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer">
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Damaged</option>
                  </select>
                </div>
              ))}
            </div>
          </SimTarget>
        </div>
        <div className="p-5 border-t border-gray-100">
          <SimTarget targetId="field-insp-photos" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:border-blue-400 cursor-pointer transition-colors">
              <Camera size={24} className="mx-auto text-gray-400 mb-2" />
              <div className="text-sm font-semibold text-gray-600">Click to add photos</div>
              <div className="text-xs text-gray-400 mt-1">Attach photos for damaged items</div>
            </div>
          </SimTarget>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <SimTarget targetId="btn-submit-inspection" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-5 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <CheckCircle2 size={14} /> Submit & Generate Report
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenRenewalForm({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="p-5 h-full overflow-auto bg-gray-50">
      <PageBreadcrumb path={["Residents", "Residents", "Marcus Williams", "Renewals"]} />
      <h1 className="text-lg font-bold text-gray-800 mb-4">Renewal Offer — Marcus T. Williams, Apt 312</h1>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
        <SimTarget targetId="btn-create-renewal" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Create Renewal Offer
          </button>
        </SimTarget>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "New Lease Start", value: "04/01/2027" },
            { label: "New Lease End", value: "03/31/2028" },
            { label: "New Monthly Rent", value: "$1,945.00" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
              <input readOnly value={f.value} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" />
            </div>
          ))}
          <SimTarget targetId="field-renewal-type" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Renewal Type *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                <option>Fixed-Term (12 months)</option>
                <option>Month-to-Month (MTM)</option>
                <option>Short-Term (3–6 months)</option>
              </select>
            </div>
          </SimTarget>
        </div>
        <div className="flex justify-end gap-3">
          <SimTarget targetId="btn-send-renewal" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-4 py-2 bg-[#0066cc] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Mail size={13} /> Send Renewal Offer
            </button>
          </SimTarget>
          <SimTarget targetId="btn-countersign" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="px-4 py-2 border border-green-500 bg-green-50 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2">
              <CheckCircle2 size={13} /> Countersign
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

function ScreenPortalInvite({ activeTargetId, hint, onTargetClick }: SimProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-500/20 p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#003087] text-white px-5 py-4">
          <h3 className="font-bold text-base">Send Resident Portal Invite</h3>
          <div className="text-white/70 text-sm mt-0.5">Marcus T. Williams · Apt 312</div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
            <input readOnly value="marcus.williams@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none cursor-default" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 space-y-1">
            <div className="font-semibold">Portal Benefits:</div>
            <div>✓ Online rent payments · ✓ Submit maintenance requests</div>
            <div>✓ Download lease documents · ✓ Community announcements</div>
          </div>
          <SimTarget targetId="btn-send-invite" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="w-full py-3 bg-[#0066cc] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Mail size={16} /> Send Portal Invitation
            </button>
          </SimTarget>
          <SimTarget targetId="btn-confirm-invite" activeTargetId={activeTargetId} hint={hint} onClick={onTargetClick}>
            <button className="w-full py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Confirm Delivery
            </button>
          </SimTarget>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
interface SimProps {
  activeTargetId: string;
  hint: string;
  onTargetClick: () => void;
  openMenu?: string;
  activeTab?: string;
}

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
    setTimeout(() => {
      setFlash(false);
      onStepComplete();
    }, 600);
  }, [onStepComplete]);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-gray-400 text-sm p-8 text-center">
        <div>
          <div className="text-4xl mb-3">🖥️</div>
          <div className="font-semibold mb-1">Simulation coming soon</div>
          <div className="text-xs">Mark this step complete in the Coach Panel →</div>
        </div>
      </div>
    );
  }

  const simProps: SimProps = {
    activeTargetId: config.targetId,
    hint: config.hint,
    onTargetClick: handleComplete,
    openMenu: config.openMenu,
    activeTab: config.activeTab,
  };

  const SCREENS: Record<string, React.ReactNode> = {
    "main-nav": <ScreenMainNav {...simProps} />,
    "prospects-list": <ScreenProspectsList {...simProps} />,
    "applicants-list": <ScreenApplicantsList {...simProps} />,
    "residents-list": <ScreenResidentsList {...simProps} />,
    "resident-profile": <ScreenResidentProfile {...simProps} />,
    "resident-profile-financial": <ScreenResidentFinancial {...simProps} />,
    "resident-profile-actions": <ScreenResidentActions {...simProps} />,
    "resident-profile-renewals": <ScreenResidentRenewals {...simProps} />,
    "add-prospect-form": <ScreenAddProspectForm {...simProps} />,
    "application-review": <ScreenApplicationReview {...simProps} />,
    "work-orders-list": <ScreenWorkOrdersList {...simProps} />,
    "work-order-form": <ScreenWorkOrderForm {...simProps} />,
    "post-charge-dialog": <ScreenPostChargeDialog {...simProps} />,
    "accept-payment-dialog": <ScreenAcceptPaymentDialog {...simProps} />,
    "move-in-dialog": <ScreenMoveInDialog {...simProps} />,
    "move-out-dialog": <ScreenMoveOutDialog {...simProps} />,
    "ntv-dialog": <ScreenNTVDialog {...simProps} />,
    "reports-list": <ScreenReportsList {...simProps} />,
    "report-config": <ScreenReportConfig {...simProps} />,
    "renewal-form": <ScreenRenewalForm {...simProps} />,
    "inspections-list": <ScreenInspectionsList {...simProps} />,
    "inspection-form": <ScreenInspectionForm {...simProps} />,
    "portal-invite": <ScreenPortalInvite {...simProps} />,
    "delinquency-report": <ScreenDelinquencyReport {...simProps} />,
  };

  return (
    <div className={`h-full flex flex-col relative overflow-hidden transition-all duration-300 ${flash ? "ring-4 ring-inset ring-green-400" : ""}`}>
      {/* Success flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-green-500/15 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-5 flex items-center gap-3 border-2 border-green-400">
            <CheckCircle2 size={28} className="text-green-500" />
            <span className="text-lg font-bold text-green-700">Step Complete!</span>
          </div>
        </div>
      )}

      {/* Entrata Top Nav */}
      <EntrataTopNav
        activeTargetId={config.targetId}
        hint={config.hint}
        onTargetClick={handleComplete}
        activePage={config.screenType === "main-nav" ? undefined : undefined}
      />

      {/* Screen Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {SCREENS[config.screenType] ?? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Simulation screen not found for type: {config.screenType}
          </div>
        )}
      </div>
    </div>
  );
}
