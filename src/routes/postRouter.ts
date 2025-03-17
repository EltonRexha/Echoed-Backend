import { Router } from 'express';
import localUserAuthenticated from '../middlewares/localUserAuthenticated';
import { createPost, uploadPostImage, uploadPostVideo } from '../controllers/postController';

const router = Router();

router.post('/', localUserAuthenticated, createPost);
router.post('/:postId/images', localUserAuthenticated, uploadPostImage);
router.post('/:postId/videos', localUserAuthenticated, uploadPostVideo);

export default router;
