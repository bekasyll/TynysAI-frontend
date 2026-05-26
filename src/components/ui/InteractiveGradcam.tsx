import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ZoomIn, X } from "lucide-react";
import { xraysApi } from "../../api/xrays.api";
import type { GradcamResponse } from "../../types";

const AI_CLASSES = ["COVID19", "INVALID", "NORMAL", "PNEUMONIA", "TUBERCULOSIS"];

const COLORMAPS = [
  { value: "jet", label: "Jet" },
  { value: "hot", label: "Hot" },
  { value: "plasma", label: "Plasma" },
  { value: "inferno", label: "Inferno" },
];

interface Props {
  analysisId: string | number;
  imageUrl: string | null;
  aiPrimaryDiagnosis: string;
  aiAllPredictionsJson?: string;
  gradcamAvailable: boolean;
}

function mapDiagnosisToClass(diagnosis: string): string {
  const map: Record<string, string> = {
    BACTERIAL_PNEUMONIA: "PNEUMONIA",
    VIRAL_PNEUMONIA: "PNEUMONIA",
    COVID_19: "COVID19",
    TUBERCULOSIS: "TUBERCULOSIS",
    NORMAL: "NORMAL",
  };
  return map[diagnosis] ?? "NORMAL";
}

const DISEASE_TO_CLASS: Record<string, string> = {
  COVID_19: "COVID19",
  BACTERIAL_PNEUMONIA: "PNEUMONIA",
  VIRAL_PNEUMONIA: "PNEUMONIA",
  TUBERCULOSIS: "TUBERCULOSIS",
  NORMAL: "NORMAL",
  OTHER: "INVALID",
};

function parsePredictions(
  json?: string
): Record<string, number> | null {
  if (!json) return null;
  try {
    const raw: Record<string, number> = JSON.parse(json);
    const mapped: Record<string, number> = {};
    for (const [key, val] of Object.entries(raw)) {
      const cls = DISEASE_TO_CLASS[key] ?? key;
      mapped[cls] = Math.max(mapped[cls] ?? 0, val);
    }
    return mapped;
  } catch {
    return null;
  }
}

