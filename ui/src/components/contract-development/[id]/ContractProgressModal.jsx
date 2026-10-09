"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// کامپوننت‌های گام‌ها
import Step1StudiesSection from "../step1/Step1LiteratureStudy";
import Step3RawMaterialCoaSection from "../step1/Step1RawMaterialCoa";
import Step3FinishedCoaSection from "../step1/Step1FormulationMaterials";
import Step1BOM from "../step1/Step1BOM";
import Step4PreFormulationComponent from "../step1/Step1PreFurmola";
import Step4Packaging from "../step1/Step1PreFurmolaPackaging";
import Step2AnalyticalDevlopRaw from "../step2/Step2AnalyticalDevlopRaw";
import Step5AnalyticalDevlopFinished from "../step2/Step2AnalyticalDevlopFinished";
import Step6AnalyticalValidRaw from "../step3/Step3AnalyticalValidRaw";
import Step6AnalyticalValidFinished from "../step3/Step3AnalyticalvalidFinished";
import Step7FormulationDevelopment from "../step4/Step4FurmolaDevelop";
import ContractSpecificationStep from "../step5/Step5ContractSpecification";
import ContractBatchStep from "../step5/Step5ContractBatch";
import ContractBatchComparisonGraphTab from "../step5/Step5ContractGraphTab";
import Step6ScaleUpTrial from "../step6/Step6ScaleupTrial";
import Step7ScaleUpFinal from "../step7/Step7ScaleupFinal";
import Step8CtdModule from "../step8/Step8Ctd";

// اکشن دریافت اطلاعات اصلی قرارداد
import { getContractProductByIdAction } from "@/app/actions/contract-product-action";

// اکشن‌های سرور برای بررسی وضعیت تب‌ها
import { getStep2FormulaBomListAction } from "@/app/actions/bom-action";
import { getStep6ScaleUpTrialListAction } from "@/app/actions/scaleup-trial-action";
import { getStep7ScaleUpFinalByProjectAction } from "@/app/actions/scaleup-final-action";
import { getStep8CtdModuleByProjectAction } from "@/app/actions/ctd-action";

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Pre-formulation Studies",
    description: "API characterization, excipient compatibility, and initial risk assessment.",
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
    description: "Analytical methods, specifications, and test procedures.",
    tabs: [
      { id: "rawMaterialDevelopment", label: "Raw Material" },
      { id: "finishedProductDevelopment", label: "Finished Product" },
    ],
  },
  {
    id: 3,
    title: "Analytical Method Validation",
    description: "Process validation, cleaning validation, and performance qualification.",
    tabs: [
      { id: "rawMaterialValidation", label: "Raw Material" },
      { id: "finishedProductValidation", label: "Finished Product" },
    ],
  },
  {
    id: 4,
    title: "Formulation Development",
    description: "Prototype design, composition optimization, and screening trials.",
    tabs: [{ id: "furmolationDevelop", label: "Formulation Development" }],
  },
  {
    id: 5,
    title: "Stability Studies",
    description: "Accelerated and long-term stability evaluation.",
    tabs: [
      { id: "contractSpecification", label: "Specification" },
      { id: "contractBatch", label: "Batch" },
      { id: "contractGragh", label: "Graph" },
    ],
  },
  {
    id: 6,
    title: "Scale-up",
    description: "Pilot scale manufacturing and process optimization.",
    tabs: [{ id: "scaleup", label: "Scale Up" }],
  },
  {
    id: 7,
    title: "Tech Transfer",
    description: "Transfer package, production handover, and manufacturing readiness.",
    tabs: [{ id: "scaleupfinal", label: "Scale Up Final" }],
  },
  {
    id: 8,
    title: "Regulatory / CTD",
    description: "Regulatory documents, dossier compilation, and CTD preparation.",
    tabs: [{ id: "ctd", label: "CTD Sections" }],
  },
];

function checkEntityHasData(result) {
  if (!result) return false;
  if (Array.isArray(result)) return result.length > 0;
  const data = result.data !== undefined ? result.data : result;
  if (Array.isArray(data)) return data.length > 0;
  if (Array.isArray(data?.items)) return data.items.length > 0;
  if (Array.isArray(data?.records)) return data.records.length > 0;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const keys = Object.keys(data).filter(
      (k) => !["id", "projectId", "createdAt", "updatedAt"].includes(k)
    );
    return keys.some(
      (k) => data[k] !== null && data[k] !== undefined && String(data[k]).trim() !== ""
    );
  }
  return false;
}

