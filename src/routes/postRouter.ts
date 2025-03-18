import { Router } from 'express';
import localUserAuthenticated from '../middlewares/localUserAuthenticated';
import { commentPost, createPost, likePost, uploadPostImage, uploadPostVideo } from '../controllers/postController';

const router = Router();

router.post('/', localUserAuthenticated, createPost);
router.post('/:postId/images', localUserAuthenticated, uploadPostImage);
router.post('/:postId/videos', localUserAuthenticated, uploadPostVideo);
router.post('/:postId/like', localUserAuthenticated, likePost);
router.post('/:postId/comment', localUserAuthenticated, commentPost)

export default router;