export default function InteractiveGradcam({
  analysisId,
  imageUrl,
  aiPrimaryDiagnosis,
  aiAllPredictionsJson,
  gradcamAvailable,
}: Props) {
  const { t } = useTranslation();

  const predictedClass = mapDiagnosisToClass(aiPrimaryDiagnosis);
  const predictions = parsePredictions(aiAllPredictionsJson);

  const classLabel = (cls: string) => t(`gradcam.cls_${cls}`);

  const [targetClass, setTargetClass] = useState(predictedClass);
  const [alpha, setAlpha] = useState(0.5);
  const [threshold, setThreshold] = useState(0.3);
  const [colormap, setColormap] = useState("jet");
  const [gradcam, setGradcam] = useState<GradcamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchGradcam = useCallback(
    (cls: string, a: number, th: number, cm: string) => {
      if (!gradcamAvailable) return;
      setLoading(true);
      xraysApi
        .getGradcam(analysisId, {
          targetClass: cls,
          alpha: a,
          threshold: th,
          colormap: cm,
        })
        .then((res) => setGradcam(res.data.data ?? null))
        .catch(() => setGradcam(null))
        .finally(() => setLoading(false));
    },
    [analysisId, gradcamAvailable]
  );

  useEffect(() => {
    fetchGradcam(predictedClass, 0.5, 0.3, "jet");
  }, [predictedClass, fetchGradcam]);

  const debouncedFetch = useCallback(
    (cls: string, a: number, th: number, cm: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchGradcam(cls, a, th, cm), 400);
    },
    [fetchGradcam]
  );

  const handleClassChange = (cls: string) => {
    setTargetClass(cls);
    debouncedFetch(cls, alpha, threshold, colormap);
  };

  const handleAlphaChange = (v: number) => {
    setAlpha(v);
    debouncedFetch(targetClass, v, threshold, colormap);
  };

  const handleThresholdChange = (v: number) => {
    setThreshold(v);
    debouncedFetch(targetClass, alpha, v, colormap);
  };

  const handleColormapChange = (cm: string) => {
    setColormap(cm);
    debouncedFetch(targetClass, alpha, threshold, cm);
  };

  const isPredicted = targetClass === predictedClass;

  if (!gradcamAvailable) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="font-semibold text-gray-900">
        {t("gradcam.title")}
      </h3>

      {/* Status banner */}
      <div
        className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${
          isPredicted
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-orange-50 text-orange-700 border border-orange-200"
        }`}
      >
        {isPredicted ? t("gradcam.predicted_class") : t("gradcam.alt_class")}
        {": "}
        <span className="font-bold">{classLabel(targetClass)}</span>
        {gradcam && (
          <>
            {" | "}
            {t("gradcam.active_zone")}: {gradcam.activePercent}%
          </>
        )}
      </div>

      {/* Class selector */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
          {t("gradcam.class_label")}
        </p>
        <div className="flex flex-wrap gap-2">
          {AI_CLASSES.map((cls) => {
            const isActive = cls === targetClass;
            const isModelPrediction = cls === predictedClass;
            return (
              <button
                key={cls}
                onClick={() => handleClassChange(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {classLabel(cls)}
                {isModelPrediction && predictions?.[cls] != null && (
                  <span className="ml-1 opacity-70">
                    ({(predictions[cls] * 100).toFixed(1)}%)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center justify-between text-xs text-gray-500 font-medium mb-1">
            <span>{t("gradcam.transparency")}</span>
            <span className="text-gray-900 font-semibold">{alpha.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={alpha}
            onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>0.1</span>
            <span>0.9</span>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-xs text-gray-500 font-medium mb-1">
            <span>{t("gradcam.threshold")}</span>
            <span className="text-gray-900 font-semibold">{threshold.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>0.00</span>
            <span>0.95</span>
          </div>
        </div>
      </div>

      {/* Colormap selector */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">
          {t("gradcam.colormap")}
        </p>
        <div className="flex gap-2">
          {COLORMAPS.map((cm) => (
            <button
              key={cm.value}
              onClick={() => handleColormapChange(cm.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                colormap === cm.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {cm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ImagePanel
          label={t("analyses.original_image")}
          src={imageUrl}
          borderColor="border-gray-200"
          onZoom={setLightbox}
        />
        <ImagePanel
          label={t("gradcam.heatmap_label")}
          src={
            gradcam ? `data:image/jpeg;base64,${gradcam.heatmapB64}` : null
          }
          loading={loading}
          borderColor="border-orange-200"
          onZoom={setLightbox}
        />
        <ImagePanel
          label={t("gradcam.overlay_label")}
          src={
            gradcam ? `data:image/jpeg;base64,${gradcam.overlayB64}` : null
          }
          loading={loading}
          borderColor="border-blue-200"
          onZoom={setLightbox}
        />
      </div>

      {/* Probability bars */}
      {predictions && (
        <div>
          <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
            {t("gradcam.probabilities")}
          </p>
          <div className="space-y-2">
            {AI_CLASSES.map((cls) => {
              const prob = predictions[cls] ?? 0;
              const pct = (prob * 100).toFixed(1);
              const isTarget = cls === targetClass;
              const isPred = cls === predictedClass;
              return (
                <button
                  key={cls}
                  onClick={() => handleClassChange(cls)}
                  className={`w-full text-left rounded-lg p-2 transition-colors ${
                    isTarget ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium ${
                        isTarget ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {classLabel(cls)}
                      {isPred && (
                        <span className="ml-1.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                          {t("gradcam.predicted")}
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isTarget ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isPred
                          ? "bg-green-500"
                          : isTarget
                          ? "bg-blue-500"
                          : "bg-gray-400"
                      }`}
                      style={{ width: `${Math.max(prob * 100, 0.5)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>
          <img
            src={lightbox}
            alt="Zoomed"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function ImagePanel({
  label,
  src,
  loading,
  borderColor = "border-gray-200",
  onZoom,
}: {
  label: string;
  src: string | null;
  loading?: boolean;
  borderColor?: string;
  onZoom: (src: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
        {label}
      </p>
      <div
        className={`relative rounded-lg border ${borderColor} overflow-hidden bg-gray-50 aspect-square`}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
            <Loader2 size={24} className="animate-spin text-orange-500" />
          </div>
        )}
        {src ? (
          <div className="group relative w-full h-full">
            <img
              src={src}
              alt={label}
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => onZoom(src)}
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        ) : (
          !loading && (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
              --
            </div>
          )
        )}
      </div>
    </div>
  );
}
