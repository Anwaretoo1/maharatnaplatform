# منصة مهاراتنا - Maharatna Platform

منصة تعليمية متقدمة لتوثيق ونقل الحرف التقليدية السورية

## 🌟 الميزات الرئيسية

### ✅ المطبقة في الآونة الأخيرة
- **نظام الخصومات** - خصومات عامة وخاصة بالدورات
- **الرسائل الجماعية (Broadcast)** - إرسال لجميع/طلاب/معلمين
- **إدارة الملف الشخصي** - صورة + نبذة شخصية
- **رفع الصور والفيديو** - عبر Cloudinary
- **نظام الدفع** - Stripe integration
- **التبرعات** - تحويل آلي للرسائل مع الإدارة

---

## 🚀 البدء السريع

### المتطلبات
- Node.js 18+
- MySQL/MariaDB
- حساب Cloudinary
- مفتاح Stripe (اختياري)

### التثبيت

```bash
# انسخ المستودع
git clone https://github.com/Anwaretoo1/maharatnaplatform.git
cd maharatnaplatform

# ثبت المكتبات
npm install

# أنشئ ملف .env (انسخ من .env.example)
cp .env.example .env

# وملأ البيانات المطلوبة في .env
```

### التطوير المحلي

```bash
npm run dev
```

ثم افتح http://localhost:3000

---

## 📋 إعداد Vercel

⚠️ **مهم جداً**: بعد الدفع إلى GitHub، يجب إضافة متغيرات البيئة إلى Vercel

👉 اقرأ [VERCEL_SETUP.md](./VERCEL_SETUP.md) للتعليمات المفصلة

### الخطوات السريعة:
1. افتح https://vercel.com/dashboard
2. Settings → Environment Variables
3. أضف:
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY` (إذا كنت تستخدم الدفع)
4. انقر Redeploy

---

## 👥 الحسابات التجريبية

| الدور | البريد | كلمة المرور |
|------|-------|-----------|
| مسؤول | admin@maharat-syria.com | admin123 |
| معلم (مثال) | instructor@example.com | password |
| طالب (مثال) | learner@example.com | password |

---

## 📁 هيكل المشروع

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── upload/       # رفع الملفات إلى Cloudinary
│   │   ├── discounts/    # إدارة الخصومات
│   │   ├── profile/      # الملف الشخصي
│   │   ├── messages/     # الرسائل والبث الجماعي
│   │   └── ...
│   ├── dashboard/        # لوحة التحكم
│   │   ├── admin/        # لوحة المسؤول
│   │   ├── instructor/    # لوحة المعلم
│   │   ├── learner/      # صفحة الطالب
│   │   └── profile/      # الملف الشخصي
│   ├── courses/          # صفحات الدورات
│   └── ...
├── lib/
│   ├── auth.ts          # المصادقة
│   ├── cloudinary.ts    # Cloudinary client
│   ├── prisma.ts        # Prisma ORM
│   └── ...
└── prisma/
    └── schema.prisma    # نموذج قاعدة البيانات
```

---

## 🔧 التكنولوجيات المستخدمة

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: MySQL (Railway)
- **ORM**: Prisma
- **Authentication**: JWT + Cookies
- **File Upload**: Cloudinary
- **Payment**: Stripe
- **Email**: SendGrid SMTP

---

## 📖 وثائق إضافية

- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - إعداد متغيرات Vercel
- [deployment_instructions.md](./deployment_instructions.md) - تعليمات النشر
- [Prisma Schema](./prisma/schema.prisma) - نموذج البيانات

---

## 🐛 استكشاف الأخطاء

### مشكلة: فشل رفع الصور
**السبب**: متغيرات Cloudinary غير مضافة إلى Vercel
**الحل**: اقرأ [VERCEL_SETUP.md](./VERCEL_SETUP.md)

### مشكلة: خطأ قاعدة البيانات  
**السبب**: `DATABASE_URL` غير صحيح أو غير موجود
**الحل**: تحقق من `.env` و Vercel Environment Variables

### مشكلة: Stripe لا يعمل
**السبب**: مفاتيح Stripe غير مضافة
**الحل**: أضف `STRIPE_SECRET_KEY` و `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## 📞 الدعم والمساعدة

للمزيد من الأسئلة، راجع:
- [VERCEL_SETUP.md](./VERCEL_SETUP.md)
- [deployment_instructions.md](./deployment_instructions.md)
- GitHub Issues

---

© 2026 منصة مهاراتنا - جميع الحقوق محفوظة
