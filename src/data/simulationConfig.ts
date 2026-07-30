// Maps every workflow step ID to a simulation screen configuration.
// screenType: which mock Entrata screen to render
// targetId: the data-sim-id of the element the user must click
// hint: brief tooltip on the highlighted element

export type ScreenType =
  | "main-nav"
  | "prospects-list"
  | "applicants-list"
  | "residents-list"
  | "resident-profile"
  | "resident-profile-financial"
  | "resident-profile-actions"
  | "resident-profile-renewals"
  | "add-prospect-form"
  | "application-review"
  | "work-orders-list"
  | "work-order-form"
  | "post-charge-dialog"
  | "accept-payment-dialog"
  | "move-in-dialog"
  | "move-out-dialog"
  | "ntv-dialog"
  | "reports-list"
  | "report-config"
  | "renewal-form"
  | "inspections-list"
  | "inspection-form"
  | "portal-invite"
  | "delinquency-report";

export interface SimStep {
  screenType: ScreenType;
  targetId: string;
  hint: string;
  activeTab?: string;
  openMenu?: string;
}

export const SIM_CONFIG: Record<string, SimStep> = {
  // ─── CREATE PROSPECT ──────────────────────────────────────────
  "cp-1": { screenType: "main-nav", targetId: "nav-prospects", hint: "Click Prospects" },
  "cp-2": { screenType: "prospects-list", targetId: "btn-add-prospect", hint: "Click + Add Prospect" },
  "cp-3": { screenType: "add-prospect-form", targetId: "field-first-name", hint: "Enter contact info" },
  "cp-4": { screenType: "add-prospect-form", targetId: "field-unit-pref", hint: "Set unit preference & move-in date" },
  "cp-5": { screenType: "add-prospect-form", targetId: "field-source", hint: "Select lead source" },
  "cp-6": { screenType: "add-prospect-form", targetId: "btn-save-prospect", hint: "Save & send portal invite" },

  // ─── PROCESS APPLICATION ──────────────────────────────────────
  "pa-1": { screenType: "applicants-list", targetId: "filter-pending", hint: "Filter by Pending Review" },
  "pa-2": { screenType: "applicants-list", targetId: "row-applicant-1", hint: "Click applicant to open profile" },
  "pa-3": { screenType: "application-review", targetId: "tab-application", hint: "Review Application tab" },
  "pa-4": { screenType: "application-review", targetId: "btn-run-screening", hint: "Click Run Screening" },
  "pa-5": { screenType: "application-review", targetId: "tab-screening", hint: "Open Screening Results tab" },
  "pa-6": { screenType: "application-review", targetId: "btn-set-status", hint: "Set application status" },
  "pa-7": { screenType: "application-review", targetId: "btn-send-letter", hint: "Send notification letter" },

  // ─── MOVE-IN ─────────────────────────────────────────────────
  "mi-1": { screenType: "prospects-list", targetId: "row-sarah", hint: "Open Sarah Johnson's profile" },
  "mi-2": { screenType: "resident-profile", targetId: "btn-finalize-lease", hint: "Click Finalize Lease", activeTab: "overview" },
  "mi-3": { screenType: "resident-profile-financial", targetId: "tab-financial", hint: "Click Financial tab & verify balance" },
  "mi-4": { screenType: "resident-profile-actions", targetId: "action-move-in", hint: "Select Move In from Actions", openMenu: "actions" },
  "mi-5": { screenType: "move-in-dialog", targetId: "field-movein-date", hint: "Enter move-in date & fob number" },
  "mi-6": { screenType: "move-in-dialog", targetId: "btn-save-movein", hint: "Click Save to complete move-in" },

  // ─── NOTICE TO VACATE ─────────────────────────────────────────
  "ntv-1": { screenType: "residents-list", targetId: "search-resident", hint: "Search for the resident" },
  "ntv-2": { screenType: "resident-profile-actions", targetId: "action-ntv", hint: "Select Notice to Vacate", openMenu: "actions" },
  "ntv-3": { screenType: "ntv-dialog", targetId: "field-notice-date", hint: "Enter notice & move-out dates" },
  "ntv-4": { screenType: "ntv-dialog", targetId: "field-vacate-reason", hint: "Select vacate reason" },
  "ntv-5": { screenType: "ntv-dialog", targetId: "field-ntv-notes", hint: "Add internal notes" },
  "ntv-6": { screenType: "ntv-dialog", targetId: "btn-save-ntv", hint: "Save Notice to Vacate" },

  // ─── MOVE-OUT / SODA ─────────────────────────────────────────
  "mo-1": { screenType: "residents-list", targetId: "row-maria", hint: "Open Maria Rodriguez's profile" },
  "mo-2": { screenType: "resident-profile-actions", targetId: "action-move-out", hint: "Select Move Out Resident", openMenu: "actions" },
  "mo-3": { screenType: "move-out-dialog", targetId: "field-forwarding-addr", hint: "Enter forwarding address" },
  "mo-4": { screenType: "resident-profile-financial", targetId: "tab-financial", hint: "Open Financial Tab — review ledger" },
  "mo-5": { screenType: "resident-profile-financial", targetId: "btn-post-charge", hint: "Post move-out charges" },
  "mo-6": { screenType: "resident-profile-financial", targetId: "btn-close-ledger", hint: "Click Close Ledger" },
  "mo-7": { screenType: "resident-profile-financial", targetId: "btn-generate-soda", hint: "Generate SODA PDF" },

  // ─── LEASE RENEWAL ───────────────────────────────────────────
  "lr-1": { screenType: "reports-list", targetId: "report-lease-expiration", hint: "Open Lease Expiration Report" },
  "lr-2": { screenType: "resident-profile-renewals", targetId: "tab-renewals", hint: "Open Renewals tab", activeTab: "renewals" },
  "lr-3": { screenType: "renewal-form", targetId: "btn-create-renewal", hint: "Click Create Renewal Offer" },
  "lr-4": { screenType: "renewal-form", targetId: "field-renewal-type", hint: "Select renewal type (Fixed/MTM)" },
  "lr-5": { screenType: "renewal-form", targetId: "btn-send-renewal", hint: "Send Renewal Offer to resident" },
  "lr-6": { screenType: "renewal-form", targetId: "btn-countersign", hint: "Countersign the executed renewal" },

  // ─── CREATE WORK ORDER ───────────────────────────────────────
  "wo-1": { screenType: "main-nav", targetId: "nav-workorders", hint: "Navigate to Services → Work Orders" },
  "wo-2": { screenType: "work-orders-list", targetId: "btn-add-wo", hint: "Click + Add Work Order" },
  "wo-3": { screenType: "work-order-form", targetId: "field-wo-unit", hint: "Select property & unit number" },
  "wo-4": { screenType: "work-order-form", targetId: "field-wo-priority", hint: "Choose category & set priority" },
  "wo-5": { screenType: "work-order-form", targetId: "field-wo-description", hint: "Describe the issue in detail" },
  "wo-6": { screenType: "work-order-form", targetId: "field-wo-pte", hint: "Check Permission to Enter" },
  "wo-7": { screenType: "work-order-form", targetId: "field-wo-tech", hint: "Assign technician" },
  "wo-8": { screenType: "work-order-form", targetId: "btn-submit-wo", hint: "Submit Work Order" },

  // ─── EMERGENCY WORK ORDER ────────────────────────────────────
  "ewo-1": { screenType: "work-orders-list", targetId: "btn-add-wo", hint: "Open emergency work order form" },
  "ewo-2": { screenType: "work-order-form", targetId: "field-wo-priority-emergency", hint: "Set Priority to EMERGENCY" },
  "ewo-3": { screenType: "work-order-form", targetId: "btn-submit-wo", hint: "Submit & notify on-call tech" },
  "ewo-4": { screenType: "resident-profile", targetId: "btn-message", hint: "Send manager notification" },
  "ewo-5": { screenType: "work-order-form", targetId: "field-wo-notes", hint: "Document progress in WO notes" },

  // ─── UNIT INSPECTION ─────────────────────────────────────────
  "ui-1": { screenType: "main-nav", targetId: "nav-inspections", hint: "Navigate to Services → Inspections" },
  "ui-2": { screenType: "inspections-list", targetId: "btn-add-inspection", hint: "Click + Add Inspection" },
  "ui-3": { screenType: "inspection-form", targetId: "field-insp-unit", hint: "Select unit & assign inspector" },
  "ui-4": { screenType: "inspection-form", targetId: "field-insp-checklist", hint: "Complete room checklist" },
  "ui-5": { screenType: "inspection-form", targetId: "field-insp-photos", hint: "Add notes & attach photos" },
  "ui-6": { screenType: "inspection-form", targetId: "btn-submit-inspection", hint: "Submit & generate report" },

  // ─── POST MANUAL CHARGE ──────────────────────────────────────
  "pmf-1": { screenType: "residents-list", targetId: "row-jennifer", hint: "Open Jennifer Park's profile" },
  "pmf-2": { screenType: "resident-profile-financial", targetId: "tab-financial", hint: "Click the Ledger tab" },
  "pmf-3": { screenType: "resident-profile-financial", targetId: "btn-post-charge", hint: "Click Post Charge" },
  "pmf-4": { screenType: "post-charge-dialog", targetId: "field-income-code", hint: "Select income code" },
  "pmf-5": { screenType: "post-charge-dialog", targetId: "field-charge-amount", hint: "Enter amount & date" },
  "pmf-6": { screenType: "post-charge-dialog", targetId: "field-charge-desc", hint: "Add charge description" },
  "pmf-7": { screenType: "post-charge-dialog", targetId: "btn-post-charge-submit", hint: "Click Post Charge" },

  // ─── ACCEPT PAYMENT ──────────────────────────────────────────
  "ap-1": { screenType: "resident-profile-financial", targetId: "tab-financial", hint: "Open resident's Ledger tab" },
  "ap-2": { screenType: "resident-profile-financial", targetId: "btn-accept-payment", hint: "Click Accept Payment" },
  "ap-3": { screenType: "accept-payment-dialog", targetId: "field-payment-method", hint: "Select payment method" },
  "ap-4": { screenType: "accept-payment-dialog", targetId: "field-payment-amount", hint: "Enter amount & date" },
  "ap-5": { screenType: "accept-payment-dialog", targetId: "field-payment-apply", hint: "Review charge application" },
  "ap-6": { screenType: "accept-payment-dialog", targetId: "btn-post-payment", hint: "Post & print receipt" },

  // ─── DELINQUENCY ─────────────────────────────────────────────
  "del-1": { screenType: "reports-list", targetId: "report-delinquency", hint: "Open Delinquency Report" },
  "del-2": { screenType: "delinquency-report", targetId: "row-delinquent-1", hint: "Review delinquent accounts" },
  "del-3": { screenType: "resident-profile-financial", targetId: "btn-post-charge", hint: "Post late fee" },
  "del-4": { screenType: "resident-profile-actions", targetId: "action-notice", hint: "Generate Pay or Quit notice", openMenu: "notices" },
  "del-5": { screenType: "resident-profile", targetId: "btn-add-note", hint: "Document communication attempts" },
  "del-6": { screenType: "delinquency-report", targetId: "btn-escalate", hint: "Escalate to manager" },

  // ─── DAILY OPS REPORT ────────────────────────────────────────
  "dor-1": { screenType: "main-nav", targetId: "nav-reports", hint: "Click Reports in top navigation" },
  "dor-2": { screenType: "reports-list", targetId: "cat-property-mgmt", hint: "Select Property Management category" },
  "dor-3": { screenType: "reports-list", targetId: "report-daily-ops", hint: "Click Daily Operations Report" },
  "dor-4": { screenType: "report-config", targetId: "filter-property", hint: "Select your property" },
  "dor-5": { screenType: "report-config", targetId: "filter-date-today", hint: "Set date filter to Today" },
  "dor-6": { screenType: "report-config", targetId: "btn-generate-report", hint: "Click Generate Report" },

  // ─── OCCUPANCY REPORT ────────────────────────────────────────
  "or-1":  { screenType: "reports-list", targetId: "report-occupancy", hint: "Open Occupancy Report" },
  "or-2":  { screenType: "report-config", targetId: "filter-occ-type", hint: "Set occupancy type filter" },
  "or-3":  { screenType: "report-config", targetId: "btn-generate-report", hint: "Generate Report" },
  "or-4":  { screenType: "report-config", targetId: "btn-export", hint: "Export to PDF/Excel" },

  // ─── RESIDENT PORTAL ─────────────────────────────────────────
  "rp-1": { screenType: "residents-list", targetId: "row-marcus", hint: "Open resident profile" },
  "rp-2": { screenType: "resident-profile", targetId: "portal-status", hint: "Check Portal Status indicator" },
  "rp-3": { screenType: "portal-invite", targetId: "btn-send-invite", hint: "Click Send Portal Invite" },
  "rp-4": { screenType: "portal-invite", targetId: "btn-confirm-invite", hint: "Confirm invite was delivered" },
};
