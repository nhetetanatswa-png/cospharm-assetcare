"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TransactionType = "receive" | "return" | "";
type Answer = "Yes" | "No" | "Unknown" | "";
type Condition = "New" | "Used" | "Good" | "Fair" | "Damaged" | "";
type Employee = { name: string; department: string; position: string; transactionDate: string };
type Asset = {
  id: string;
  type: string;
  makeModel: string;
  serialNumber: string;
  assetTag: string;
  condition: Condition;
  dateIssued: string;
  processor: string;
  windowsVersion: string;
  windowsGenuine: Answer;
  microsoft365: Answer;
  antivirus: Answer;
  insured: Answer;
  notes: string;
};
type Accessory = { name: string; selected: boolean; quantity: number; comments: string };

const accessoryNames = ["Laptop charger", "Laptop bag", "Mouse", "Keyboard", "Headset", "USB hub / dock", "HDMI / VGA cable", "External drive", "SIM card / modem", "Other"];
const steps = [
  { label: "Transaction type", short: "Action" },
  { label: "Employee information", short: "Employee" },
  { label: "Company Assets", short: "Assets" },
  { label: "Accessories", short: "Accessories" },
  { label: "Agreement & acknowledgement", short: "Sign-off" },
];
const agreementClauses = [
  "The User shall indemnify and hold harmless the Owner from and against all losses, claims, suits, legal liabilities and legal expenses of any nature imposed upon or brought against the Owner by reason of any act or omission by the User, the User’s agents or employees, arising during the use of the Company Asset.",
  "The Employee will take care of every Company Asset as if it were their own.",
  "Every Company Asset will be operated in compliance with all applicable Botswana telecommunications laws and regulations.",
  "The Employee shall use Company Assets primarily for Company business. Reasonable private use may be permitted where it has been communicated to and approved by the General Manager. Upon termination of employment, the Employee shall immediately return all Company Assets to the Company.",
  "At the time of disposal of a Company Asset, the Employee will be given the first option to purchase it.",
  "This Agreement does not form part of the consideration offered under any other agreement. No merger clause in any other agreement shall extinguish this separate and distinct Agreement.",
];

function makeAsset(dateIssued = ""): Asset {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type: "",
    makeModel: "",
    serialNumber: "",
    assetTag: "",
    condition: "",
    dateIssued,
    processor: "",
    windowsVersion: "",
    windowsGenuine: "",
    microsoft365: "",
    antivirus: "",
    insured: "",
    notes: "",
  };
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-BW", { day: "2-digit", month: "long", year: "numeric" });
}

function isComputer(type: string) {
  return type === "Laptop" || type === "Desktop computer";
}

type IconName = "clipboard" | "shield" | "chevron" | "check" | "clock" | "device" | "arrow" | "plus" | "trash" | "inbox" | "outbox";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    clipboard: <><path d="M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/><rect x="9" y="2" width="6" height="5" rx="2"/><path d="M8 12h8M8 16h6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    device: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
    inbox: <><path d="M4 4h16v13H4zM4 13h5l2 3h2l2-3h5"/></>,
    outbox: <><path d="M4 7v13h16V7M12 16V3M7 8l5-5 5 5"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand() {
  return (
    <div className="brand" aria-label="Cospharm — Believe in Good">
      <img className="brand-logo" src="/assets/cospharm-logo.png" alt="Cospharm — Believe in Good" />
      <strong className="brand-product">Cospharm AssetCare</strong>
    </div>
  );
}

function AnswerField({ label, value, onChange }: { label: string; value: Answer; onChange: (value: Answer) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as Answer)}>
        <option value="">Select</option><option>Yes</option><option>No</option><option>Unknown</option>
      </select>
    </label>
  );
}

