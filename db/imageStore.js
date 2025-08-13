// imageStore.js

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');

const store = new Store();
const mediaDir = path.join(app.getPath('userData'), 'images');

// Ensure directory exists
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir);
}

/**
 * Add an image to local store
 * @param {string} imagePath - Absolute path of image selected by user
 * @param {Object} metadata - Optional metadata (e.g. title, tags, etc.)
 * @returns {string} id - Unique ID of stored image
 */
function addImage(imagePath, metadata = {}) {
  const id = uuidv4();
  const ext = path.extname(imagePath);
  const destFileName = `${id}${ext}`;
  const destPath = path.join(mediaDir, destFileName);

  fs.copyFileSync(imagePath, destPath);

  const images = store.get('images') || [];
  images.push({
    id,
    fileName: destFileName,
    storedPath: destPath,
    metadata,
    createdAt: new Date().toISOString()
  });

  store.set('images', images);
  return id;
}

/**
 * Retrieve stored image by ID
 * @param {string} id - Unique ID of the image
 * @returns {Object|null} - Image object {id, storedPath, metadata, ...} or null if not found
 */
function getImageById(id) {
  const images = store.get('images') || [];
  const image = images.find(img => img.id === id);
  if (!image) return null;

  return {
    ...image,
    fileUrl: `file://${image.storedPath}` // For use in <img src="">
  };
}

/**
 * Delete image by ID
 * @param {string} id - Unique ID of the image
 * @returns {boolean} - true if deleted, false if not found
 */
function deleteImage(id) {
  let images = store.get('images') || [];
  const index = images.findIndex(img => img.id === id);
  if (index === -1) return false;

  const [image] = images.splice(index, 1);
  store.set('images', images);

  if (fs.existsSync(image.storedPath)) {
    fs.unlinkSync(image.storedPath); // Remove file from disk
  }

  return true;
}

/**
 * Replace image file and/or update metadata
 * @param {string} id - ID of image to replace
 * @param {string} [newImagePath] - Optional new file path
 * @param {Object} [newMetadata] - Optional new metadata
 * @returns {boolean} - true if updated, false if ID not found
 */
function replaceImage(id, newImagePath = null, newMetadata = null) {
  let images = store.get('images') || [];
  const index = images.findIndex(img => img.id === id);
  if (index === -1) return false;

  const oldImage = images[index];

  // Replace image file
  if (newImagePath) {
    const ext = path.extname(newImagePath);
    const newFileName = `${id}${ext}`;
    const newPath = path.join(mediaDir, newFileName);

    if (fs.existsSync(oldImage.storedPath)) {
      fs.unlinkSync(oldImage.storedPath);
    }

    fs.copyFileSync(newImagePath, newPath);
    oldImage.fileName = newFileName;
    oldImage.storedPath = newPath;
  }

  // Update metadata
  if (newMetadata) {
    oldImage.metadata = {
      ...oldImage.metadata,
      ...newMetadata
    };
  }

  images[index] = oldImage;
  store.set('images', images);
  return true;
}

// Export all
module.exports = {
  addImage,
  getImageById,
  deleteImage,
  replaceImage
};
