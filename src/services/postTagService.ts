import { prisma } from '../db/client';

export namespace postTagsService {
  export async function createPostTag(tagName: string) {
    const tag = await prisma.postTags.create({
      data: {
        name: tagName,
      },
    });

    return tag;
  }

  export async function postTagExists(tagName: string) {
    return !!(await prisma.postTags.findUnique({
      where: {
        name: tagName,
      },
    }));
  }
}
