"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Step1StudiesSection from "../step1/Step1LiteratureStudy";
import Step3RawMaterialCoaSection from "../step1/Step1RawMaterialCoa";
import Step3FinishedCoaSection from "../step1/Step1FormulationMaterials";
import Step1BOM from "../step1/Step1BOM";

import { getStep2FormulaBomListAction } from "@/app/actions/bom-action";
import Step4PreFormulationComponent from "../step1/Step1PreFurmola";
import Step4Packaging from "../step1/Step1PreFurmolaPackaging";
import Step2AnalyticalDevlopRaw from "../step2/Step2AnalyticalDevlopRaw";
import Step5AnalyticalDevlopFinished from "../step2/Step2AnalyticalDevlopFinished";
import Step6AnalyticalValidRaw from "../step3/Step3AnalyticalValidRaw";
import Step6AnalyticalValidFinished from "../step3/Step3AnalyticalvalidFinished";
import Step7FormulationDevelopment from "../step4/Step4FurmolaDevelop";

// تب‌هایی که طبق رفتار فعلی همیشه به‌عنوان دارای داده نشان داده می‌شوند.
const STATIC_TABS_WITH_DATA = new Set([
  "studies",
  "analysis",
  "overview",
  "methods",
  "specs",
  "process",
  "documents",
  "protocols",
  "ctd",
]);

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Pre-formulation Studies",
    description:
      "API characterization, excipient compatibility, and initial risk assessment.",
    tabs: [
      { id: "studies", label: "Studies" },
      { id: "bom", label: "Material Information List" },
      { id: "analysis", label: "Analysis" },
      { id: "preFurmola", label: "Pre Furmolation" },
      { id: "packaging", label: "Packaging" },
    ],
  },
  {
    id: 2,
    title: "Analytical Method Development",
    description:
      "Analytical methods, specifications, and test procedures.",
    tabs: [
      { id: "rawMaterialDevelopment", label: "Raw Material" },
      { id: "finishedProductDevelopment", label: "Finished Product" },
    ],
  },
  {
    id: 3,
    title: "Analytical Method Validation",
    description:
      "Process validation, cleaning validation, and performance qualification.",
    tabs: [
      { id: "rawMaterialValidation", label: "Raw Material" },
      { id: "finishedProductValidation", label: "Finished Product" },
    ],
  },
  {
    id: 4,
    title: "Formulation Development",
    description:
      "Prototype design, composition optimization, and screening trials.",
    tabs: [
      { id: "furmolationDevelop", label: "Formulation Development" },
    ],
  },
  {
    id: 5,
    title: "Stability Studies",
    description: "Accelerated and long-term stability evaluation.",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "protocol", label: "Protocol" },
      { id: "results", label: "Results" },
    ],
  },
  {
    id: 6,
    title: "Scale-up",
    description:
      "Pilot scale manufacturing and process optimization.",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "process", label: "Process" },
      { id: "issues", label: "Issues" },
    ],
  },
  {
    id: 7,
    title: "Tech Transfer",
    description:
      "Transfer package, production handover, and manufacturing readiness.",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "documents", label: "Documents" },
      { id: "checklist", label: "Checklist" },
    ],
  },
  {
    id: 8,
    title: "Regulatory / CTD",
    description:
      "Regulatory documents, dossier compilation, and CTD preparation.",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "ctd", label: "CTD Sections" },
      { id: "submissions", label: "Submissions" },
    ],
  },
];

/**
 * خروجی اکشن BOM را به آرایه رکوردها تبدیل می‌کند.
 * ساختارهای رایج قابل پشتیبانی:
 *   [...]
 *   { data: [...] }
 *   { data: { ... } }
 *   { success: true, data: [...] }
 */
function extractBomRecords(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (!result || typeof result !== "object") {
    return [];
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.data?.items)) {
    return result.data.items;
  }

  if (Array.isArray(result.data?.records)) {
    return result.data.records;
  }

  // اگر API یک رکورد تکی را در data برگرداند.
  if (result.data && typeof result.data === "object") {
    return [result.data];
  }

  // بعضی اکشن‌ها فهرست را با کلید items یا records برمی‌گردانند.
  if (Array.isArray(result.items)) {
    return result.items;
  }

  if (Array.isArray(result.records)) {
    return result.records;
  }

  return [];
}

