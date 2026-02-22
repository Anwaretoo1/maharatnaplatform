# إعداد Vercel - متغيرات البيئة المطلوبة

## 🔧 خطوات إضافة متغيرات البيئة إلى Vercel

### 1. افتح لوحة تحكم Vercel
👉 https://vercel.com/dashboard

### 2. اختر مشروع "maharatnaplatform"

### 3. اذهب إلى Settings → Environment Variables

### 4. أضف المتغيرات التالية:

#### قاعدة البيانات (Railway MySQL)
```
DATABASE_URL = [استخدم البيانات من Railway داشبورد]
```

#### Cloudinary (لرفع الصور والفيديو) ⭐ **مهم جداً**
```
CLOUDINARY_CLOUD_NAME = [احصل عليها من Cloudinary console]
CLOUDINARY_API_KEY = [احصل عليها من Cloudinary console]
CLOUDINARY_API_SECRET = [احصل عليها من Cloudinary console]
```

#### JWT (للمصادقة)
```
JWT_SECRET = [استخدم قيمة عشوائية طويلة: openssl rand -base64 32]
```

#### SMTP (البريد الإلكتروني)
```
SMTP_HOST = smtp.sendgrid.net
SMTP_PORT = 587
SMTP_USER = apikey
SMTP_PASS = [استخدم مفتاح SendGrid من الإعدادات]
```

#### Stripe (الدفع)
```
STRIPE_SECRET_KEY = [احصل عليها من Stripe dashboard - Secret Keys]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [احصل عليها من Stripe dashboard - Publishable Keys]
STRIPE_WEBHOOK_SECRET = [اختياري - لـ webhooks]
```

#### App URL (للإنتاج)
```
NEXT_PUBLIC_APP_URL = https://maharatnaplatform.vercel.app
```

### 5. انقر "Save"

### 6. انقر "Redeploy" لإعادة نشر المشروع بالمتغيرات الجديدة

---

## ✅ التحقق من النجاح

بعد إضافة المتغيرات وإعادة النشر، يجب أن تعمل:

- ✅ رفع الصور في ملف المستخدم الشخصي
- ✅ رفع الفيديو والصور في الدورات
- ✅ إضافة محتوى الدورات
- ✅ صور الخصومات والدورات

---

## 🚀 الميزات المطبقة

### 1. **نظام الخصومات**
- إنشاء خصومات عامة (من المسؤول)
- خصومات خاصة بالدورة (من المعلم)
- عرض السعر الأصلي والمخفض
- شارات تحديث الخصم

### 2. **الرسائل الجماعية (Broadcast)**
- إرسال رسالة لجميع المستخدمين
- إرسال لجميع الطلاب فقط
- إرسال لجميع المعلمين فقط
- عرض عدد المستقبلين

### 3. **إدارة الملف الشخصي**
- صورة شخصية قابلة للتحديث
- نبذة شخصية (Bio)
- تعديل الاسم

### 4. **تحويل التبرعات**
- زر "تواصل مع الإدارة" بدلاً من البريد الإلكتروني
- تحويل آلي إلى صفحة الرسائل
- رسائل مسبقة الصيغة حسب نوع التبرع

---

## ⚠️ ملاحظات مهمة

- **لا تشارك بيانات Cloudinary API مع الآخرين** - هذه بيانات حساسة
- **متغيرات البيئة على Vercel آمنة** - لا تُرسل إلى المتصفح (إلا NEXT_PUBLIC_)
- **بعد إضافة متغيرات جديدة = دائماً أعد النشر يدويّاً** من صفحة Deployments

---

## 🆘 استكشاف الأخطاء

إذا استمرت الأخطاء:

1. تحقق من أن جميع المتغيرات مضافة بالضبط (بدون مسافات إضافية)
2. أعد النشر من Vercel Dashboard (Redeploy)
3. افسح ذاكرة التخزين المؤقت: `Ctrl+Shift+Delete` ثم `Ctrl+R`
4. تحقق من رسائل الخطأ في Vercel Logs
