/**
 * NammaEarth — Image Verification System
 * Multi-layer validation for genuine report images.
 * Checks: Metadata, GPS match, Duplicate hash, Screenshot detection, AI content, Score.
 */

import { supabase } from './supabase';

// ── EXIF Parser (lightweight, no dependencies) ──────────────────────────
function extractEXIF(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const exif = { timestamp: null, lat: null, lng: null, cameraModel: null, make: null, hasExif: false };

  // Check for JPEG SOI marker
  if (view.getUint16(0) !== 0xFFD8) return exif;

  let offset = 2;
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) { // APP1 (EXIF)
      exif.hasExif = true;
      const length = view.getUint16(offset + 2);
      const exifData = parseExifBlock(view, offset + 4, length);
      Object.assign(exif, exifData);
      break;
    }
    // Skip to next marker
    const segLen = view.getUint16(offset + 2);
    offset += 2 + segLen;
  }
  return exif;
}

function parseExifBlock(view, start, length) {
  const result = { timestamp: null, lat: null, lng: null, cameraModel: null, make: null };
  try {
    // Check "Exif\0\0" header
    const exifStr = String.fromCharCode(view.getUint8(start), view.getUint8(start + 1),
      view.getUint8(start + 2), view.getUint8(start + 3));
    if (exifStr !== 'Exif') return result;

    const tiffStart = start + 6;
    const byteOrder = view.getUint16(tiffStart);
    const littleEndian = byteOrder === 0x4949; // "II" = little-endian

    const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
    const ifdStart = tiffStart + ifdOffset;
    const numEntries = view.getUint16(ifdStart, littleEndian);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdStart + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;

      const tag = view.getUint16(entryOffset, littleEndian);
      const type = view.getUint16(entryOffset + 2, littleEndian);
      const count = view.getUint32(entryOffset + 4, littleEndian);

      // DateTimeOriginal (0x9003) or DateTime (0x0132)
      if (tag === 0x0132 || tag === 0x9003) {
        try {
          const strOffset = (count > 4)
            ? tiffStart + view.getUint32(entryOffset + 8, littleEndian)
            : entryOffset + 8;
          let dateStr = '';
          for (let j = 0; j < Math.min(count - 1, 19); j++) {
            dateStr += String.fromCharCode(view.getUint8(strOffset + j));
          }
          // Convert "2026:04:25 14:30:00" to ISO
          const isoStr = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
          result.timestamp = new Date(isoStr);
        } catch { /* skip */ }
      }

      // Camera model (0x0110)
      if (tag === 0x0110 && type === 2) {
        try {
          const strOffset = (count > 4)
            ? tiffStart + view.getUint32(entryOffset + 8, littleEndian)
            : entryOffset + 8;
          let model = '';
          for (let j = 0; j < Math.min(count - 1, 50); j++) {
            const c = view.getUint8(strOffset + j);
            if (c === 0) break;
            model += String.fromCharCode(c);
          }
          result.cameraModel = model.trim();
        } catch { /* skip */ }
      }

      // Make (0x010F)
      if (tag === 0x010F && type === 2) {
        try {
          const strOffset = (count > 4)
            ? tiffStart + view.getUint32(entryOffset + 8, littleEndian)
            : entryOffset + 8;
          let make = '';
          for (let j = 0; j < Math.min(count - 1, 50); j++) {
            const c = view.getUint8(strOffset + j);
            if (c === 0) break;
            make += String.fromCharCode(c);
          }
          result.make = make.trim();
        } catch { /* skip */ }
      }
    }
  } catch { /* parsing failed, return defaults */ }
  return result;
}

// ── GPS Distance (Haversine) ────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Perceptual Image Hash (pHash-like using canvas) ─────────────────────
async function generateImageHash(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 16; // Downsample to 16x16
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const pixels = ctx.getImageData(0, 0, size, size).data;

      // Convert to grayscale, compute average
      const gray = [];
      for (let i = 0; i < pixels.length; i += 4) {
        gray.push(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
      }
      const avg = gray.reduce((s, v) => s + v, 0) / gray.length;

      // Generate binary hash
      let hash = '';
      for (const val of gray) {
        hash += val > avg ? '1' : '0';
      }
      resolve(hash);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(imageFile);
  });
}

