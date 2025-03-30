/**
 * Uses ABAC strategy to tell if a subject can access resource
 */

import { Post, postComment, Roles, User } from '@prisma/client';
import { userService } from '../services/userService';
const {UserIsBlocked} = userService;

type Resources = {
  Posts: {
    resource: Post;
    actions:
      | 'create'
      | 'read'
      | 'update'
      | 'delete'
      | 'like'
      | 'save'
      | 'comment'
      | 'repost';
  };
  Comment: {
    resource: postComment;
    actions:
      | 'create'
      | 'read'
      | 'update'
      | 'delete'
      | 'like'
      | 'comment'
      | 'save';
  };
};

type cbPermission<Resource> = (
  user: User,
  resource: Resource
) => boolean | Promise<boolean>;

type permissionRoles = {
  [role in Roles]: {
    [resource in keyof Resources]: {
      [action in Resources[resource]['actions']]:
        | boolean
        | cbPermission<Resources[resource]['resource']>;
    };
  };
};

const rolesWithPermission: permissionRoles = {
  admin: {
    Posts: {
      like: true,
      create: true,
      read: true,
      update: true,
      delete: true,
      comment: true,
      repost: true,
      save: true,
    },
    Comment: {
      like: true,
      create: true,
      read: true,
      update: true,
      delete: true,
      comment: true,
      save: true,
    },
  },
  moderator: {
    Posts: {
      like: true,
      create: true,
      read: true,
      update: true,
      delete: true,
      comment: true,
      repost: true,
      save: true,
    },
    Comment: {
      like: true,
      create: true,
      read: true,
      update: true,
      delete: true,
      comment: true,
      save: true,
    },
  },
  user: {
    Posts: {
      create: true,
      save: async (user, post) => {
        return !(await UserIsBlocked(user.id, post.userId));
      },
      comment: async (user, post) => {
        return !(await UserIsBlocked(user.id, post.userId));
      },
      like: async (user, post) => {
        return !(await UserIsBlocked(user.id, post.userId));
      },
      read: async (user, post) => {
        return !(await UserIsBlocked(user.id, post.userId));
      },
      repost: async (user, post) => {
        return !(await UserIsBlocked(user.id, post.userId));
      },
      delete: (user, post) => user.id === post.userId,
      update: (user, post) => user.id === post.userId,
    },
    Comment: {
      create: true,
      like: async (user, comment) => {
        return !(await UserIsBlocked(user.id, comment.authorId));
      },
      read: async (user, comment) => {
        return !(await UserIsBlocked(user.id, comment.authorId));
      },
      update: async (user, comment) => {
        return user.id === comment.authorId;
      },
      delete: async (user, comment) => {
        return user.id === comment.authorId;
      },
      save: async (user, comment) => {
        return !(await UserIsBlocked(user.id, comment.authorId));
      },
      comment: async (user, comment) => {
        return !(await UserIsBlocked(user.id, comment.authorId));
      },
    },
  },
};

/**
 *
 * Checks if subject has permissions to resource
 * Through the ABAC strategy of handling permissions
 *
 * @param user The local user (subject in ABAC)
 * @param resource The resource
 * @param action  One of the actions allowed for the resource
 * @param resourceName The resource name (has to be the same as the name of Resource)
 * @returns boolean
 */
async function hasPermission<resource extends keyof Resources>(
  user: User,
  resource: Resources[resource]['resource'] | null,
  action: Resources[resource]['actions'],
  resourceName: resource
) {
  const roles = user.Roles;

  const resolvedRoles = await Promise.all(
    roles.map(async (role) => {
      const rolesResource = rolesWithPermission[role][resourceName];
      const roleAction = rolesResource[action];
      if (typeof roleAction === 'boolean') {
        return roleAction;
      }

      if(!resource){
        throw new Error('Resource must be provided in this case');
      }

      const canAccess = roleAction(user, resource);
      if (canAccess instanceof Promise) {
        return await canAccess;
      }

      return canAccess;
    })
  );

  return resolvedRoles.find((role) => role);
}

export default hasPermission;
