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
    cb(null, path.join(__dirname, '../..', '/tmp/uploads'));
  },
  filename: function (req, file, cb) {
    const splitDotFile = file.originalname.split('.');
    const fileExtension = splitDotFile[splitDotFile.length - 1];
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileExtension);
  },
});

const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only videos are allowed.'));
    }
  },
});

export { videoUpload, imageUpload };