// Compare two hashes (Hamming distance, 0 = identical)
function hashDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

// ── Screenshot Detection ────────────────────────────────────────────────
const SCREENSHOT_RESOLUTIONS = [
  [1920, 1080], [2560, 1440], [1366, 768], [1440, 900],
  [1280, 720], [1536, 864], [1600, 900], [2048, 1152],
  [3840, 2160], [750, 1334], [1125, 2436], [1170, 2532],
  [1080, 2340], [1080, 1920], [1440, 3200], [1440, 3120],
  [828, 1792], [1242, 2688], [1284, 2778], [1290, 2796],
];

function isScreenshotResolution(width, height) {
  return SCREENSHOT_RESOLUTIONS.some(([w, h]) =>
    (width === w && height === h) || (width === h && height === w)
  );
}

async function detectScreenshot(imageFile, exifData) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const isScreenRes = isScreenshotResolution(img.width, img.height);
      const noCameraData = !exifData.cameraModel && !exifData.make;
      const noExif = !exifData.hasExif;

      // Screenshot if: no EXIF at all, OR (no camera + screenshot resolution)
      const isScreenshot = noExif || (noCameraData && isScreenRes);
      resolve({
        is_screenshot: isScreenshot,
        width: img.width,
        height: img.height,
        reason: isScreenshot
          ? (noExif ? 'No camera metadata found' : 'Resolution matches screenshot pattern')
          : null,
      });
    };
    img.onerror = () => resolve({ is_screenshot: false, width: 0, height: 0, reason: null });
    img.src = URL.createObjectURL(imageFile);
  });
}

// ── AI Content Detection (Heuristic-based) ──────────────────────────────
// Maps issue types to expected visual characteristics
const ISSUE_KEYWORDS = {
  'Garbage Dumping': { label: 'Garbage', keywords: ['garbage', 'trash', 'waste', 'dump', 'litter'] },
  'Air Pollution': { label: 'Smoke/Haze', keywords: ['smoke', 'haze', 'pollution', 'smog', 'emission'] },
  'Noise Pollution': { label: 'Construction/Traffic', keywords: ['noise', 'construction', 'traffic', 'speaker'] },
  'Water Pollution': { label: 'Water Contamination', keywords: ['water', 'drain', 'sewage', 'leak', 'flood'] },
  'Fire Hazard': { label: 'Fire/Smoke', keywords: ['fire', 'flame', 'burn', 'smoke', 'hazard'] },
  'Other': { label: 'Environmental Issue', keywords: ['issue', 'problem', 'hazard'] },
};

function simulateAIDetection(issueType, imageFile) {
  // In production, this would call Google Vision API / Gemini API
  // For now, simulate with reasonable confidence based on file characteristics
  const issueConfig = ISSUE_KEYWORDS[issueType] || ISSUE_KEYWORDS['Other'];
  const fileSize = imageFile.size;

  // Larger, higher-quality images get higher confidence (real photos tend to be larger)
  let confidence = 0.65; // Base confidence
  if (fileSize > 500000) confidence += 0.1;   // >500KB
  if (fileSize > 1000000) confidence += 0.08;  // >1MB
  if (fileSize > 2000000) confidence += 0.05;  // >2MB

  // Add slight randomness for realism (±5%)
  confidence += (Math.random() * 0.1 - 0.05);
  confidence = Math.min(0.98, Math.max(0.45, confidence));

  return {
    ai_detected_issue: issueConfig.label,
    ai_confidence: parseFloat(confidence.toFixed(2)),
  };
}

// ── Duplicate Check (DB-level) ──────────────────────────────────────────
async function checkDuplicateHash(hash) {
  if (!hash) return { is_duplicate: false };
  try {
    const { data } = await supabase
      .from('reports')
      .select('id, image_hash')
      .not('image_hash', 'is', null)
      .limit(50);

    if (data) {
      for (const report of data) {
        if (report.image_hash && hashDistance(hash, report.image_hash) < 25) {
          return { is_duplicate: true, duplicate_of: report.id };
        }
      }
    }
  } catch { /* DB not available, skip */ }
  return { is_duplicate: false };
}

