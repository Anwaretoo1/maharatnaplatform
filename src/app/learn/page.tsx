import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'تعلّم مهارة جديدة وطوّر نفسك | منصة مهاراتنا',
  description: 'تعلّم الحرف اليدوية والمهارات التقليدية السورية أونلاين. دورات مجانية ومدفوعة في النجارة، الخياطة، الطبخ، التصميم وأكثر. ابدأ التعلم اليوم!',
  keywords: ['تعلم أونلاين', 'دورات مجانية', 'تنمية المهارات', 'تعليم عن بعد', 'حرف يدوية', 'مهارات عملية', 'كورسات عربية', 'تطوير الذات'],
  openGraph: {
    title: 'تعلّم مهارة جديدة | منصة مهاراتنا',
    description: 'آلاف الدروس في الحرف والمهارات العملية. تعلّم بسرعتك من أي مكان.',
    url: 'https://www.maharat-syria.com/learn',
  },
};

export default function LearnPage() {
  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 text-white text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            🎓 للطلاب والمتعلمين
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            تعلّم مهارة جديدة<br />
            <span className="text-yellow-300">وغيّر مستقبلك</span>
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
            مئات الدورات في الحرف والمهارات العملية من معلمين سوريين محترفين.
            تعلّم بسرعتك، من أي مكان، بأسعار مناسبة أو مجاناً.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/courses" className="inline-block bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-lg px-8 py-3 rounded-full transition-colors shadow-lg">
              تصفح الدورات المجانية ←
            </Link>
            <Link href="/register" className="border border-white/60 hover:border-white text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors">
              أنشئ حساب مجاناً
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">لماذا تتعلم على مهاراتنا؟</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
          نحن لسنا مجرد منصة تعليمية — نحن مجتمع يحفظ المعرفة وينقلها للأجيال
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🆓', title: 'دورات مجانية', desc: 'العشرات من الدورات المجانية تماماً. ابدأ التعلم دون أي تكلفة.' },
            { icon: '⏱️', title: 'تعلّم بوقتك', desc: 'لا مواعيد ثابتة. شاهد الدروس متى تشاء وكرّرها كم تريد.' },
            { icon: '📜', title: 'شهادة إتمام', desc: 'احصل على شهادة إتمام لكل دورة تكملها لتوثيق مهاراتك.' },
            { icon: '👨‍🏫', title: 'معلمون محترفون', desc: 'تعلّم من حرفيين ومعلمين لديهم سنوات من الخبرة العملية.' },
            { icon: '📱', title: 'من أي جهاز', desc: 'اعمل من هاتفك، تابلت، أو كمبيوتر. المنصة تعمل على كل الأجهزة.' },
            { icon: '🌱', title: 'طوّر مهارة قابلة للكسب', desc: 'المهارات التي تتعلمها هنا يمكنك تحويلها لمصدر دخل لاحقاً.' },
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-100 dark:border-neutral-800 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Learning path */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">كيف تبدأ رحلة التعلم؟</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">
            4 خطوات بسيطة للبدء في تعلم مهارة جديدة
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { num: '1', icon: '📝', title: 'أنشئ حسابك المجاني', desc: 'سجّل بإيميلك وكلمة مرور. الأمر يستغرق 30 ثانية فقط.', color: 'bg-blue-100 text-blue-700' },
              { num: '2', icon: '🔍', title: 'اختر الدورة المناسبة', desc: 'تصفح مئات الدورات حسب التخصص. ابدأ بالمجانية واستكشف.', color: 'bg-emerald-100 text-emerald-700' },
              { num: '3', icon: '▶️', title: 'شاهد الدروس', desc: 'كل دورة مقسّمة لدروس قصيرة ومنظمة. تعلّم بوتيرتك.', color: 'bg-purple-100 text-purple-700' },
              { num: '4', icon: '🏆', title: 'احصل على شهادتك', desc: 'بعد إكمال الدورة احصل على شهادة توثّق مهارتك الجديدة.', color: 'bg-amber-100 text-amber-700' },
            ].map((item) => (
              <div key={item.num} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 flex gap-4 items-start">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${item.color} dark:bg-opacity-20`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1">الخطوة {item.num}</p>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">ماذا يمكنك أن تتعلم؟</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12">مئات المهارات العملية في انتظارك</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: '🪡', title: 'الخياطة والتطريز', sub: 'ملابس، مفارش، أزياء تراثية' },
            { icon: '🍳', title: 'الطبخ والحلويات', sub: 'وصفات سورية، حلويات شرقية' },
            { icon: '🪵', title: 'النجارة والحرف', sub: 'أعمال خشبية، ديكور منزلي' },
            { icon: '🎨', title: 'الفنون والرسم', sub: 'خط عربي، رسم، زخرفة' },
            { icon: '📱', title: 'التقنية والتصميم', sub: 'تصميم جرافيك، إدارة مواقع' },
            { icon: '🌿', title: 'الزراعة والطبيعة', sub: 'زراعة منزلية، أعشاب، بستنة' },
          ].map((cat) => (
            <Link key={cat.title} href="/courses" className="group bg-white dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl p-5 border border-gray-100 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-700 transition-all">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">{cat.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cat.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonial / motivation */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/10 dark:to-emerald-900/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-6">وَقُل رَّبِّ زِدْنِي عِلْماً</div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">سورة طه - الآية 114</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-6 max-w-xl mx-auto">
            التعلم المستمر هو أفضل استثمار في نفسك. كل مهارة تتعلمها تفتح أمامك باباً جديداً.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">ابدأ رحلة التعلم اليوم</h2>
          <p className="text-emerald-100 text-lg mb-8">
            سجّل مجاناً وتصفح مئات الدورات في الحرف والمهارات العملية
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="inline-block bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-lg px-10 py-4 rounded-full transition-colors shadow-lg">
              سجّل مجاناً ←
            </Link>
            <Link href="/courses" className="border border-white/60 hover:border-white text-white px-10 py-4 rounded-full text-lg font-semibold transition-colors">
              تصفح الدورات
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
