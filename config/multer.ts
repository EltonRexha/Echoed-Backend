import multer from 'multer';
import path from 'path';

const allowedImageTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const allowedVideoTypes = ['video/mp4'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '/tmp/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.')[1]
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB for videos (30s long)
  },
  fileFilter: (req, file, cb) => {
    if (
      allowedImageTypes.includes(file.mimetype) ||
      allowedVideoTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});
export default upload;
