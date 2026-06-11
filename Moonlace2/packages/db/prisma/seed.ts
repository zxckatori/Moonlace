import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "synthwave", name: "Synthwave", description: "Музыка, арт, эстетика synthwave", sortOrder: 1 },
  { slug: "darkwave", name: "Darkwave", description: "Dark wave, gothic, coldwave", sortOrder: 2 },
  { slug: "anime", name: "Anime", description: "Аниме, манга, косплей", sortOrder: 3 },
  { slug: "music", name: "Music", description: "Музыка всех жанров, плейлисты, релизы", sortOrder: 4 },
  { slug: "tech", name: "Tech", description: "Железо, софт, setup, периферия", sortOrder: 5 },
  { slug: "offtopic", name: "Offtopic", description: "Всё остальное", sortOrder: 6 },
];

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
  }

  const passwordHash = await argon2.hash("moonlace123");
  const admin = await prisma.user.upsert({
    where: { login: "admin" },
    update: {},
    create: {
      login: "admin",
      nickname: "Moonlace",
      email: "admin@moonlace.local",
      passwordHash,
      status: "Signal operator",
      profile: {
        create: {
          country: "Russia",
          city: "Moscow",
          timezone: "Europe/Moscow",
          privacySettings: {
            guestbook: "all",
            showLogin: false,
            showSetup: true,
            showListening: true,
          },
        },
      },
    },
  });

  console.log(`Seeded ${CATEGORIES.length} categories and admin user: ${admin.nickname}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
