/**
 * Uses ABAC strategy to tell if a subject can access resource
 */

import { Post, Roles, User } from '@prisma/client';
import UserIsBlocked from './UserIsBlocked';

type Resources = {
  Posts: {
    resource: Post;
    actions: 'create' | 'read' | 'update' | 'delete' | 'like' | 'comment' | 'repost';
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

const rolesWithPermission = {
  admin: {
    Posts: {
      like: true,
      create: true,
      read: true,
      update: true,
      delete: true,
      comment: true,
      repost: true,
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
    },
  },
  user: {
    Posts: {
      create: true,
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
  },
} satisfies permissionRoles;

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
  resource: Resources[resource]['resource'],
  action: Resources[resource]['actions'],
  resourceName: resource
) {
  const roles = user.Role;

  const resolvedRoles = await Promise.all(
    roles.map(async (role) => {
      const rolesResource = rolesWithPermission[role][resourceName];
      const roleAction = rolesResource[action];
      if (typeof roleAction === 'boolean') {
        return roleAction;
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
