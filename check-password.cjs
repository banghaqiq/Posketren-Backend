
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const username = 'ulilalbab';

  const operator = await prisma.operator.findUnique({
    where: { username },
  });

  if (!operator) {
    console.log('AKUN TIDAK DITEMUKAN');
    return;
  }

  const password = 'haqiq';

  const result = await bcrypt.compare(
    password.trim(),
    operator.password_hash,
  );

  console.log('Username ditemukan:', true);
  console.log('Password cocok:', result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