function SignaturePad({ value, onChange }: { value: string; onChange: (signature: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    function prepareCanvas() {
      const width = parent?.clientWidth ?? 620;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = width * ratio;
      canvas.height = 170 * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = "170px";
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.lineWidth = 2.25;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#17202d";
      if (value) {
        const signatureImage = new Image();
        signatureImage.onload = () => context.drawImage(signatureImage, 0, 0, width, 170);
        signatureImage.src = value;
      }
    }

    prepareCanvas();
    const resizeObserver = new ResizeObserver(prepareCanvas);
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, [value]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function finish(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(event.currentTarget.toDataURL("image/png"));
  }

  return (
    <div className="signature-wrap">
      <canvas ref={canvasRef} className="signature-canvas" aria-label="Employee signature pad" onPointerDown={start} onPointerMove={draw} onPointerUp={finish} onPointerCancel={finish} />
      <div className="signature-line"><span>Sign above using a mouse, finger or stylus</span><button type="button" onClick={() => onChange("")}>Clear signature</button></div>
    </div>
  );
}

export default function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const [startedAt] = useState(() => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
  const [step, setStep] = useState(0);
  const [finalized, setFinalized] = useState(false);
  const [completedAt, setCompletedAt] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("");
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [employee, setEmployee] = useState<Employee>({ name: "", department: "", position: "", transactionDate: today });
  const [assets, setAssets] = useState<Asset[]>([makeAsset("")]);
  const [accessories, setAccessories] = useState<Accessory[]>(accessoryNames.map((name) => ({ name, selected: false, quantity: 1, comments: "" })));

  const actionWord = transactionType === "return" ? "Return" : "Receipt";
  const actionVerb = transactionType === "return" ? "returning" : "receiving";
  const itemVerb = transactionType === "return" ? "returned" : "issued";
  const employeeComplete = Boolean(employee.name && employee.department && employee.position && employee.transactionDate);
  const assetsComplete = assets.length > 0 && assets.every((asset) => asset.type && asset.makeModel && asset.serialNumber && asset.assetTag && asset.condition && asset.dateIssued);
  const reference = useMemo(() => {
    const date = employee.transactionDate.replaceAll("-", "") || "DATE";
    const tag = assets[0]?.assetTag.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNTAGGED";
    return `AC-${transactionType === "return" ? "RET" : "REC"}-${date}-${tag}`;
  }, [assets, employee.transactionDate, transactionType]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(transactionType && employee.transactionDate);
    if (step === 1) return employeeComplete;
    if (step === 2) return assetsComplete;
    if (step === 4) return agreed && Boolean(signature);
    return true;
  }, [agreed, assetsComplete, employee.transactionDate, employeeComplete, signature, step, transactionType]);

  const stepStatusMessage = canContinue
    ? step === 4 ? "Agreement accepted and signature added." : "This section is complete. You can continue."
    : step === 0 ? "Select receiving or returning to continue."
    : step === 1 ? "Enter the employee name, department and position."
    : step === 2 ? "Complete every required field for each Company Asset."
    : !agreed ? "Accept the acknowledgement before creating the document."
    : "Add the employee signature to create the document.";

  function chooseTransaction(value: Exclude<TransactionType, "">) {
    setTransactionType(value);
    setAssets((current) => current.map((asset) => ({ ...asset, condition: "", dateIssued: value === "receive" && !asset.dateIssued ? employee.transactionDate : asset.dateIssued })));
  }

  function updateTransactionDate(value: string) {
    const previousDate = employee.transactionDate;
    setEmployee((current) => ({ ...current, transactionDate: value }));
    if (transactionType === "receive") {
      setAssets((current) => current.map((asset) => !asset.dateIssued || asset.dateIssued === previousDate ? { ...asset, dateIssued: value } : asset));
    }
  }

  function updateAsset(id: string, patch: Partial<Asset>) {
    setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, ...patch } : asset));
  }

  function addAsset() {
    setAssets((current) => [...current, makeAsset(transactionType === "receive" ? employee.transactionDate : "")]);
  }

  function removeAsset(id: string) {
    setAssets((current) => current.length === 1 ? current : current.filter((asset) => asset.id !== id));
  }

  function updateAccessory(index: number, patch: Partial<Accessory>) {
    setAccessories((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function createAcknowledgement() {
    if (!canContinue) return;
    setCompletedAt(new Date().toISOString());
    setFinalized(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function shareSummary() {
    const assetLines = assets.map((asset, index) => `${index + 1}. ${asset.type} — ${asset.makeModel} (${asset.assetTag})`).join("\n");
    const summary = `Cospharm AssetCare ${actionWord.toLowerCase()} acknowledgement ${reference}\nEmployee: ${employee.name}\nAssets (${assets.length}):\n${assetLines}\nTransaction date: ${formatDate(employee.transactionDate)}`;
    const canNativeShare = typeof navigator.share === "function";
    try {
      if (canNativeShare) await navigator.share({ title: `AssetCare ${reference}`, text: summary });
      else await navigator.clipboard.writeText(summary);
      setShareStatus(canNativeShare ? "Summary shared." : "Summary copied.");
    } catch {
      setShareStatus("Sharing was cancelled.");
    }
  }

  if (finalized) {
    return (
      <main className="report-shell">
        <div className="report-actions">
          <button type="button" className="button secondary" onClick={() => setFinalized(false)}>← Edit form</button>
          <div className="report-action-group">
            <button type="button" className="button secondary" onClick={shareSummary}>Share summary</button>
            <button type="button" className="button primary" onClick={() => window.print()}>Print / Save PDF</button>
          </div>
          {shareStatus && <p className="share-status" role="status">{shareStatus}</p>}
        </div>

        <article className="report-page">
          <img className="report-watermark" src="/assets/cospharm-logo.png" alt="" />
          <header className="report-header">
            <div className="report-brand">
              <img className="report-logo" src="/assets/cospharm-logo.png" alt="Cospharm logo" />
              <div><div className="report-brand-name">Cospharm <strong>AssetCare</strong></div><div className="report-tagline">Believe in Good</div></div>
            </div>
            <div className="company-contact">
              <strong>Cospharm (Pty) Ltd</strong>
              <span>Unit 3 & 4, Plot 1645, KS Business Commerce Park, Gaborone</span>
              <span>+267 311 3449 · hcbw@cospharm.org</span>
            </div>
          </header>

          <section className="report-title">
            <div><p>Company Assets & Accessories</p><h1>{actionWord} Acknowledgement</h1></div>
            <div className="reference-box"><span>Reference</span><strong>{reference}</strong><small>Created {completedAt ? new Date(completedAt).toLocaleString("en-BW", { dateStyle: "medium", timeStyle: "short" }) : ""}</small></div>
          </section>

          <section className="report-section">
            <h2><span>01</span> Transaction & employee</h2>
            <div className="data-grid">
              <div><span>Transaction</span><strong>{transactionType === "return" ? "Returning Company Assets" : "Receiving Company Assets"}</strong></div>
              <div><span>Transaction date</span><strong>{formatDate(employee.transactionDate)}</strong></div>
              <div><span>Employee name</span><strong>{employee.name}</strong></div>
              <div><span>Department</span><strong>{employee.department}</strong></div>
              <div><span>Position</span><strong>{employee.position}</strong></div>
              <div><span>Total assets</span><strong>{assets.length}</strong></div>
            </div>
          </section>

          <section className="report-section asset-report-section">
            <h2><span>02</span> Company Assets {itemVerb}</h2>
            {assets.map((asset, index) => (
              <div className="report-asset-card" key={asset.id}>
                <div className="report-asset-heading"><strong>Asset {index + 1}: {asset.type}</strong><span>{asset.assetTag}</span></div>
                <div className="report-asset-grid">
                  <div><span>Make / model</span><strong>{asset.makeModel}</strong></div>
                  <div><span>Serial number</span><strong>{asset.serialNumber}</strong></div>
                  <div><span>{transactionType === "return" ? "Original date issued" : "Date issued"}</span><strong>{formatDate(asset.dateIssued)}</strong></div>
                  <div><span>Condition {transactionType === "return" ? "on return" : "when issued"}</span><strong>{asset.condition}</strong></div>
                  <div><span>Covered by insurance</span><strong>{asset.insured || "—"}</strong></div>
                  <div><span>Notes</span><strong>{asset.notes || "—"}</strong></div>
                </div>
                {isComputer(asset.type) && (
                  <div className="technical-report-grid">
                    <div><span>Processor</span><strong>{asset.processor || "—"}</strong></div>
                    <div><span>Windows edition</span><strong>{asset.windowsVersion || "—"}</strong></div>
                    <div><span>Genuine Windows</span><strong>{asset.windowsGenuine || "—"}</strong></div>
                    <div><span>Microsoft 365</span><strong>{asset.microsoft365 || "—"}</strong></div>
                    <div><span>Anti-virus installed</span><strong>{asset.antivirus || "—"}</strong></div>
                  </div>
                )}
              </div>
            ))}
          </section>

          <section className="report-section">
            <h2><span>03</span> Accessories {itemVerb}</h2>
            <table className="report-table accessory-table full-accessory-table">
              <thead><tr><th>Accessory</th><th>Quantity</th><th>Status</th><th>Comments</th></tr></thead>
              <tbody>{accessories.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.selected ? item.quantity : "—"}</td><td><span className={`status-badge ${item.selected ? "included" : "excluded"}`}>{item.selected ? (transactionType === "return" ? "Returned" : "Issued") : (transactionType === "return" ? "Not returned" : "Not issued")}</span></td><td>{item.comments || "—"}</td></tr>)}</tbody>
            </table>
          </section>

          <section className="report-section agreement-report">
            <h2><span>04</span> Company Asset agreement</h2>
            <p className="agreement-intro">In consideration of the exchange of promises contained herein and other valuable consideration, the Owner and User agree as follows:</p>
            <ol>{agreementClauses.map((clause) => <li key={clause}>{clause}</li>)}</ol>
          </section>

          <section className="signature-report">
            <div className="employee-signoff">
              <p className="signoff-label">Employee acknowledgement</p>
              <p>I confirm that I have {transactionType === "return" ? "returned" : "received"} the listed Company Assets and accessories, that the information above is correct, and that I acknowledge the conditions stated in this document.</p>
              <div className="signature-image-wrap"><img src={signature} alt="Employee signature" /></div>
              <div className="signoff-meta"><div><span>Employee</span><strong>{employee.name}</strong></div><div><span>Date</span><strong>{formatDate(employee.transactionDate)}</strong></div></div>
            </div>
            <div className="officer-signoff">
              <p className="signoff-label">IT/HR officer confirmation</p>
              <p>I confirm that the listed items have been {transactionType === "return" ? "received back from" : "issued to"} the above employee.</p>
              <div className="blank-field"><span>Name</span><i /></div>
              <div className="blank-field"><span>Position</span><i /></div>
              <div className="blank-field"><span>Signature</span><i /></div>
              <div className="blank-field"><span>Date</span><i /></div>
            </div>
          </section>

          <footer className="report-footer"><span>www.cospharm.org</span><span>{reference}</span><span>AssetCare proof of concept</span></footer>
        </article>
      </main>
    );
  }

  return (
    <div className="app-shell fleet-theme">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Primary navigation">
          <button className="active" type="button" onClick={() => setStep(0)}><Icon name="clipboard" /><span>Asset transaction</span></button>
        </nav>
        <div className="sidebar-card">
          <span className="sidebar-card-icon"><Icon name="shield" /></span>
          <strong>Private device session</strong>
          <p>No employee details, signatures or asset information are uploaded or stored in a database.</p>
        </div>
        <div className="sidebar-user"><span>AC</span><div><strong>Cospharm AssetCare</strong><small>Asset handover form</small></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div className="breadcrumb"><span>Cospharm AssetCare</span><Icon name="chevron" size={15} /><strong>Company Asset transaction</strong></div>
          <div className="topbar-actions"><span className="sync-status local-status"><i /> Device-only session</span><span className="mobile-avatar">AC</span></div>
        </header>

        <div className="assessment-page">
          <div className="assessment-header">
            <div>
              <div className="eyebrow-line"><span className="eyebrow">Asset lifecycle</span><span className="draft-chip">Not saved online</span></div>
              <h1>Company Asset {transactionType ? actionWord.toLowerCase() : "transaction"}</h1>
              <p>{assets[0]?.assetTag ? `${assets.length} asset${assets.length === 1 ? "" : "s"} · ${assets[0].assetTag}${assets.length > 1 ? ` + ${assets.length - 1} more` : ""}` : "Choose an action, record every item, then compile a printable acknowledgement."}</p>
            </div>
            <div className="header-meta">
              <span><Icon name="clock" size={17} /><small>Started</small><strong>{startedAt}</strong></span>
              <span><Icon name="shield" size={17} /><small>Storage</small><strong>This device only</strong></span>
            </div>
          </div>

          <div className="progress-shell">
            <div className="progress-copy"><span>Step {step + 1} of {steps.length}</span><strong>{steps[step].label}</strong><em>{Math.round(((step + 1) / steps.length) * 100)}% complete</em></div>
            <div className="progress-track" role="progressbar" aria-label="Form completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((step + 1) / steps.length) * 100)}><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
            <nav className="step-dots five-steps" aria-label="Form progress">
              {steps.map((item, index) => (
                <button key={item.label} type="button" className={`${index === step ? "current" : ""} ${index < step ? "complete" : ""}`} onClick={() => setStep(index)} disabled={index > step} aria-label={`Step ${index + 1}: ${item.label}`} title={item.label} aria-current={index === step ? "step" : undefined}>
                  <span>{index < step ? <Icon name="check" size={14} /> : index + 1}</span><small>{item.short}</small>
                </button>
              ))}
            </nav>
          </div>

          <div className="assessment-layout">
            <section className="form-card">
              {step === 0 && (
                <div className="panel transaction-panel">
                  <div className="panel-heading"><div><p className="section-number">Start here</p><h2>What is happening today?</h2></div><p>Select the action first so AssetCare can tailor the fields and final acknowledgement.</p></div>
                  <div className="transaction-options">
                    <button type="button" className={`transaction-card ${transactionType === "receive" ? "selected" : ""}`} aria-pressed={transactionType === "receive"} onClick={() => chooseTransaction("receive")}>
                      <span className="transaction-icon"><Icon name="inbox" size={30} /></span><span><strong>Receiving assets</strong><small>Company equipment is being issued to an employee.</small></span><Icon name="chevron" />
                    </button>
                    <button type="button" className={`transaction-card ${transactionType === "return" ? "selected" : ""}`} aria-pressed={transactionType === "return"} onClick={() => chooseTransaction("return")}>
                      <span className="transaction-icon"><Icon name="outbox" size={30} /></span><span><strong>Returning assets</strong><small>An employee is handing Company equipment back.</small></span><Icon name="chevron" />
                    </button>
                  </div>
                  <label className="field transaction-date"><span>Transaction date *</span><input required type="date" value={employee.transactionDate} onChange={(event) => updateTransactionDate(event.target.value)} /></label>
                </div>
              )}

              {step === 1 && (
                <div className="panel">
                  <div className="panel-heading"><div><p className="section-number">Employee</p><h2>Who is {actionVerb} the assets?</h2></div><p>Use the employee’s official work details for a traceable acknowledgement.</p></div>
                  <div className="field-grid two-col">
                    <label className="field span-2"><span>Employee name *</span><input required autoFocus value={employee.name} onChange={(event) => setEmployee((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" /></label>
                    <label className="field"><span>Department *</span><input required value={employee.department} onChange={(event) => setEmployee((current) => ({ ...current, department: event.target.value }))} placeholder="e.g. Distribution" /></label>
                    <label className="field"><span>Position *</span><input required value={employee.position} onChange={(event) => setEmployee((current) => ({ ...current, position: event.target.value }))} placeholder="Job title" /></label>
                    <label className="field"><span>{actionWord} date *</span><input required type="date" value={employee.transactionDate} onChange={(event) => updateTransactionDate(event.target.value)} /></label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="panel assets-panel">
                  <div className="panel-heading asset-panel-heading"><div><p className="section-number">Assets</p><h2>Company Assets {itemVerb}</h2></div><button type="button" className="button add-button" onClick={addAsset}><Icon name="plus" size={16} /> Add another asset</button></div>
                  <p className="section-helper">Create one record for every laptop, tablet, phone or other Company Asset in this transaction.</p>
                  <div className="asset-editor-list">
                    {assets.map((asset, index) => (
                      <article className="asset-editor" key={asset.id}>
                        <header><div><span>Asset {index + 1}</span><strong>{asset.assetTag || asset.type || "New asset"}</strong></div>{assets.length > 1 && <button type="button" onClick={() => removeAsset(asset.id)} aria-label={`Remove asset ${index + 1}`}><Icon name="trash" size={16} /> Remove</button>}</header>
                        <div className="field-grid two-col asset-fields">
                          <label className="field"><span>Device type *</span><select required value={asset.type} onChange={(event) => updateAsset(asset.id, { type: event.target.value })}><option value="">Select type</option><option>Laptop</option><option>Desktop computer</option><option>Mobile phone</option><option>Tablet</option><option>Router / modem</option><option>Printer</option><option>Other device</option></select></label>
                          <label className="field"><span>Make / model *</span><input required value={asset.makeModel} onChange={(event) => updateAsset(asset.id, { makeModel: event.target.value })} placeholder="e.g. Dell Latitude 5440" /></label>
                          <label className="field"><span>Serial number *</span><input required value={asset.serialNumber} onChange={(event) => updateAsset(asset.id, { serialNumber: event.target.value })} placeholder="Manufacturer serial number" /></label>
                          <label className="field"><span>Asset tag *</span><input required value={asset.assetTag} onChange={(event) => updateAsset(asset.id, { assetTag: event.target.value })} placeholder="Cospharm asset tag" /></label>
                          <label className="field"><span>{transactionType === "return" ? "Original date issued" : "Date issued"} *</span><input required type="date" value={asset.dateIssued} onChange={(event) => updateAsset(asset.id, { dateIssued: event.target.value })} /></label>
                          <label className="field"><span>Condition {transactionType === "return" ? "on return" : "when issued"} *</span><select required value={asset.condition} onChange={(event) => updateAsset(asset.id, { condition: event.target.value as Condition })}><option value="">Select condition</option>{transactionType === "return" ? <><option>Good</option><option>Fair</option><option>Damaged</option></> : <><option>New</option><option>Used</option></>}</select></label>
                          <AnswerField label="Covered by insurance?" value={asset.insured} onChange={(value) => updateAsset(asset.id, { insured: value })} />
                          <label className="field"><span>Notes</span><input value={asset.notes} onChange={(event) => updateAsset(asset.id, { notes: event.target.value })} placeholder="Condition, identifying marks or return notes" /></label>
                        </div>
                        {isComputer(asset.type) && (
                          <section className="technical-fields">
                            <div className="technical-heading"><span><Icon name="device" size={17} /></span><div><strong>Computer configuration</strong><small>Shown because this item is a {asset.type.toLowerCase()}.</small></div></div>
                            <div className="field-grid technical-grid">
                              <label className="field"><span>Processor</span><input value={asset.processor} onChange={(event) => updateAsset(asset.id, { processor: event.target.value })} placeholder="e.g. Intel Core i5-1235U" /></label>
                              <label className="field"><span>Windows edition</span><input value={asset.windowsVersion} onChange={(event) => updateAsset(asset.id, { windowsVersion: event.target.value })} placeholder="e.g. Windows 11 Pro" /></label>
                              <AnswerField label="Genuine Windows install?" value={asset.windowsGenuine} onChange={(value) => updateAsset(asset.id, { windowsGenuine: value })} />
                              <AnswerField label="Microsoft 365 installed?" value={asset.microsoft365} onChange={(value) => updateAsset(asset.id, { microsoft365: value })} />
                              <AnswerField label="Anti-virus installed?" value={asset.antivirus} onChange={(value) => updateAsset(asset.id, { antivirus: value })} />
                            </div>
                          </section>
                        )}
                      </article>
                    ))}
                  </div>
                  <button type="button" className="add-asset-box" onClick={addAsset}><Icon name="plus" size={20} /><span><strong>Add another Company Asset</strong><small>Use a separate record for each additional device.</small></span></button>
                </div>
              )}

              {step === 3 && (
                <div className="panel">
                  <div className="panel-heading"><div><p className="section-number">Accessories</p><h2>Accessories {itemVerb}</h2></div><p>Review every row. The final acknowledgement will show both marked and unmarked accessories.</p></div>
                  <div className="accessory-list">
                    {accessories.map((accessory, index) => (
                      <div className={`accessory-row ${accessory.selected ? "selected" : ""}`} key={accessory.name}>
                        <label className="toggle-label"><input type="checkbox" checked={accessory.selected} onChange={(event) => updateAccessory(index, { selected: event.target.checked })} /><span className="toggle" /><strong>{accessory.name}</strong></label>
                        <label className="compact-field"><span>Quantity</span><input type="number" min="1" disabled={!accessory.selected} value={accessory.quantity} onChange={(event) => updateAccessory(index, { quantity: Number(event.target.value) || 1 })} /></label>
                        <label className="comment-field"><span>Comments</span><input value={accessory.comments} onChange={(event) => updateAccessory(index, { comments: event.target.value })} placeholder={accessory.name === "Other" ? "Describe the accessory" : "Optional condition or identifier"} /></label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="panel agreement-panel">
                  <div className="panel-heading"><div><p className="section-number">Sign-off</p><h2>Agreement & employee signature</h2></div><p>Read the conditions and acknowledge the {actionWord.toLowerCase()} of all listed items.</p></div>
                  <div className="agreement-box">
                    <div className="agreement-heading"><strong>Company Asset agreement</strong><span>Digital transcription · proof of concept</span></div>
                    <p>In consideration of the exchange of promises contained herein and other valuable consideration, the Owner and User agree as follows:</p>
                    <ol>{agreementClauses.map((clause) => <li key={clause}>{clause}</li>)}</ol>
                  </div>
                  <label className="acknowledgement-check"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>✓</span><strong>I, {employee.name || "the employee"}, confirm that I have {transactionType === "return" ? "returned" : "received"} the listed Company Assets and accessories, that the information is correct, and that I acknowledge the conditions above.</strong></label>
                  <div className="signature-section"><div><span className="field-label">Employee digital signature *</span><small>Required to create the final acknowledgement.</small></div><SignaturePad value={signature} onChange={setSignature} /></div>
                </div>
              )}

              <footer className="form-actions">
                <button type="button" className="button secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Back</button>
                <div id="form-status" className={`form-status ${canContinue ? "ready" : "attention"}`} aria-live="polite"><span>{canContinue ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}</span><small>{stepStatusMessage}</small></div>
                {step < steps.length - 1 ? <button type="button" className="button primary" aria-describedby="form-status" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} disabled={!canContinue}>Continue <Icon name="arrow" size={17} /></button> : <button type="button" className="button primary create-button" aria-describedby="form-status" onClick={createAcknowledgement} disabled={!canContinue}>Create acknowledgement <Icon name="arrow" size={17} /></button>}
              </footer>
            </section>

            <aside className="assessment-aside">
              <div className="asset-summary">
                <span className="eyebrow">Transaction summary</span>
                <div className="asset-badge">{transactionType === "return" ? <Icon name="outbox" size={31} /> : <Icon name="inbox" size={31} />}</div>
                <h3>{transactionType ? `${actionWord} · ${assets.length} asset${assets.length === 1 ? "" : "s"}` : "Action pending"}</h3>
                <p>{assets[0]?.assetTag ? `${assets[0].assetTag}${assets.length > 1 ? ` + ${assets.length - 1} more` : ""}` : "Asset details pending"}</p>
                <dl>
                  <div><dt>Employee</dt><dd>{employee.name || "Pending"}</dd></div>
                  <div><dt>Date</dt><dd>{formatDate(employee.transactionDate)}</dd></div>
                  <div><dt>Accessories</dt><dd>{accessories.filter((item) => item.selected).length} marked</dd></div>
                </dl>
              </div>

              <div className="aside-checklist">
                <div className="aside-title"><span><Icon name="clipboard" size={17} /></span><strong>Form checklist</strong></div>
                <ul>
                  <li className={Boolean(transactionType) ? "done" : ""}><span>{transactionType ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}</span>Action selected</li>
                  <li className={employeeComplete ? "done" : ""}><span>{employeeComplete ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}</span>Employee identified</li>
                  <li className={assetsComplete ? "done" : ""}><span>{assetsComplete ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}</span>{assets.length} asset record{assets.length === 1 ? "" : "s"}</li>
                  <li className={step > 3 ? "done" : ""}><span>{step > 3 ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}</span>Accessories reviewed</li>
                  <li className={Boolean(signature) ? "done" : ""}><span>{signature ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}</span>Employee signed</li>
                </ul>
              </div>
            </aside>
          </div>

          <footer className="site-footer"><span>Cospharm AssetCare</span><span>Proof of concept · No database connected</span></footer>
        </div>
      </main>
    </div>
  );
}
