'use strict';

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { BadRequestError } = require('../core/error.response');

class ImageService {
  constructor() {
    this.R2 = new AWS.S3({
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: 'auto',
      signatureVersion: 'v4',
    });
    this.bucketName = process.env.R2_APP_BUCKET;
    this.baseUrl = process.env.R2_APP_URL;
  }

  async uploadAvatar(userId, file) {
    try {
      // Validate file type
      const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestError(
          'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestError('File size too large. Maximum size is 5MB.');
      }

      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const fileName = `${userId}_${uuidv4()}.${fileExtension}`;
      const key = `avatars/${fileName}`;

      // Upload to R2
      const uploadResult = await this.R2.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make publicly accessible
      }).promise();

      // Return the public URL
      const avatarUrl = `${this.baseUrl}/${key}`;
      return {
        success: true,
        avatarUrl,
        key,
      };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('Avatar upload error:', error);
      throw new BadRequestError('Failed to upload avatar. Please try again.');
    }
  }

  async deleteAvatar(avatarUrl) {
    try {
      if (!avatarUrl || !avatarUrl.includes(this.baseUrl)) {
        return { success: true }; // Nothing to delete or not our URL
      }

      // Extract key from URL
      const key = avatarUrl.replace(`${this.baseUrl}/`, '');

      await this.R2.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();

      return { success: true };
    } catch (error) {
      console.error('Avatar deletion error:', error);
      // Don't throw error for deletion failures to avoid blocking user updates
      return { success: false, error: error.message };
    }
  }

  async uploadThumbnail(postId, file) {
    try {
      // Validate file type
      const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestError(
          'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
        );
      }

      // Validate file size (max 10MB for thumbnails)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new BadRequestError('File size too large. Maximum size is 10MB.');
      }

      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const fileName = `${postId}_${uuidv4()}.${fileExtension}`;
      const key = `thumbnails/${fileName}`;

      // Upload to R2
      const uploadResult = await this.R2.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make publicly accessible
      }).promise();

      // Return the public URL
      const thumbnailUrl = `${this.baseUrl}/${key}`;
      return {
        success: true,
        avatarUrl: thumbnailUrl, // Keep consistent interface
        key,
      };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('Thumbnail upload error:', error);
      throw new BadRequestError(
        'Failed to upload thumbnail. Please try again.'
      );
    }
  }
}

module.exports = new ImageService();