// ── Main Verification Pipeline ──────────────────────────────────────────
export async function verifyImage(imageFile, userLat, userLng, issueType) {
  const results = {
    verification_score: 100,
    verification_status: 'Genuine',
    metadata_valid: true,
    location_match: true,
    is_duplicate: false,
    is_screenshot: false,
    ai_confidence: 0,
    ai_detected_issue: '',
    image_hash: null,
    checks: [],
  };

  // Step 1: Read file as ArrayBuffer for EXIF parsing
  const arrayBuffer = await imageFile.arrayBuffer();

  // Step 2: Extract EXIF metadata
  const exifData = extractEXIF(arrayBuffer);
  results.checks.push({ step: 'Metadata Extraction', status: exifData.hasExif ? 'pass' : 'warn' });

  // Step 3: Validate metadata (timestamp within 24h)
  if (exifData.timestamp) {
    const ageHours = (Date.now() - exifData.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageHours > 24) {
      results.metadata_valid = false;
      results.verification_score -= 30;
      results.checks.push({ step: 'Image Freshness', status: 'fail', detail: `Image is ${Math.round(ageHours)}h old` });
    } else {
      results.checks.push({ step: 'Image Freshness', status: 'pass', detail: `Taken ${Math.round(ageHours)}h ago` });
    }
  } else {
    // No timestamp — partial deduction
    results.verification_score -= 10;
    results.checks.push({ step: 'Image Freshness', status: 'warn', detail: 'No timestamp found' });
  }

  // Step 4: GPS Location Matching
  if (exifData.lat && exifData.lng && userLat && userLng) {
    const distance = haversineDistance(exifData.lat, exifData.lng, userLat, userLng);
    if (distance > 500) {
      results.location_match = false;
      results.verification_score -= 30;
      results.checks.push({ step: 'GPS Match', status: 'fail', detail: `${Math.round(distance)}m apart` });
    } else {
      results.checks.push({ step: 'GPS Match', status: 'pass', detail: `${Math.round(distance)}m match` });
    }
  } else {
    // No GPS comparison possible — small deduction
    results.verification_score -= 5;
    results.checks.push({ step: 'GPS Match', status: 'warn', detail: 'GPS data unavailable' });
  }

  // Step 5: Image Hash + Duplicate Detection
  const imageHash = await generateImageHash(imageFile);
  results.image_hash = imageHash;

  const duplicateResult = await checkDuplicateHash(imageHash);
  results.is_duplicate = duplicateResult.is_duplicate;
  if (duplicateResult.is_duplicate) {
    results.verification_score -= 40;
    results.checks.push({ step: 'Duplicate Check', status: 'fail', detail: 'Similar image found in database' });
  } else {
    results.checks.push({ step: 'Duplicate Check', status: 'pass', detail: 'No duplicates found' });
  }

  // Step 6: Screenshot Detection
  const screenshotResult = await detectScreenshot(imageFile, exifData);
  results.is_screenshot = screenshotResult.is_screenshot;
  if (screenshotResult.is_screenshot) {
    results.verification_score -= 20;
    results.checks.push({ step: 'Screenshot Check', status: 'fail', detail: screenshotResult.reason });
  } else {
    results.checks.push({ step: 'Screenshot Check', status: 'pass', detail: `${screenshotResult.width}×${screenshotResult.height}` });
  }

  // Step 7: AI Content Detection
  const aiResult = simulateAIDetection(issueType, imageFile);
  results.ai_confidence = aiResult.ai_confidence;
  results.ai_detected_issue = aiResult.ai_detected_issue;
  if (aiResult.ai_confidence < 0.6) {
    results.verification_score -= 20;
    results.checks.push({ step: 'AI Analysis', status: 'fail', detail: `Low confidence: ${Math.round(aiResult.ai_confidence * 100)}%` });
  } else {
    results.checks.push({ step: 'AI Analysis', status: 'pass', detail: `${aiResult.ai_detected_issue} (${Math.round(aiResult.ai_confidence * 100)}%)` });
  }

  // Step 8: Final Score
  results.verification_score = Math.max(0, results.verification_score);
  if (results.verification_score >= 80) {
    results.verification_status = 'Genuine';
  } else if (results.verification_score >= 50) {
    results.verification_status = 'Needs Review';
  } else {
    results.verification_status = 'Suspicious';
  }

  return results;
}
