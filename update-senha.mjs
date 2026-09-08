import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const hash = await bcrypt.hash("Lajinha1#", 12);
await prisma.user.update({ where: { email: "davi.moreira@dmstanatopraxia.com.br" }, data: { passwordHash: hash, mustChangePassword: false, status: "ACTIVE", sessionVersion: 1 } });
console.log("Senha atualizada!");
await prisma.$disconnect();
