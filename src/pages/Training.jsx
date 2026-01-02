import { useState } from 'react';

const Training = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const trainingFiles = [
    {
      id: 1,
      name: 'دليل تقييم 2.0 ELEOT',
      type: 'file',
      icon: '📄'
    },
    {
      id: 2,
      name: 'أداة 2.0 ELEOT',
      type: 'file',
      icon: '📄'
    },
    {
      id: 3,
      name: 'البيئة A: التعلم العادل',
      type: 'file',
      icon: '📋'
    },
    {
      id: 4,
      name: 'البيئة B: التوقعات العالية',
      type: 'file',
      icon: '📋'
    },
    {
      id: 5,
      name: 'البيئة C: التعلم الداعم',
      type: 'file',
      icon: '📋'
    },
    {
      id: 6,
      name: 'البيئة F: الإدارة الجيدة',
      type: 'file',
      icon: '📋'
    },
    {
      id: 7,
      name: 'البيئة E: مراقبة التقدم والملاحظات',
      type: 'file',
      icon: '📋'
    },
    {
      id: 8,
      name: 'البيئة D: التعلم النشط',
      type: 'file',
      icon: '📋'
    },
  ];

  const handleOpenFile = (file) => {
    // لا تفتح الصفحة هنا - فقط حفظ الملف المحدد
    setSelectedFile(file);
    // يمكن إضافة منطق عرض الملف لاحقاً بدون فتح صفحات جديدة
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-4">تدريب على أداة الملاحظة ELEOT</h2>
        <p className="text-gray-600 mb-6">اختر ملفاً من القائمة أدناه لعرضه</p>

        {/* File Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trainingFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            >
              {/* Icon */}
              <div className="text-4xl mb-4">{file.icon}</div>
              
              {/* File Name */}
              <h3 className="text-sm font-medium text-gray-900 mb-2">{file.name}</h3>
              
              {/* File Type Label */}
              <p className="text-xs text-gray-500 mb-4">ملف</p>
              
              {/* Open Button - لا يفتح صفحات */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenFile(file);
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                type="button"
              >
                فتح
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Training;

