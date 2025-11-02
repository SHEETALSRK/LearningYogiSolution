const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class S3Service {
  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
  }

  async uploadFile(file) {
    const fileId = uuidv4();
    const key = `timetables/${fileId}-${file.originalname}`;

    if (process.env.USE_LOCAL_STORAGE === 'true') {
      // Save file locally
      const localDir = path.join(__dirname, '../../local_uploads');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localPath = path.join(localDir, `${fileId}-${file.originalname}`);
      fs.writeFileSync(localPath, file.buffer);
      return {
        fileId,
        key: localPath,
        location: localPath,
      };
    } else {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      try {
        await s3Client.send(command);
        return {
          fileId,
          key,
          location: `s3://${this.bucketName}/${key}`,
        };
      } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
      }
    }
  }

  async getSignedUrl(key) {
    if (process.env.USE_LOCAL_STORAGE === 'true') {
      // Return local file path as URL (for dev only)
      return `file://${key}`;
    } else {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
      } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
      }
    }
  }
}

module.exports = new S3Service();