function hasBomFile(result) {
  if (!result) return false;
  let records = [];
  if (Array.isArray(result)) records = result;
  else if (Array.isArray(result.data)) records = result.data;
  else if (Array.isArray(result.data?.items)) records = result.data.items;
  else if (result.data && typeof result.data === "object") records = [result.data];

  return records.some(
    (record) =>
      typeof record?.bomFileUrl === "string" && record.bomFileUrl.trim().length > 0
  );
}

function TabContent({ activeTabId, project, onRefreshAll, onTabStatusChange, tabsCompleted }) {
  const safeProject = project ?? {};
  const [analysisSubTab, setAnalysisSubTab] = useState("rawMaterialCoa");

  // پایش زیرتب‌های تحلیل برای اعلام وضعیت تب کلی analysis
  const [subTabStatus, setSubTabStatus] = useState({
    rawMaterialCoa: false,
    finishedCoa: false,
  });

  const handleSubTabChange = (key, val) => {
    setSubTabStatus((prev) => {
      const updated = { ...prev, [key]: Boolean(val) };
      const hasAny = updated.rawMaterialCoa || updated.finishedCoa;
      onTabStatusChange("analysis", hasAny);
      return updated;
    });
  };

  if (activeTabId === "studies") {
    return (
      <Step1StudiesSection
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("studies", hasData)}
      />
    );
  }
  if (activeTabId === "bom") {
    return (
      <Step1BOM
        projectId={safeProject.id}
        onBomChanged={onRefreshAll}
        onDataStatusChange={(hasData) => onTabStatusChange("bom", hasData)}
      />
    );
  }
  if (activeTabId === "analysis") {
    const isRawActive = analysisSubTab === "rawMaterialCoa";
    const isFinishedActive = analysisSubTab === "finishedCoa";
    const rawHasData = subTabStatus.rawMaterialCoa;
    const finishedHasData = subTabStatus.finishedCoa;

    return (
      <div className="space-y-5">
        {/* استایل کاملاً هماهنگ با تب‌های بالایی */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50/50 p-2.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setAnalysisSubTab("rawMaterialCoa")}
            aria-pressed={isRawActive}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              isRawActive
                ? rawHasData
                  ? "border border-emerald-300 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20 scale-[1.02]"
                  : "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-600/20 scale-[1.02]"
                : rawHasData
                ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 shadow-xs"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            ].join(" ")}
          >
            <span>Raw Material COA</span>
            {rawHasData && (
              <span
                className={[
                  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                  isRawActive ? "bg-white text-emerald-600" : "bg-emerald-200 text-emerald-800",
                ].join(" ")}
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAnalysisSubTab("finishedCoa")}
            aria-pressed={isFinishedActive}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              isFinishedActive
                ? finishedHasData
                  ? "border border-emerald-300 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20 scale-[1.02]"
                  : "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-600/20 scale-[1.02]"
                : finishedHasData
                ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 shadow-xs"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            ].join(" ")}
          >
            <span>Reference / Working STD COA</span>
            {finishedHasData && (
              <span
                className={[
                  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                  isFinishedActive ? "bg-white text-emerald-600" : "bg-emerald-200 text-emerald-800",
                ].join(" ")}
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        </div>

        {isRawActive ? (
          <Step3RawMaterialCoaSection
            projectId={safeProject.id}
            onDataStatusChange={(hasData) => handleSubTabChange("rawMaterialCoa", hasData)}
          />
        ) : (
          <Step3FinishedCoaSection
            projectId={safeProject.id}
            onDataStatusChange={(hasData) => handleSubTabChange("finishedCoa", hasData)}
          />
        )}
      </div>
    );
  }
  if (activeTabId === "preFurmola") {
    return (
      <Step4PreFormulationComponent
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("preFurmola", hasData)}
      />
    );
  }
  if (activeTabId === "packaging") {
    return (
      <Step4Packaging
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("packaging", hasData)}
      />
    );
  }
  if (activeTabId === "rawMaterialDevelopment") {
    return (
      <Step2AnalyticalDevlopRaw
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("rawMaterialDevelopment", hasData)}
      />
    );
  }
  if (activeTabId === "finishedProductDevelopment") {
    return (
      <Step5AnalyticalDevlopFinished
        projectId={safeProject.id}
        onDataStatusChange={(hasData) =>
          onTabStatusChange("finishedProductDevelopment", hasData)
        }
      />
    );
  }
  if (activeTabId === "rawMaterialValidation") {
    return (
      <Step6AnalyticalValidRaw
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("rawMaterialValidation", hasData)}
      />
    );
  }
  if (activeTabId === "finishedProductValidation") {
    return (
      <Step6AnalyticalValidFinished
        projectId={safeProject.id}
        onDataStatusChange={(hasData) =>
          onTabStatusChange("finishedProductValidation", hasData)
        }
      />
    );
  }
  if (activeTabId === "furmolationDevelop") {
    return (
      <Step7FormulationDevelopment
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("furmolationDevelop", hasData)}
      />
    );
  }
  if (activeTabId === "contractSpecification") {
    return (
      <ContractSpecificationStep
        projectId={safeProject.id}
        onDataStatusChange={(hasData) =>
          onTabStatusChange("contractSpecification", hasData)
        }
      />
    );
  }
  if (activeTabId === "contractBatch") {
    return (
      <ContractBatchStep
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("contractBatch", hasData)}
      />
    );
  }
  if (activeTabId === "contractGragh") {
    return (
      <ContractBatchComparisonGraphTab
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("contractGragh", hasData)}
      />
    );
  }
  if (activeTabId === "scaleup") {
    return (
      <Step6ScaleUpTrial
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("scaleup", hasData)}
      />
    );
  }
  if (activeTabId === "scaleupfinal") {
    return (
      <Step7ScaleUpFinal
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("scaleupfinal", hasData)}
      />
    );
  }
  if (activeTabId === "ctd") {
    return (
      <Step8CtdModule
        projectId={safeProject.id}
        onDataStatusChange={(hasData) => onTabStatusChange("ctd", hasData)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">No content available for this tab yet.</p>
    </div>
  );
}

export default function ContractProgressModal({ project }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStepId, setCurrentStepId] = useState(1);
  const [activeTabId, setActiveTabId] = useState("studies");

  const [liveProject, setLiveProject] = useState(project || null);
  const [tabsCompleted, setTabsCompleted] = useState({});

  useEffect(() => {
    async function fetchFullProjectDetails() {
      const targetId = project?.id || (typeof project === "string" ? project : null);
      if (targetId) {
        try {
          const res = await getContractProductByIdAction(targetId);
          if (res) {
            const data = res.data !== undefined ? res.data : res;
            setLiveProject(data);
          }
        } catch (err) {
          console.error("Failed to load ContractProject:", err);
        }
      }
    }
    fetchFullProjectDetails();
  }, [project]);

  const safeProject = useMemo(() => {
    const p = liveProject || project || {};
    return {
      id: p.id || "",
      projectCode: p.projectCode || p.code || "PRJ-1",
      title: p.title || p.productName || p.name || "Contract R&D Development",
      dosageForm: p.dosageForm || p.dosage || "Sterile Solution",
      strength: p.strength || "500 mg / 5 mL",
      developerName: p.developerName || p.developer || "Dr. Enteshari",
      apiName: p.apiName || p.api || "Active Pharmaceutical Ingredient",
      step: p.step || 1,
    };
  }, [liveProject, project]);

  const currentStep = useMemo(
    () => WORKFLOW_STEPS.find((item) => item.id === currentStepId) || WORKFLOW_STEPS[0],
    [currentStepId]
  );

  // ثبت و به‌روزرسانی لحظه‌ای وضعیت هر تب با دیتای واقعی
  const handleTabStatusChange = useCallback((tabId, hasData) => {
    setTabsCompleted((prev) => {
      const boolVal = Boolean(hasData);
      if (prev[tabId] === boolVal) return prev;
      return { ...prev, [tabId]: boolVal };
    });
  }, []);

  // واکشی وضعیت اولیه تب‌های کلیدی از سرور
  const refreshAllStepsData = useCallback(async () => {
    if (!safeProject.id) return;

    try {
      const [bomRes, scaleupRes, finalRes, ctdRes] = await Promise.allSettled([
        getStep2FormulaBomListAction(safeProject.id),
        getStep6ScaleUpTrialListAction(safeProject.id),
        getStep7ScaleUpFinalByProjectAction(safeProject.id),
        getStep8CtdModuleByProjectAction(safeProject.id),
      ]);

      const hasBom = bomRes.status === "fulfilled" && hasBomFile(bomRes.value);
      const hasScaleup =
        scaleupRes.status === "fulfilled" && checkEntityHasData(scaleupRes.value);
      const hasFinal =
        finalRes.status === "fulfilled" && checkEntityHasData(finalRes.value);
      const hasCtd =
        ctdRes.status === "fulfilled" && checkEntityHasData(ctdRes.value);

      setTabsCompleted((prev) => ({
        ...prev,
        bom: hasBom,
        scaleup: hasScaleup,
        scaleupfinal: hasFinal,
        ctd: hasCtd,
      }));
    } catch (error) {
      console.error("Failed to fetch step completion status:", error);
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
    setActiveTabId(currentStep.tabs?.[0]?.id || "");
  }, [currentStep]);

  useEffect(() => {
    refreshAllStepsData();
  }, [refreshAllStepsData]);

  const handleClose = () => {
    router.push("/home/contract-development");
  };

  const handleNextStep = () => {
    if (currentStepId < WORKFLOW_STEPS.length) {
      setCurrentStepId((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepId > 1) {
      setCurrentStepId((prev) => prev - 1);
    }
  };

  // محاسبه پویای وضعیت تکمیل مرحله بر اساس ردیف‌ها و داده‌های واقعی
  const isStepCompleted = useCallback(
    (step) => {
      if (!step || !step.tabs) return false;

      // گام ۱: زمانی تکمیل محسوب شود که هم بخش Studies دارای داده باشد و هم حداقل یکی از بخش‌های فنی فرمولاسیون/مواد پر شده باشد
      if (step.id === 1) {
        const hasStudies = Boolean(tabsCompleted["studies"]);
        const hasTechnicalData = Boolean(
          tabsCompleted["bom"] ||
          tabsCompleted["analysis"] ||
          tabsCompleted["preFurmola"] ||
          tabsCompleted["packaging"]
        );
        return hasStudies && hasTechnicalData;
      }

      // گام ۵ (Stability): اگر Specification یا Batch دارای داده باشند
      if (step.id === 5) {
        return Boolean(
          tabsCompleted["contractSpecification"] || tabsCompleted["contractBatch"]
        );
      }

      // برای سایر گام‌ها: در صورتی که همه تب‌های درون آن حداقل یک‌بار ثبت شده باشند
      return step.tabs.every((t) => Boolean(tabsCompleted[t.id]));
    },
    [tabsCompleted]
  );

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
    <div className="min-h-screen bg-stone-100/90 p-4 md:p-6" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col gap-4 rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-stone-50 p-6 shadow-lg shadow-stone-900/5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-2 rounded-lg bg-amber-100/80 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              <span>✦</span> Contract R&amp;D Development
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
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">API Name</p>
            <p className="mt-2 text-sm font-bold text-stone-800">{safeProject.apiName}</p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Dosage Form</p>
            <p className="mt-2 text-sm font-bold text-stone-800">
              <span className="inline-flex rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {safeProject.dosageForm}
              </span>
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Strength</p>
            <p className="mt-2 font-mono text-sm font-bold text-stone-800">{safeProject.strength}</p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Developer</p>
            <p className="mt-2 text-sm font-bold text-stone-800">{safeProject.developerName}</p>
          </div>
        </div>

        {/* R&D Workflow Progress Timeline */}
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
              const isCompleted = isStepCompleted(step);

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
                      ? "border-emerald-300 bg-emerald-50/50 text-stone-800 hover:bg-emerald-50/80 shadow-xs"
                      : "border-stone-200 bg-white text-stone-700 hover:border-amber-200 hover:bg-stone-50/80",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm transition-all",
                      isCompleted
                        ? "bg-emerald-600 text-white ring-2 ring-emerald-200"
                        : isActive
                        ? "scale-105 bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 text-white shadow-orange-500/30 ring-2 ring-amber-200"
                        : "border border-stone-200 bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-800",
                    ].join(" ")}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "truncate text-xs font-black",
                        isCompleted
                          ? "text-emerald-950 font-bold"
                          : isActive
                          ? "text-amber-900"
                          : "text-stone-800",
                      ].join(" ")}
                    >
                      {step.title}
                    </p>
                    <p
                      className={[
                        "mt-0.5 text-[10px] font-bold",
                        isCompleted
                          ? "text-emerald-600"
                          : isActive
                          ? "text-amber-600"
                          : "text-stone-400",
                      ].join(" ")}
                    >
                      {isCompleted
                        ? "Completed"
                        : isActive
                        ? "Current Active Stage"
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
              const hasData = Boolean(tabsCompleted[tab.id]);

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  aria-pressed={isActive}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
                    isActive
                      ? hasData
                        ? "border border-emerald-300 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20 scale-[1.02]"
                        : "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-600/20 scale-[1.02]"
                      : hasData
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 shadow-xs"
                      : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                  ].join(" ")}
                >
                  <span>{tab.label}</span>
                  {hasData && (
                    <span
                      className={[
                        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                        isActive
                          ? "bg-white text-emerald-600 shadow-sm"
                          : "bg-emerald-200 text-emerald-800",
                      ].join(" ")}
                      title="دارای اطلاعات ثبت‌شده"
                    >
                      <svg
                        className="h-2.5 w-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            <TabContent
              activeTabId={activeTabId}
              project={safeProject}
              onRefreshAll={refreshAllStepsData}
              onTabStatusChange={handleTabStatusChange}
              tabsCompleted={tabsCompleted}
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
