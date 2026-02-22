export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 sm:p-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">شروط الخدمة</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">آخر تحديث: فبراير 2026</p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. القبول بالشروط</h2>
            <p>
              باستخدامك منصة <strong>مهاراتنا</strong>، فإنك توافق على الالتزام بهذه الشروط والأحكام.
              إذا كنت لا توافق على هذه الشروط، يُرجى عدم استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. المحتوى المسموح به</h2>
            <p>يُسمح بنشر:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>دورات ومحتوى تعليمي متعلق بالحرف والمهارات التقليدية.</li>
              <li>محتوى أصيل يملك صاحبه حقوق نشره.</li>
              <li>تعليقات ونقاشات بنّاءة ومحترمة.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. المحتوى المحظور</h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="font-bold text-red-700 dark:text-red-400 mb-2">يُحظر تماماً نشر أي مما يلي:</p>
              <ul className="list-disc list-inside space-y-2 text-red-700 dark:text-red-300">
                <li>محتوى إباحي أو جنسي من أي نوع.</li>
                <li>محتوى يُحرّض على الكراهية أو العنف أو التمييز العنصري أو الديني.</li>
                <li>إهانة الأديان أو المقدسات أو الرموز الوطنية.</li>
                <li>محتوى مسروق أو ينتهك حقوق الملكية الفكرية لأطراف أخرى.</li>
                <li>معلومات شخصية لأشخاص آخرين دون موافقتهم.</li>
                <li>إعلانات أو رسائل تسويقية غير مرخصة (spam).</li>
                <li>أي محتوى مخالف للقوانين السورية والدولية.</li>
              </ul>
            </div>
            <p className="mt-3 text-sm">
              يحق لإدارة المنصة إزالة أي محتوى مخالف وتعليق أو حذف الحساب المخالف دون إشعار مسبق.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. حسابات المستخدمين</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يجب أن يكون البريد الإلكتروني صحيحاً وتملكه فعلاً.</li>
              <li>أنت مسؤول عن الحفاظ على سرية كلمة مرورك.</li>
              <li>يُمنع إنشاء حسابات وهمية أو انتحال شخصية الآخرين.</li>
              <li>حساب واحد فقط لكل شخص.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. المعلومات الشخصية والتواصل</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>لا تشارك أرقام هواتفك أو عناوينك الشخصية علناً في المنصة.</li>
              <li>نحترم خصوصيتك ولن نشارك بياناتك مع أطراف ثالثة للأغراض التجارية.</li>
              <li>راجع <a href="/privacy" className="text-blue-600 hover:underline">سياسة الخصوصية</a> للمزيد.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. الدورات والمحتوى التعليمي</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>يحتفظ منشئو الدورات بحقوق ملكية محتواهم.</li>
              <li>يُمنع تنزيل أو إعادة نشر محتوى الدورات خارج المنصة.</li>
              <li>التقييمات والمراجعات يجب أن تكون صادقة وبنّاءة.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. التغييرات في الشروط</h2>
            <p>
              تحتفظ منصة مهاراتنا بحق تعديل هذه الشروط في أي وقت.
              سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو الإشعارات داخل المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">8. التواصل مع الإدارة</h2>
            <p>للإبلاغ عن محتوى مخالف أو أي استفسار:</p>
            <p className="mt-2">
              <a href="mailto:info@maharat-syria.com" className="text-blue-600 hover:underline">
                info@maharat-syria.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
