// The purpose of this script is to seed the database with initial data.
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/// Creates a test user for testing and development purposes.
async function createTestUser() {
  const testBattleNetId = process.env.TEST_USER_BATTLENET_ID || "test-user-1";
  const testBattleNetTag = process.env.TEST_USER_BATTLENET_TAG || "TestUser#0001";

  const user = await prisma.user.upsert({
    where: { battleNetId: testBattleNetId },
    update: { battleNetTag: testBattleNetTag },
    create: {
      battleNetTag: testBattleNetTag,
      battleNetId: testBattleNetId,
      region: "EU",
    },
  });

  console.log(`Test user ready: ${user.id}`);
  return user;
}

async function seedExampleTasks(user) {
  await prisma.character.upsert({
    where: {
      userId_name_realm: { userId: user.id, name: "Aeloria", realm: "Silvermoon" },
    },
    update: {
      notes: "Alchemy alt; focus on weekly profession cooldowns.",
    },
    create: {
      userId: user.id,
      name: "Aeloria",
      realm: "Silvermoon",
      notes: "Alchemy alt; focus on weekly profession cooldowns.",
      tags: {
        create: [
          { tag: "Class: Mage" },
          { tag: "Race: Blood Elf" },
          { tag: "Profession: Alchemy" },
        ],
      },
    },
  });

  await prisma.character.upsert({
    where: {
      userId_name_realm: { userId: user.id, name: "Thorgar", realm: "Draenor" },
    },
    update: {
      notes: "Main raider; track weekly vault and crest upgrades.",
    },
    create: {
      userId: user.id,
      name: "Thorgar",
      realm: "Draenor",
      notes: "Main raider; track weekly vault and crest upgrades.",
      tags: {
        create: [
          { tag: "Class: Warrior" },
          { tag: "Race: Orc" },
          { tag: "Profession: Blacksmithing" },
        ],
      },
    },
  });

  await prisma.character.upsert({
    where: {
      userId_name_realm: { userId: user.id, name: "Lunara", realm: "Kazzak" },
    },
    update: {
      notes: "Gathering specialist; keep weekly profession routes current.",
    },
    create: {
      userId: user.id,
      name: "Lunara",
      realm: "Kazzak",
      notes: "Gathering specialist; keep weekly profession routes current.",
      tags: {
        create: [
          { tag: "Class: Druid" },
          { tag: "Race: Night Elf" },
          { tag: "Profession: Herbalism" },
        ],
      },
    },
  });

  const existingNames = new Set(
    (await prisma.task.findMany({
      where: { userId: user.id, name: { in: ["Weekly Vault", "Profession Cooldown"] } },
      select: { name: true },
    })).map((t) => t.name)
  );

  if (!existingNames.has("Weekly Vault")) {
    await prisma.task.create({
      data: {
        userId: user.id,
        name: "Weekly Vault",
        characterName: "Thorgar",
        characterRealm: "Draenor",
        description: "Complete 8 delves or dungeons to unlock best vault options.",
        tags: {
          create: [
            { tag: "urgent" },
            { tag: "account-wide" },
          ],
        },
        taskBoard: {
          create: {
            userId: user.id,
            active: true,
          },
        },
      },
    });
  }

  if (!existingNames.has("Profession Cooldown")) {
    await prisma.task.create({
      data: {
        userId: user.id,
        name: "Profession Cooldown",
        characterName: "Aeloria",
        characterRealm: "Silvermoon",
        description: "Use Alchemy weekly cooldown for high-value craft materials.",
        tags: {
          create: [
            { tag: "repeatable" },
            { tag: "Profession: Alchemy" },
          ],
        },
        taskBoard: {
          create: {
            userId: user.id,
            active: false,
          },
        },
      },
    });
  }

  console.log("Example characters and tasks are seeded.");
}

async function main() {
    if (process.env.NODE_ENV === "development") {
    const user = await createTestUser();
    await seedExampleTasks(user);
    }  
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
