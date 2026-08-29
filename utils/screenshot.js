/**
 * Agentation Feedback — Screenshot Module
 * Captures element screenshots via background service worker + canvas cropping
 */
(function () {
  'use strict';

  window.AgentationFeedback = window.AgentationFeedback || {};

  /** Maximum thumbnail width in pixels */
  const MAX_WIDTH = 400;

  /** JPEG compression quality (0-1) */
  const JPEG_QUALITY = 0.7;

  /**
   * Capture a screenshot of a specific DOM element
   * 
   * Flow:
   * 1. Get element bounding rect
   * 2. Request full-tab screenshot from background service worker
   * 3. Crop the screenshot to the element bounds using canvas
   * 4. Scale down to MAX_WIDTH and compress as JPEG
   * 
   * @param {Element} element - The DOM element to capture
   * @returns {Promise<string>} Base64 JPEG data URL of the element screenshot
   */
  async function captureElement(element) {
    if (!element) {
      throw new Error('No element provided for screenshot');
    }

    try {
      // Get element position relative to viewport
      const rect = element.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        return '';
      }

      // Account for device pixel ratio
      const dpr = window.devicePixelRatio || 1;

      // Request tab screenshot from background
      const screenshotDataUrl = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'captureTab' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.dataUrl) {
            resolve(response.dataUrl);
          } else {
            reject(new Error('Failed to capture tab screenshot'));
          }
        });
      });

      // Load the full screenshot into an image
      const img = await loadImage(screenshotDataUrl);

      // Calculate crop area (account for DPR)
      const cropX = Math.max(0, Math.round(rect.left * dpr));
      const cropY = Math.max(0, Math.round(rect.top * dpr));
      const cropW = Math.min(Math.round(rect.width * dpr), img.width - cropX);
      const cropH = Math.min(Math.round(rect.height * dpr), img.height - cropY);

      if (cropW <= 0 || cropH <= 0) {
        return '';
      }

      // Calculate output dimensions (scale down if wider than MAX_WIDTH)
      let outW = cropW / dpr;
      let outH = cropH / dpr;

      if (outW > MAX_WIDTH) {
        const scale = MAX_WIDTH / outW;
        outW = MAX_WIDTH;
        outH = Math.round(outH * scale);
      }

      // Crop and resize using canvas
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,  // source crop
        0, 0, outW, outH              // destination
      );

      // Export as compressed JPEG
      return canvas.toDataURL('image/jpeg', JPEG_QUALITY);

    } catch (err) {
      console.warn('[Agentation Feedback] Screenshot capture failed:', err.message);
      return '';
    }
  }

  /**
   * Load an image from a data URL
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>} Loaded image element
   */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  // Expose on namespace
  window.AgentationFeedback.Screenshot = {
    captureElement
  };
})();
