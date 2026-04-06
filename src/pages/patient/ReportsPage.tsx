import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { patientsApi } from '../../api/patients.api';
import { SeverityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Card from '../../components/ui/Card';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function ReportsPage() {
  const [page, setPage] = useState(0);
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['patient-reports', page],
    queryFn: async () => { const r = await patientsApi.getMyReports(page); return r.data.data!; },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {data?.content.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">{t('reports.empty')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('reports.empty_sub')}</p>
        </div>
      ) : (
        <>
          {data?.content.map((r) => (
            <Link key={r.id} to={`/patient/reports/${r.id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={22} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</p>
                      <SeverityBadge severity={r.severity} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {t('reports.doctor_label')}: {r.doctorName} · {format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}
                      {r.reportNumber && ` · №${r.reportNumber}`}
                    </p>
                    {r.xrayAnalysisId && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <FileImage size={12} />
                        {t('reports.linked_analysis')}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
          <Pagination
            page={data?.page ?? 0}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            size={data?.size ?? 10}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
