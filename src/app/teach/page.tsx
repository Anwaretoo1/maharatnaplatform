import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'علّم واكسب من الإنترنت | منصة مهاراتنا',
  description: 'هل لديك حرفة أو مهارة؟ علّمها للآخرين واكسب دخلاً من الإنترنت. انضم لآلاف المعلمين والحرفيين على منصة مهاراتنا وابدأ رحلتك التعليمية اليوم.',
  keywords: ['علّم أونلاين', 'كسب من الإنترنت', 'دخل من المهارات', 'تعليم الحرف', 'ربح من التدريس', 'معلم أونلاين', 'حرفي سوري', 'دورات تعليمية'],
  openGraph: {
    title: 'علّم واكسب من الإنترنت | منصة مهاراتنا',
    description: 'حوّل مهارتك إلى دخل حقيقي. أنشئ دوراتك وعلّم من منزلك.',
    url: 'https://www.maharat-syria.com/teach',
  },
};

const steps = [
  {
    num: '01',
    icon: '👤',
    title: 'سجّل حسابك كحرفي',
    desc: 'أنشئ حساباً مجانياً واختر "حرفي" أو "معلم" عند التسجيل. أضف صورتك ونبذة عن خبرتك.',
    color: 'blue',
  },
  {
    num: '02',
    icon: '🎥',
    title: 'سجّل دروسك فيديو',
    desc: 'سجّل دروسك باستخدام هاتفك أو الكاميرا. لا تحتاج معدات احترافية — الإضاءة الجيدة والصوت الواضح يكفيان.',
    color: 'purple',
  },
  {
    num: '03',
    icon: '📂',
    title: 'ارفع الفيديوهات على Google Drive',
    desc: 'الأفضل استخدام Google Drive لرفع الفيديوهات (مجاناً حتى 15  GB). هذا يضمن سرعة التحميل وجودة عالية.',
    color: 'green',
    detail: true,
  },
  {
    num: '04',
    icon: '📚',
    title: 'أنشئ دورتك على المنصة',
    desc: 'من لوحة التحكم، أنشئ دورة جديدة: أضف العنوان، الوصف، الصورة، السعر (أو مجاني). ثم أضف كل درس بالترتيب.',
    color: 'orange',
  },
  {
    num: '05',
    icon: '💰',
    title: 'ابدأ الكسب',
    desc: 'بعد نشر الدورة، يمكن للطلاب الاشتراك بها. ستصلك المدفوعات مباشرة. كلما زاد عدد الطلاب، زاد دخلك.',
    color: 'yellow',
  },
];

