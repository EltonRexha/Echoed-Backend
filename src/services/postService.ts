import { prisma } from '../db/client';

export default new (class {
  async getPosts({
    postId,
    authorId,
    authorUsername,
    authorEmail,
    likedByUserId,
    savedByUserId,
    page = 1,
    limit = 10,
  }: {
    postId?: string;
    authorId?: string;
    authorUsername?: string;
    authorEmail?: string;
    likedByUserId?: string;
    savedByUserId?: string;
    page?: number;
    limit?: number;
  }) {
    const skip = (page - 1) * limit;
    const posts = await prisma.post.findMany({
      where: {
        ...(postId && { id: postId }),
        ...((authorId || authorEmail || authorUsername) && {
          author: {
            id: authorId,
            email: authorEmail,
            username: authorUsername,
          },
        }),
        ...(likedByUserId && {
          likedBy: {
            some: {
              id: likedByUserId,
            },
          },
        }),
        ...(savedByUserId && {
          savedBy: {
            some: {
              id: savedByUserId,
            },
          },
        }),
      },
      skip,
      take: limit,
    });

    return posts;
  }
})();
