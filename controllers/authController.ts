import { Request, Response } from 'express';
import { prisma } from '../db/client';

export async function getUser(req: Request, res: Response): Promise<void> {
  const params = req.query;
  const username = params.username as string | undefined;
  const email = params.email as string | undefined;
  const id = params.id as string | undefined;

  if(username === undefined && email === undefined && id === undefined){
    res.json([])
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      username: username,
      email: email,
      id: id,
    },
    select: {
      email: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  });

  res.json(users);
}