const driveSteps = [
  { step: '1', text: 'افتح drive.google.com وسجّل دخولك بحساب Gmail' },
  { step: '2', text: 'أنشئ مجلداً باسم الدورة (مثل: "دورة النسيج اليدوي")' },
  { step: '3', text: 'ارفع فيديوهات الدروس داخل المجلد' },
  { step: '4', text: 'انقر بزر اليمين على الفيديو ← "مشاركة" ← "أي شخص لديه الرابط"' },
  { step: '5', text: 'انسخ الرابط والصقه عند إضافة الدرس في منصة مهاراتنا' },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function TeachPage() {
  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            💡 للمعلمين والحرفيين
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            حوّل مهارتك إلى<br />
            <span className="text-yellow-300">دخل حقيقي</span> من الإنترنت
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            سواء كنت نجاراً، خياطة، طباخاً، فناناً، أو لديك أي مهارة — يمكنك تعليمها للآخرين
            واكتساب دخل إضافي من منزلك بدون رأس مال.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-3 rounded-full bg-white text-blue-700 hover:bg-blue-50 font-bold">
              ابدأ الآن مجاناً ←
            </Link>
            <a href="#steps" className="text-white border border-white/50 hover:border-white px-8 py-3 rounded-full text-lg font-semibold transition-colors">
              كيف يعمل؟
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-neutral-900 py-10 border-b border-gray-100 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: '0 ريال', label: 'رسوم التسجيل' },
            { num: '100%', label: 'تحكم بمحتواك' },
            { num: '24/7', label: 'طلابك يتعلمون' },
            { num: '∞', label: 'إمكانية الكسب' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{s.num}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why teach here */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">لماذا تعلّم على مهاراتنا؟</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          منصتنا مصممة خصيصاً للحرفيين والمعلمين العرب الذين يريدون نشر معرفتهم وكسب دخل من الإنترنت
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🆓', title: 'مجاني تماماً', desc: 'التسجيل وإنشاء الدورات مجاني. لا توجد رسوم مخفية.' },
            { icon: '🌍', title: 'جمهور عربي واسع', desc: 'وصل لطلاب من سوريا والعالم العربي يبحثون عن مهاراتك.' },
            { icon: '📱', title: 'سهل الاستخدام', desc: 'واجهة بسيطة وعربية. لا تحتاج خبرة تقنية لنشر دورتك.' },
            { icon: '💳', title: 'دفع مباشر', desc: 'اقبل مدفوعات من طلابك مباشرة بأسعار تحددها أنت.' },
            { icon: '📊', title: 'تتبع تقدمك', desc: 'اعرف كم طالباً يتعلم معك واتابع إيراداتك من لوحة التحكم.' },
            { icon: '🤝', title: 'دعم مستمر', desc: 'فريقنا جاهز لمساعدتك في نشر دورتك الأولى.' },
          ].map((item) => (
            <div key={item.title} className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-6 border border-gray-100 dark:border-neutral-700">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section id="steps" className="py-16 px-4 bg-gray-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">خطوات نشر دورتك</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">
            من الصفر إلى أول دورة مدفوعة في 5 خطوات بسيطة
          </p>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-neutral-800 flex gap-5 items-start">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${colorMap[step.color]}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-gray-400">الخطوة {step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Drive Guide */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-3xl p-8 sm:p-12 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">📂</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">كيف ترفع فيديوهاتك على Google Drive؟</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">الطريقة الموصى بها لرفع دروسك بجودة عالية ومجاناً</p>
            </div>
          </div>
          <div className="space-y-4">
            {driveSteps.map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-blue-100 dark:border-neutral-700">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm font-semibold">
              💡 نصيحة: الفيديو الجيد لا يحتاج كاميرا احترافية. هاتفك يكفي — فقط تأكد من:
            </p>
            <ul className="mt-2 text-yellow-700 dark:text-yellow-400 text-sm space-y-1 list-disc list-inside">
              <li>إضاءة جيدة (قرب نافذة أو مصباح)</li>
              <li>خلفية مرتّبة ونظيفة</li>
              <li>صوت واضح (ابتعد عن الضوضاء)</li>
              <li>مدة الدرس بين 5-20 دقيقة</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Who can teach */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-neutral-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">من يمكنه التعليم؟</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">إذا كان لديك مهارة يريد الآخرون تعلّمها، فأنت مؤهل!</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              '🪡 الخياطة والتطريز', '🍳 الطبخ والحلويات', '🪵 النجارة والحرف الخشبية',
              '🎨 الرسم والخط العربي', '📱 التصميم والتقنية', '🌿 الزراعة المنزلية',
              '💆 الصحة واللياقة', '📸 التصوير والمونتاج', '🏺 الفخار والخزف',
              '🧶 الحياكة وصناعة السجاد', '💻 تعليم الكمبيوتر', '🌙 اللغات والتدريس',
            ].map((item) => (
              <div key={item} className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-100 dark:border-neutral-700 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">هل أنت مستعد لتحويل مهارتك إلى دخل؟</h2>
          <p className="text-blue-100 text-lg mb-8">
            انضم الآن مجاناً وابدأ بنشر دورتك الأولى خلال دقائق
          </p>
          <Link href="/register" className="inline-block bg-white text-blue-700 hover:bg-blue-50 font-bold text-lg px-10 py-4 rounded-full transition-colors shadow-lg">
            سجّل مجاناً وابدأ الكسب ←
          </Link>
          <p className="text-blue-200 text-sm mt-4">لا يلزم بطاقة ائتمانية · مجاني للأبد</p>
        </div>
      </section>

    </main>
  );
}
