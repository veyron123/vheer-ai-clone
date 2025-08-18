import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import axios from 'axios';

/**
 * Abstract Storage Provider Interface
 * Supports multiple storage backends: local, AWS S3, Cloudinary, etc.
 */
class StorageProvider {
  constructor(config = {}) {
    this.config = config;
    this.provider = config.provider || process.env.STORAGE_PROVIDER || 'local';
    
    console.log(`🗄️  Storage Provider: ${this.provider}`);
    
    // Initialize the specific provider
    this.initProvider();
  }

  initProvider() {
    switch (this.provider) {
      case 'aws':
        this.initAWS();
        break;
      case 'cloudinary':
        this.initCloudinary();
        break;
      case 'digitalocean':
        this.initDigitalOcean();
        break;
      default:
        this.initLocal();
    }
  }

  /**
   * LOCAL STORAGE IMPLEMENTATION
   */
  initLocal() {
    const uploadDirs = [
      'uploads/images/originals',
      'uploads/images/generated', 
      'uploads/images/thumbnails'
    ];

    uploadDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async uploadLocal(buffer, filename, type = 'generated') {
    const subDir = type === 'original' ? 'originals' : 'generated';
    const localPath = path.join('uploads', 'images', subDir, filename);
    const fullPath = path.resolve(localPath);

    fs.writeFileSync(fullPath, buffer);
    
    return {
      url: `${process.env.SERVER_URL || 'http://localhost:5000'}/${localPath.replace(/\\/g, '/')}`,
      path: localPath.replace(/\\/g, '/'),
      filename
    };
  }

  /**
   * AWS S3 IMPLEMENTATION
   */
  initAWS() {
    try {
      // Dynamic import for AWS SDK
      this.s3Client = null;
      this.bucketName = process.env.AWS_S3_BUCKET;
      this.region = process.env.AWS_REGION || 'us-east-1';
      
      console.log(`🟢 AWS S3 initialized: ${this.bucketName} (${this.region})`);
    } catch (error) {
      console.error('❌ Failed to initialize AWS S3:', error);
      throw error;
    }
  }

  async uploadAWS(buffer, filename, type = 'generated') {
    if (!this.s3Client) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      this.s3Client = new S3Client({ 
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
    }

    const key = `images/${type}/${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: this.getContentType(filename),
      ACL: 'public-read'
    });

    await this.s3Client.send(command);
    
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    
    return {
      url,
      path: key,
      filename
    };
  }

  /**
   * CLOUDINARY IMPLEMENTATION
   */
  initCloudinary() {
    try {
      this.cloudinary = null;
      this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      this.apiKey = process.env.CLOUDINARY_API_KEY;
      this.apiSecret = process.env.CLOUDINARY_API_SECRET;
      
      console.log(`🟢 Cloudinary initialized: ${this.cloudName}`);
    } catch (error) {
      console.error('❌ Failed to initialize Cloudinary:', error);
      throw error;
    }
  }

  async uploadCloudinary(buffer, filename, type = 'generated') {
    if (!this.cloudinary) {
      const cloudinary = await import('cloudinary');
      this.cloudinary = cloudinary.v2;
      
      this.cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret
      });
    }

    const folder = `vheer-ai/${type}`;
    const publicId = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          quality: 'auto:good',
          fetch_format: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              path: result.public_id,
              filename: result.original_filename
            });
          }
        }
      ).end(buffer);
    });
  }

  /**
   * DIGITALOCEAN SPACES IMPLEMENTATION (S3-Compatible)
   */
  initDigitalOcean() {
    try {
      this.spaceName = process.env.DO_SPACES_BUCKET;
      this.region = process.env.DO_SPACES_REGION || 'nyc3';
      this.endpoint = `https://${this.region}.digitaloceanspaces.com`;
      
      console.log(`🟢 DigitalOcean Spaces initialized: ${this.spaceName}`);
    } catch (error) {
      console.error('❌ Failed to initialize DigitalOcean Spaces:', error);
      throw error;
    }
  }

  async uploadDigitalOcean(buffer, filename, type = 'generated') {
    if (!this.s3Client) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      this.s3Client = new S3Client({
        region: this.region,
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: process.env.DO_SPACES_KEY,
          secretAccessKey: process.env.DO_SPACES_SECRET
        }
      });
    }

