const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('بدء إعداد البيانات الأساسية...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@maharat-syria.com' },
    update: {},
    create: {
      name: 'مدير المنصة',
      email: 'admin@maharat-syria.com',
      password: hashedPassword,
      role: 'admin',
      bio: 'مدير منصة مهاراتنا',
    },
  });

  console.log(`تم إنشاء حساب المدير: ${admin.email}`);
  console.log('كلمة المرور: admin123');
  console.log('⚠️ يرجى تغيير كلمة المرور بعد تسجيل الدخول!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
