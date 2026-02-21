import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';

// الحد الأقصى لحجم الملفات
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== 'craftsman' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'غير مصرح - يجب أن تكون حرفياً أو مسؤولاً' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' | 'video'

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 });
    }

    // التحقق من نوع الملف
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح فقط بالصور والفيديوهات' }, { status: 400 });
    }

    // التحقق من حجم الملف
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'حجم الصورة يجب أن يكون أقل من 10MB' }, { status: 400 });
    }
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'حجم الفيديو يجب أن يكون أقل من 100MB' }, { status: 400 });
    }

    // تحويل الملف إلى Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // رفع إلى Cloudinary
    const resourceType = isVideo ? 'video' : 'image';
    const folder = `maharatna/${session.user.id}/${resourceType}s`;

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder,
          transformation: isImage ? [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ] : [
            { quality: 'auto' }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      type: resourceType,
      size: file.size,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration || null,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
  }
}
