# تعليمات نشر منصة مهاراتنا

## المتطلبات الأساسية

قبل النشر، تحتاج إلى إعداد الخدمات التالية:

### 1. قاعدة بيانات MySQL (مطلوب)
يمكنك استخدام أحد هذه الخيارات المجانية/الرخيصة:

**الخيار أ: PlanetScale (مجاني)**
1. سجل في https://planetscale.com
2. أنشئ قاعدة بيانات جديدة
3. اذهب إلى Settings > Passwords وأنشئ كلمة مرور
4. انسخ رابط الاتصال (Connection String)

**الخيار ب: Railway (مجاني مع حدود)**
1. سجل في https://railway.app
2. أنشئ خدمة MySQL جديدة
3. انسخ رابط الاتصال من Variables

**الخيار ج: Aiven (مجاني)**
1. سجل في https://aiven.io
2. أنشئ خدمة MySQL مجانية
3. انسخ رابط الاتصال

### 2. مفتاح JWT السري (مطلوب)
قم بتوليد مفتاح عشوائي:
```bash
openssl rand -base64 32
```
أو استخدم أي موقع لتوليد سلسلة عشوائية طويلة.

### 3. إعدادات البريد الإلكتروني SMTP (اختياري - لإعادة تعيين كلمة المرور)

**استخدام Gmail:**
1. اذهب لإعدادات حساب Google > الأمان
2. فعّل المصادقة الثنائية (إن لم تكن مفعلة)
3. أنشئ "كلمة مرور تطبيق" (App Password):
   - اذهب إلى https://myaccount.google.com/apppasswords
   - اختر "بريد" و "أخرى" واكتب "مهاراتنا"
   - انسخ كلمة المرور المكونة من 16 حرفاً
4. استخدم:
   - SMTP_HOST=smtp.gmail.com
   - SMTP_PORT=587
   - SMTP_USER=your-email@gmail.com
   - SMTP_PASS=كلمة مرور التطبيق

## الخطوة 1: إعداد قاعدة البيانات

بعد الحصول على رابط قاعدة البيانات:

```bash
# انسخ ملف البيئة
cp .env.example .env

# عدّل ملف .env وأضف رابط قاعدة البيانات
# DATABASE_URL="mysql://..."

# شغّل الترحيل لإنشاء الجداول
npx prisma db push

# (اختياري) أنشئ حساب أدمن
npx prisma db seed
```

## الخطوة 2: إنشاء مستودع GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/maharatna-platform.git
git branch -M main
git push -u origin main
```

## الخطوة 3: النشر على Vercel (الأسهل لـ Next.js)

1. سجل في https://vercel.com
2. انقر "Add New" > "Project"
3. اربط حساب GitHub واختر المستودع
4. في Environment Variables أضف:
   - `DATABASE_URL` = رابط قاعدة البيانات
   - `JWT_SECRET` = المفتاح السري
   - `NEXT_PUBLIC_APP_URL` = https://your-domain.vercel.app
   - `SMTP_HOST` = smtp.gmail.com (اختياري)
   - `SMTP_PORT` = 587 (اختياري)
   - `SMTP_USER` = بريدك الإلكتروني (اختياري)
   - `SMTP_PASS` = كلمة مرور التطبيق (اختياري)
5. انقر "Deploy"

### ربط الدومين المخصص على Vercel:
1. اذهب إلى Settings > Domains
2. أضف `maharat-syria.com`
3. حدّث DNS Records حسب التعليمات المعروضة

## الخطوة 3 (بديل): النشر على Netlify

1. سجل في https://netlify.com
2. أضف موقع جديد من GitHub
3. أضف نفس المتغيرات البيئية
4. تأكد من تثبيت: `npm install @netlify/plugin-nextjs`
5. انقر Deploy

## الخطوة 4: إنشاء حساب أدمن

بعد النشر، أنشئ حساب عادي من صفحة التسجيل ثم عدّل الدور من قاعدة البيانات:

```sql
UPDATE User SET role = 'admin' WHERE email = 'your-email@example.com';
```

أو من Prisma Studio:
```bash
npx prisma studio
```

## ملاحظات هامة

- تأكد من أن كل المتغيرات البيئية مضافة قبل النشر
- عند تحديث الكود، فقط ادفع التغييرات لـ GitHub وسيتم النشر تلقائياً
- HTTPS يُفعّل تلقائياً على Vercel و Netlify
- انتشار DNS قد يستغرق حتى 48 ساعة
