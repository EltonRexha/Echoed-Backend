import { Router } from 'express';
import localUserAuthenticated from '../middlewares/localUserAuthenticated';
import { createPost, uploadPostImage } from '../controllers/postController';

const router = Router();

router.post('/', localUserAuthenticated, createPost);
router.post('/:postId/image', localUserAuthenticated, uploadPostImage);

export default router;
