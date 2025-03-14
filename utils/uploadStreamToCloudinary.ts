import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

const uploadStreamToCloudinary = (buffer: Buffer, options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Create a stream from the buffer
    const stream = Readable.from(buffer);

    // Create an upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Pipe the buffer stream to the upload stream
    stream.pipe(uploadStream);
  });
};

export default uploadStreamToCloudinary;
