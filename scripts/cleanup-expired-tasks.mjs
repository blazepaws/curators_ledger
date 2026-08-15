import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const expiredTasks = await prisma.task.findMany({
	where: { deadline: { lt: new Date() } },
	select: { id: true },
})

for (const task of expiredTasks) {
	await prisma.$transaction([
		prisma.taskTag.deleteMany({ where: { taskId: task.id } }),
		prisma.taskBoard.deleteMany({ where: { taskId: task.id } }),
		prisma.task.delete({ where: { id: task.id } }),
	])
}

console.log(`Deleted ${expiredTasks.length} expired deadline task(s).`)
await prisma.$disconnect()
