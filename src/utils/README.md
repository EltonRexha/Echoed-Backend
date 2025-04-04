# Utility Functions

This directory contains utility functions and patterns used throughout the codebase.

## Post Query Patterns

The `postQueryPatterns.ts` file provides standardized Prisma query patterns for post-related queries. Using these patterns across your code ensures consistency in the data structure returned by different queries.

### Available Patterns

#### `POST_FULL_INCLUDE`

A comprehensive include pattern for when you need complete post data including:

- Post tags
- Author info with profile image
- Repost counts
- Comment counts
- Like counts
- Save counts
- Media attachments
- Main post (for reposts)

```typescript
import { POST_FULL_INCLUDE } from '../utils/postQueryPatterns';

const posts = await prisma.post.findMany({
  // ...query options
  include: POST_FULL_INCLUDE,
});
```

#### `POST_BASIC_INCLUDE`

A simplified include pattern for when you only need basic post data:

- Post tags
- Basic author info with profile image
- Media attachments

```typescript
import { POST_BASIC_INCLUDE } from '../utils/postQueryPatterns';

const posts = await prisma.post.findMany({
  // ...query options
  include: POST_BASIC_INCLUDE,
});
```

#### `POST_TRENDING_ORDER_BY`

A standard ordering pattern for trending posts based on engagement metrics:

- Likes (descending)
- Saves (descending)
- Reposts (descending)
- Comments (descending)

```typescript
import { POST_TRENDING_ORDER_BY } from '../utils/postQueryPatterns';

const trendingPosts = await prisma.post.findMany({
  // ...query options
  orderBy: POST_TRENDING_ORDER_BY,
});
```

### Best Practices

1. Always use these patterns instead of creating your own include/orderBy patterns
2. If you need to modify the patterns, update the utility file so all queries benefit
3. If you need a custom pattern that's used in multiple places, consider adding it to the utility file
