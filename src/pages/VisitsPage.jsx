import { useEffect, useMemo, useState } from "react";
import { fetchVisitDetails, fetchVisits } from "../services/visitsService";

// Helpers
function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function downloadCSV(filename, rows) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VisitsPage() {
  // Filters
  const [teacherName, setTeacherName] = useState("");
  const [subject, setSubject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Data
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  // Selected visit details
  const [selectedId, setSelectedId] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [visitDetails, setVisitDetails] = useState(null); // {visit, envs}
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchVisits({ teacherName, subject, dateFrom, dateTo, page, pageSize });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء جلب الزيارات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function applyFilters() {
    setPage(1);
    await load();
  }

  async function openVisit(visitId) {
    setSelectedId(visitId);
    setVisitDetails(null);
    setDetailsLoading(true);
    setError("");
    try {
      const data = await fetchVisitDetails(visitId);
      setVisitDetails(data);
    } catch (e) {
      setError(e.message || "فشل جلب تفاصيل الزيارة");
    } finally {
      setDetailsLoading(false);
    }
  }

  // Export one visit CSV (Visit + Envs)
  function exportVisitCSV() {
    if (!visitDetails) return;
    const { visit, envs } = visitDetails;

    const header1 = ["Visit ID", "Teacher", "Subject", "Date", "Total Score", "Total Max", "Percent"];
    const row1 = [
      visit.visit_id,
      visit.teacher_name,
      visit.subject,
      visit.visit_ts,
      visit.total_score,
      visit.total_max,
      visit.percent,
    ];

    const header2 = ["Env Code", "Env Name AR", "Env Score", "Env Max", "Env %", "Details"];
    const rows2 = envs.map((e) => [
      e.env_code,
      e.env_name_ar,
      e.env_score,
      e.env_max,
      e.env_percent,
      e.details,
    ]);

    const all = [header1, row1, [], header2, ...rows2];
    downloadCSV(`visit_${visit.visit_id}.csv`, all);
  }

  const handleDelete = async (visitId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
      // Delete logic here
      console.log('Deleting visit:', visitId);
    }
  };

  // Format date to Hijri format (simplified - in real app would use proper conversion)
  const formatHijriDate = (dateString) => {
    if (!dateString) return '';
    // This is a placeholder - in real app would convert to Hijri
    return '١٤٤٧/٠٧/٠١ هـ';
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">الزيارات</h2>

        {/* Visits table - Matching screenshot exactly */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-4 py-3 text-right font-semibold">الإجراءات</th>
                  <th className="px-4 py-3 text-right font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-right font-semibold">الجزء</th>
                  <th className="px-4 py-3 text-right font-semibold">الصف</th>
                  <th className="px-4 py-3 text-right font-semibold">المادة</th>
                  <th className="px-4 py-3 text-right font-semibold">رقم الزيارة</th>
                  <th className="px-4 py-3 text-right font-semibold">اسم المعلم</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-600" colSpan={7}>
                      جاري التحميل...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-600" colSpan={7}>
                      لا توجد زيارات
                    </td>
                  </tr>
                ) : (
                  rows.map((r, index) => (
                    <tr key={r.visit_id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openVisit(r.visit_id)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            عرض
                          </button>
                          <button
                            onClick={() => handleDelete(r.visit_id)}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{formatHijriDate(r.visit_ts)}</td>
                      <td className="px-4 py-3 text-gray-900">{r.segment || ''}</td>
                      <td className="px-4 py-3 text-gray-900">{r.grade || ''}</td>
                      <td className="px-4 py-3 text-gray-900">{r.subject || ''}</td>
                      <td className="px-4 py-3 text-gray-900">{r.visit_number || (rows.length - index)}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{r.teacher_name || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details panel */}
        <div className="mt-6 bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold mb-3">تفاصيل الزيارة</h3>

          {!selectedId ? (
            <div className="text-gray-600">اختر زيارة من الجدول لعرض تفاصيلها.</div>
          ) : detailsLoading ? (
            <div className="text-gray-600">جاري تحميل التفاصيل...</div>
          ) : !visitDetails ? (
            <div className="text-gray-600">لا توجد تفاصيل.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">المعلم</div>
                  <div className="font-semibold">{visitDetails.visit.teacher_name}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">المادة</div>
                  <div className="font-semibold">{visitDetails.visit.subject}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">التاريخ</div>
                  <div className="font-semibold">{fmtDate(visitDetails.visit.visit_ts)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">النسبة</div>
                  <div className="font-semibold">{visitDetails.visit.percent}%</div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={exportVisitCSV}
                  className="bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700"
                >
                  Export CSV (زيارة واحدة)
                </button>
                {/* PDF/Word نربطها بعد ما تجهز مكتبات التصدير */}
                <button
                  disabled
                  className="bg-gray-200 rounded-lg px-4 py-2 opacity-60 cursor-not-allowed"
                >
                  PDF قريباً
                </button>
                <button
                  disabled
                  className="bg-gray-200 rounded-lg px-4 py-2 opacity-60 cursor-not-allowed"
                >
                  Word قريباً
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border">الكود</th>
                      <th className="px-3 py-2 border">البيئة</th>
                      <th className="px-3 py-2 border">الدرجة</th>
                      <th className="px-3 py-2 border">الحد</th>
                      <th className="px-3 py-2 border">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitDetails.envs.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="px-3 py-2 border font-semibold">{e.env_code}</td>
                        <td className="px-3 py-2 border">{e.env_name_ar}</td>
                        <td className="px-3 py-2 border">{e.env_score}</td>
                        <td className="px-3 py-2 border">{e.env_max}</td>
                        <td className="px-3 py-2 border font-semibold">{e.env_percent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