/**
 * BOM فقط وقتی داده‌دار است که حداقل یک رکورد،
 * فایل BOM با آدرس غیرخالی داشته باشد.
 */
function hasBomFile(result) {
  const records = extractBomRecords(result);

  return records.some(
    (record) =>
      typeof record?.bomFileUrl === "string" &&
      record.bomFileUrl.trim().length > 0,
  );
}

function TabContent({
  step,
  activeTabId,
  project,
  onBomChanged,
}) {
  const safeProject = project ?? {};
  const [analysisSubTab, setAnalysisSubTab] = useState("tab1");

  if (activeTabId === "studies") {
    return <Step1StudiesSection projectId={safeProject.id} />;
  }

  if (activeTabId === "bom") {
    return (
      <Step1BOM
        projectId={safeProject.id}
        onBomChanged={onBomChanged}
      />
    );
  }

  if (activeTabId === "analysis") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
          <button
            type="button"
            onClick={() => setAnalysisSubTab("tab1")}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              analysisSubTab === "tab1"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            ].join(" ")}
          >
            Raw Material COA
          </button>

          <button
            type="button"
            onClick={() => setAnalysisSubTab("tab2")}
            className={[
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              analysisSubTab === "tab2"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            ].join(" ")}
          >
            Reference/Working STD COA
          </button>
        </div>

        {analysisSubTab === "tab1" ? (
          <Step3RawMaterialCoaSection projectId={safeProject.id} />
        ) : (
          <Step3FinishedCoaSection projectId={safeProject.id} />
        )}
      </div>
    );
  }
    if (activeTabId === "preFurmola") {
    return <Step4PreFormulationComponent projectId={safeProject.id} />;
  }
    if (activeTabId === "packaging") {
    return <Step4Packaging projectId={safeProject.id} />;
  }  
      if (activeTabId === "rawMaterialDevelopment") {
    return <Step2AnalyticalDevlopRaw projectId={safeProject.id} />;
  }  
      if (activeTabId === "finishedProductDevelopment") {
    return <Step5AnalyticalDevlopFinished projectId={safeProject.id} />;
  }  

        if (activeTabId === "rawMaterialValidation") {
    return <Step6AnalyticalValidRaw projectId={safeProject.id} />;
  }  
      if (activeTabId === "finishedProductValidation") {
    return <Step6AnalyticalValidFinished projectId={safeProject.id} />;
  }  

      if (activeTabId === "furmolationDevelop") {
    return <Step7FormulationDevelopment projectId={safeProject.id} />;
  }  

  furmolationDevelop

  if (activeTabId === "batches") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">Trial Batches</h3>
        <ul className="mt-3 space-y-2 text-xs text-stone-600">
          <li className="flex items-center gap-2">
            <span className="font-semibold text-amber-800">Batch-001:</span>
            Initial screening formulation
          </li>
          <li className="flex items-center gap-2">
            <span className="font-semibold text-amber-800">Batch-002:</span>
            Buffer ratio &amp; tonicity adjustment
          </li>
          <li className="flex items-center gap-2">
            <span className="font-semibold text-amber-800">Batch-003:</span>
            Final screening candidate
          </li>
        </ul>
      </div>
    );
  }

  if (activeTabId === "results") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">Results Summary</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Comparative evaluation completed. Selected formulation met target
          quality profile (QTPP) and CQAs.
        </p>
      </div>
    );
  }

  if (activeTabId === "methods") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Analytical Test Procedures (STP)
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Assay, related substances / impurities, dissolution/osmolality, pH,
          sterility, and bacterial endotoxins.
        </p>
      </div>
    );
  }

  if (activeTabId === "specs") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Specifications (Finished Product)
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Final release and shelf-life stability limits in compliance with
          USP/ICH guidelines.
        </p>
      </div>
    );
  }

  if (activeTabId === "protocol") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">Stability Protocol</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Accelerated: 40°C ± 2°C / 75% ± 5% RH | Long-term: 25°C ± 2°C / 60% ±
          5% RH.
        </p>
      </div>
    );
  }

  if (activeTabId === "process") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Scale-up Process Parameters
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Critical Process Parameters (CPPs) defined for mixing speed, sterile
          filtration, and fill volume control.
        </p>
      </div>
    );
  }

  if (activeTabId === "issues") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Scale-up Deviations &amp; Challenges
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Log of pilot batch challenges, yield variance investigations, and
          corrective engineering actions.
        </p>
      </div>
    );
  }

  if (activeTabId === "documents") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Technology Transfer Package
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Transfer protocol, master formula card, pilot batch manufacturing
          records (BMR/BPR), and analytical SOPs.
        </p>
      </div>
    );
  }

  if (activeTabId === "checklist") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Site Readiness Checklist
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Equipment qualification (IQ/OQ/PQ), operator GMP training, and raw
          material availability.
        </p>
      </div>
    );
  }

  if (activeTabId === "protocols") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Validation Protocols
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Process validation (3 consecutive commercial batches), media fill
          simulations, and cleaning validation.
        </p>
      </div>
    );
  }

  if (activeTabId === "reports") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Validation Reports &amp; Conclusions
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Consolidated process validation reports, yield analyses, and quality
          sign-offs.
        </p>
      </div>
    );
  }

  if (activeTabId === "ctd") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          eCTD Quality Sections
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Module 3 (Quality Overall Summary 3.2.P), Drug Product specifications,
          and stability data packaging.
        </p>
      </div>
    );
  }

  if (activeTabId === "submissions") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800">
          Regulatory Review &amp; Query Tracking
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Track regulatory authority deficiency letters, analytical query
          responses, and final marketing authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">
        No content available for this tab yet.
      </p>
    </div>
  );
}