    const key = `images/${type}/${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: this.spaceName,
      Key: key,
      Body: buffer,
      ContentType: this.getContentType(filename),
      ACL: 'public-read'
    });

    await this.s3Client.send(command);
    
    const url = `https://${this.spaceName}.${this.region}.cdn.digitaloceanspaces.com/${key}`;
    
    return {
      url,
      path: key,
      filename
    };
  }

  /**
   * UNIVERSAL METHODS
   */
  async uploadImage(source, type = 'generated') {
    const filename = `${uuidv4()}.png`;
    let buffer;

    // Convert source to buffer
    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        // Base64 data with prefix
        const base64Data = source.replace(/^data:image\/[a-z]+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else if (source.startsWith('http')) {
        // URL - download first
        const response = await axios({
          method: 'GET',
          url: source,
          responseType: 'arraybuffer',
          timeout: 30000
        });
        buffer = Buffer.from(response.data);
      } else {
        // Assume it's base64 without prefix (raw base64 string)
        try {
          buffer = Buffer.from(source, 'base64');
        } catch (error) {
          throw new Error(`Invalid image source: ${error.message}`);
        }
      }
    } else {
      buffer = source; // Already a buffer
    }

    // Upload based on provider
    switch (this.provider) {
      case 'aws':
        return await this.uploadAWS(buffer, filename, type);
      case 'cloudinary':
        return await this.uploadCloudinary(buffer, filename, type);
      case 'digitalocean':
        return await this.uploadDigitalOcean(buffer, filename, type);
      default:
        return await this.uploadLocal(buffer, filename, type);
    }
  }

  async generateThumbnail(sourceUrl, width = 300, height = 300) {
    const filename = `thumb_${uuidv4()}.webp`;
    
    try {
      // Download original image
      const response = await axios({
        method: 'GET',
        url: sourceUrl,
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Create thumbnail
      const thumbnailBuffer = await sharp(Buffer.from(response.data))
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload thumbnail
      return await this.uploadImage(thumbnailBuffer, 'thumbnails');
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return original URL as fallback
      return { url: sourceUrl, path: '', filename: '' };
    }
  }

  async deleteImage(imagePath) {
    switch (this.provider) {
      case 'aws':
        return await this.deleteAWS(imagePath);
      case 'cloudinary':
        return await this.deleteCloudinary(imagePath);
      case 'digitalocean':
        return await this.deleteDigitalOcean(imagePath);
      default:
        return await this.deleteLocal(imagePath);
    }
  }

  async deleteLocal(imagePath) {
    try {
      const fullPath = path.resolve(imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted local file: ${imagePath}`);
      }
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
  }

  async deleteAWS(imagePath) {
    if (!this.s3Client) return;
    
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: imagePath
      });
      
      await this.s3Client.send(command);
      console.log(`Deleted S3 object: ${imagePath}`);
    } catch (error) {
      console.error('Error deleting S3 object:', error);
    }
  }

  async deleteCloudinary(imagePath) {
    if (!this.cloudinary) return;
    
    try {
      await this.cloudinary.uploader.destroy(imagePath);
      console.log(`Deleted Cloudinary image: ${imagePath}`);
    } catch (error) {
      console.error('Error deleting Cloudinary image:', error);
    }
  }

  async deleteDigitalOcean(imagePath) {
    // Same as AWS (S3-compatible)
    return await this.deleteAWS(imagePath);
  }

  getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    return types[ext] || 'image/png';
  }

  /**
   * Get storage provider info
   */
  getInfo() {
    return {
      provider: this.provider,
      config: {
        aws: this.provider === 'aws' ? { bucket: this.bucketName, region: this.region } : null,
        cloudinary: this.provider === 'cloudinary' ? { cloudName: this.cloudName } : null,
        digitalocean: this.provider === 'digitalocean' ? { space: this.spaceName, region: this.region } : null,
        local: this.provider === 'local' ? { path: 'uploads/images' } : null
      }
    };
  }
}

// Singleton instance
let storageProvider = null;

export function getStorageProvider(config = {}) {
  if (!storageProvider) {
    storageProvider = new StorageProvider(config);
  }
  return storageProvider;
}

export default StorageProvider;