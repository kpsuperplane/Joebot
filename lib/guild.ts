import { Guild, Prisma } from "@prisma/client";
import prisma from "../prisma/client";

export function connectOrCreateGuild(
  id: string
): Prisma.GuildCreateNestedOneWithoutEventsInput {
  return {
    connectOrCreate: {
      where: { id },
      create: { id },
    },
  };
}

export async function findOrCreateGuild(id: string): Promise<Guild> {
  const guild = await prisma.guild.findUnique({ where: { id } });
  if (guild != null) {
    return guild;
  }
  return await prisma.guild.create({ data: { id } });
}