export default function ContractProgressModal({ project }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStepId, setCurrentStepId] = useState(1);
  const [activeTabId, setActiveTabId] = useState("overview");
  const [hasBomData, setHasBomData] = useState(false);

  const safeProject = project ?? {
    id: "",
    projectCode: "-",
    title: "-",
    dosageForm: "-",
    strength: "-",
    developerName: "-",
    apiName: "-",
    step: 1,
  };

  const currentStep = useMemo(
    () =>
      WORKFLOW_STEPS.find((item) => item.id === currentStepId) ||
      WORKFLOW_STEPS[0],
    [currentStepId],
  );

  /**
   * خواندن وضعیت BOM از اکشن.
   * این تابع را بعد از ایجاد، جایگزینی یا حذف فایل BOM نیز اجرا می‌کنیم.
   */
  const refreshBomStatus = useCallback(async () => {
    if (!safeProject.id) {
      setHasBomData(false);
      return;
    }

    try {
      const result = await getStep2FormulaBomListAction(safeProject.id);
      setHasBomData(hasBomFile(result));
    } catch (error) {
      console.error("Failed to load BOM status:", error);
      setHasBomData(false);
    }
  }, [safeProject.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (safeProject.step) {
      setCurrentStepId(Number(safeProject.step));
    }
  }, [safeProject.step]);

  useEffect(() => {
    setActiveTabId(currentStep.tabs?.[0]?.id || "overview");
  }, [currentStep]);

  useEffect(() => {
    refreshBomStatus();
  }, [refreshBomStatus]);

  const handleClose = () => {
    router.push("/home/contract-development");
  };

  const handleNextStep = () => {
    if (currentStepId < WORKFLOW_STEPS.length) {
      setCurrentStepId((previousStepId) => previousStepId + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepId > 1) {
      setCurrentStepId((previousStepId) => previousStepId - 1);
    }
  };

  const checkHasData = (tabId) => {
    if (tabId === "bom") {
      return hasBomData;
    }

    return STATIC_TABS_WITH_DATA.has(tabId);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100/90 p-4 md:p-6">
        <div className="rounded-2xl bg-white p-8 text-sm text-stone-500 shadow-sm">
          Loading R&amp;D Contract Workflow...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-stone-100/90 p-4 md:p-6"
      suppressHydrationWarning
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-4 rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-stone-50 p-6 shadow-lg shadow-stone-900/5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 rounded-lg bg-amber-100/80 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              <span>✦</span> Contract R&amp;D Detailed Workflow
            </div>
            <h1 className="text-2xl font-black tracking-tight text-stone-900">
              {safeProject.title}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Project Code:{" "}
              <span className="font-mono font-bold text-amber-800">
                {safeProject.projectCode}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
          >
            Close ✕
          </button>
        </div>

        {/* Project Info Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              API Name
            </p>
            <p className="mt-2 text-sm font-bold text-stone-800">
              {safeProject.apiName}
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Dosage Form
            </p>
            <p className="mt-2 text-sm font-bold text-stone-800">
              <span className="inline-flex rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {safeProject.dosageForm}
              </span>
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Strength
            </p>
            <p className="mt-2 font-mono text-sm font-bold text-stone-800">
              {safeProject.strength}
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Developer
            </p>
            <p className="mt-2 text-sm font-bold text-stone-800">
              {safeProject.developerName}
            </p>
          </div>
        </div>

        {/* R&D Workflow Progress */}
        <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-md shadow-amber-900/5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-stone-800">
                R&amp;D Workflow Progress
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Click on any step below to view or configure details
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-100/70 px-3 py-1.5 text-xs font-bold text-amber-900">
              Step {currentStepId} of {WORKFLOW_STEPS.length}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step) => {
              const isActive = step.id === currentStepId;
              const isCompleted = step.id < currentStepId;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepId(step.id)}
                  className={[
                    "group relative flex min-h-[58px] items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-200",
                    isActive
                      ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50/60 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/40"
                      : isCompleted
                        ? "border-emerald-200 bg-emerald-50/40 text-stone-800 hover:bg-emerald-50/80"
                        : "border-stone-200 bg-white text-stone-700 hover:border-amber-200 hover:bg-stone-50/80",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm transition-all",
                      isActive
                        ? "scale-105 bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 text-white shadow-orange-500/30 ring-2 ring-amber-200"
                        : isCompleted
                          ? "bg-emerald-600 text-white ring-2 ring-emerald-100"
                          : "border border-stone-200 bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-800",
                    ].join(" ")}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "truncate text-xs font-black",
                        isActive
                          ? "text-amber-900"
                          : isCompleted
                            ? "text-emerald-900"
                            : "text-stone-800",
                      ].join(" ")}
                    >
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      {isActive
                        ? "Current Active Stage"
                        : isCompleted
                          ? "Completed"
                          : `Step ${step.id}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs + Content */}
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-md shadow-stone-900/5">
          <div className="flex flex-wrap gap-2 border-b border-stone-200 bg-stone-50/70 p-4">
            {currentStep.tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const hasData = checkHasData(tab.id);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  aria-pressed={isActive}
                  className={[
                    "rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
                    isActive
                      ? hasData
                        ? "border border-sky-300/50 bg-gradient-to-r from-sky-500/90 to-blue-600/90 text-white shadow-sm shadow-blue-600/20 backdrop-blur-md scale-[1.02]"
                        : "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-600/20 scale-[1.02]"
                      : hasData
                        ? "border border-sky-200/70 bg-sky-100/60 text-sky-700 shadow-sm shadow-sky-500/5 backdrop-blur-md hover:bg-sky-100/90"
                        : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  ].join(" ")}
                >
                  {tab.label}
                  {tab.id === "bom" && !hasBomData ? (
                    <span className="ml-2 text-[10px] font-medium opacity-70">
                      {/** اختیاری: نشانگر وضعیت بارگذاری/خالی */}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            <TabContent
              step={currentStep}
              activeTabId={activeTabId}
              project={safeProject}
              onBomChanged={refreshBomStatus}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/40 p-4">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStepId === 1}
              className="rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous Step
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={currentStepId === WORKFLOW_STEPS.length}
              className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 transition hover:from-amber-500 hover:to-orange-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:from-stone-300 disabled:to-stone-300"
            >
              Next Step →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
