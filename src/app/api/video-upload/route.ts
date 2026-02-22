import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Storage } from '@google-cloud/storage';

// إعداد Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE || undefined,
  credentials: process.env.GCP_CREDENTIALS 
    ? JSON.parse(process.env.GCP_CREDENTIALS)
    : undefined,
});

const bucketName = process.env.GCP_BUCKET_NAME || 'maharatna-videos';
const bucket = storage.bucket(bucketName);

// الحد الأقصى لحجم الفيديو
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 });
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'يجب أن يكون الملف فيديو' }, { status: 400 });
    }

    // التحقق من الحجم
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'حجم الفيديو يجب أن يكون أقل من 500MB' }, { status: 400 });
    }

    // اسم الملف الفريد
    const timestamp = Date.now();
    const fileName = `videos/${session.user.id}/${timestamp}-${file.name}`;

    // إنشاء ملف في Google Cloud Storage
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const gcsFile = bucket.file(fileName);

    // رفع الملف
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
      public: true,
    });

    // الحصول على URL عام
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      type: 'video',
      uploadedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Video upload error:', error);
    return NextResponse.json({
      error: error.message || 'حدث خطأ أثناء رفع الفيديو',
    }, { status: 500 });
  }
}
