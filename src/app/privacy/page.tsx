export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 sm:p-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">سياسة الخصوصية</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">آخر تحديث: فبراير 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. مقدمة</h2>
            <p>
              تلتزم منصة <strong>مهاراتنا</strong> (maharat-syria.com) بحماية خصوصية مستخدميها.
              تُوضّح هذه السياسة كيفية جمع معلوماتك الشخصية واستخدامها وحمايتها عند استخدام
              خدماتنا.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. المعلومات التي نجمعها</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، كلمة المرور المشفّرة.</li>
              <li><strong>معلومات الملف الشخصي:</strong> الصورة الشخصية، النبذة التعريفية، المهارات.</li>
              <li><strong>بيانات الاستخدام:</strong> تقدّم الدورات، الدورات المشترك بها، تاريخ آخر دخول.</li>
              <li><strong>البيانات التقنية:</strong> عنوان IP (لأغراض الأمان فقط، ولا يُخزَّن).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. كيفية استخدام المعلومات</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>تقديم خدمات المنصة وتشغيلها بشكل صحيح.</li>
              <li>إرسال إشعارات تتعلق بحسابك (كإعادة تعيين كلمة المرور).</li>
              <li>تحسين تجربة المستخدم وتطوير المنصة.</li>
              <li><strong>لا نبيع</strong> معلوماتك الشخصية لأي طرف ثالث.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. أمان البيانات</h2>
            <p>
              تُشفَّر كلمات المرور باستخدام خوارزمية bcrypt. تُخزَّن بياناتك على قواعد بيانات
              آمنة (Railway). نستخدم HTTPS لتشفير جميع الاتصالات.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. مشاركة البيانات مع أطراف ثالثة</h2>
            <p>نستخدم الخدمات التالية لتشغيل المنصة:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Cloudinary:</strong> لتخزين الصور والمقاطع المرئية.</li>
              <li><strong>Vercel:</strong> لاستضافة المنصة.</li>
              <li><strong>Gmail SMTP:</strong> لإرسال رسائل البريد الإلكتروني.</li>
            </ul>
            <p className="mt-2">لا تُستخدم هذه البيانات لأغراض تجارية خارج نطاق الخدمة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. حقوقك</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>حق الوصول إلى بياناتك الشخصية وتعديلها من صفحة الملف الشخصي.</li>
              <li>حق طلب حذف حسابك وجميع بياناتك بالتواصل معنا.</li>
              <li>حق تصحيح أي معلومات غير دقيقة.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. الكوكيز (Cookies)</h2>
            <p>
              نستخدم ملفات تعريف الارتباط (Cookies) فقط لحفظ جلسة تسجيل الدخول.
              لا نستخدم كوكيز تتبع أو إعلانات.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">8. التواصل معنا</h2>
            <p>
              لأي استفسار حول سياسة الخصوصية أو طلب حذف البيانات، تواصل معنا على:
            </p>
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
