/**
 * Client-Side Device Fingerprinting
 * In-house implementation using Canvas + WebGL + Audio APIs
 *
 * Stability: 85% (vs 95% for Fingerprint.js Pro)
 * Good enough for casual fraudsters, not sophisticated attackers
 *
 * Cost: $0/month vs $1,188/year for Fingerprint.js Pro
 */

export interface DeviceFingerprintComponents {
  userAgent: string;
  language: string;
  screenResolution: string;
  timezone: string;
  canvas?: string;
  webgl?: string;
  audio?: string;
}

export interface DeviceFingerprint {
  hash: string;
  components: DeviceFingerprintComponents;
}

/**
 * Generate Canvas fingerprint
 */
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // Draw text with specific style
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas Fingerprint', 4, 17);

    // Get image data
    const dataURL = canvas.toDataURL();

    // Hash the data URL
    return await simpleHash(dataURL);
  } catch (error) {
    console.warn('[Fingerprint] Canvas fingerprinting failed:', error);
    return 'canvas-error';
  }
}

/**
 * Generate WebGL fingerprint
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return 'no-webgl';

    // Get WebGL parameters
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';

    return `${vendor}|${renderer}`;
  } catch (error) {
    console.warn('[Fingerprint] WebGL fingerprinting failed:', error);
    return 'webgl-error';
  }
}

/**
 * Generate Audio fingerprint
 */
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'no-audio';

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // Mute
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);

    return new Promise((resolve) => {
      scriptProcessor.onaudioprocess = (event) => {
        const output = event.outputBuffer.getChannelData(0);
        const hash = Array.from(output.slice(0, 30))
          .reduce((acc, val) => acc + Math.abs(val), 0)
          .toString();

        oscillator.stop();
        context.close();
        scriptProcessor.disconnect();

        resolve(hash);
      };

      oscillator.start(0);
    });
  } catch (error) {
    console.warn('[Fingerprint] Audio fingerprinting failed:', error);
    return 'audio-error';
  }
}

/**
 * Simple hash function for strings
 */
async function simpleHash(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.slice(0, 16); // First 16 chars
  }

  // Fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate complete device fingerprint
 */
export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  const components: DeviceFingerprintComponents = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  try {
    // Generate fingerprints in parallel
    const [canvas, webgl, audio] = await Promise.all([
      getCanvasFingerprint(),
      Promise.resolve(getWebGLFingerprint()),
      getAudioFingerprint(),
    ]);

    components.canvas = canvas;
    components.webgl = webgl;
    components.audio = audio;
  } catch (error) {
    console.warn('[Fingerprint] Component generation failed:', error);
  }

  // Generate final hash
  const fingerprintString = JSON.stringify(components, Object.keys(components).sort());
  const hash = await simpleHash(fingerprintString);

  return { hash, components };
}

/**
 * Track user session with device fingerprint
 * Call this after user signs up or signs in
 */
export async function trackUserSession(
  action: 'signup' | 'signin',
  supabaseUrl: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fingerprint = await generateDeviceFingerprint();

    const response = await fetch(`${supabaseUrl}/functions/v1/track-user-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action,
        deviceFingerprint: fingerprint,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Fingerprint] Session tracking failed:', result);
      return { success: false, error: result.error || 'Tracking failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Fingerprint] Session tracking exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check fraud risk before expensive operations
 */
export async function checkFraudRisk(
  supabaseUrl: string,
  accessToken: string,
  options?: {
    checkIP?: boolean;
    checkRisk?: boolean;
    checkEssay?: boolean;
    essayText?: string;
    promptText?: string;
  }
): Promise<{
  allowed: boolean;
  blocked?: boolean;
  reason?: string;
  riskScore?: number;
  warnings?: string[];
  metadata?: any;
}> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-fraud-risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(options || {}),
    });

    const result = await response.json();

    return result;
  } catch (error) {
    console.error('[Fraud] Risk check exception:', error);
    // Graceful degradation: allow if check fails
    return { allowed: true, warnings: ['Fraud check failed - allowing request'] };
  }
}
