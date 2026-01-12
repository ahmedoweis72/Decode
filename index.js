// cp1256 encoder/decoder for Arabic -> \u00XX escaped bytes
// Usage: toCp1256Escaped("تصدير") -> "\u00CA\u00D5\u00CF\u00ED\u00D1"
// decodeCp1256Escaped("\u00CA\u00D5...") -> "تصدير"

const unicodeToCp1256 = {
  // Common Arabic letters (subset from CP1256)
  0x0621: 0xC1, 0x0622: 0xC2, 0x0623: 0xC3, 0x0624: 0xC4,
  0x0625: 0xC5, 0x0626: 0xC6, 0x0627: 0xC7, 0x0628: 0xC8,
  0x0629: 0xC9, 0x062A: 0xCA, 0x062B: 0xCB, 0x062C: 0xCC,
  0x062D: 0xCD, 0x062E: 0xCE, 0x062F: 0xCF, 0x0630: 0xD0,
  0x0631: 0xD1, 0x0632: 0xD2, 0x0633: 0xD3, 0x0634: 0xD4,
  0x0635: 0xD5, 0x0636: 0xD6, 0x0637: 0xD8, 0x0638: 0xD9,
  0x0639: 0xDA, 0x063A: 0xDB, 0x0640: 0xDC, 0x0641: 0xDD,
  0x0642: 0xDE, 0x0643: 0xDF, 0x0644: 0xE1, 0x0645: 0xE3,
  0x0646: 0xE4, 0x0647: 0xE5, 0x0648: 0xE6, 0x0649: 0xEC,
  0x064A: 0xED, 0x064B: 0xF0, 0x064C: 0xF1, 0x064D: 0xF2,
  0x064E: 0xF3, 0x064F: 0xF5, 0x0650: 0xF6, 0x0651: 0xF8,
  0x0652: 0xFA, 0x06C1: 0xC0, 0x06D2: 0xFF,
  // Persian/Urdu extensions and punctuation
  0x067E: 0x81, 0x0679: 0x8A, 0x0686: 0x8D, 0x0698: 0x8E,
  0x0688: 0x8F, 0x06AF: 0x90, 0x06BA: 0x9F, 0x06BE: 0xAA,
  0x060C: 0xA1, 0x061B: 0xBA, 0x061F: 0xBF
};

// Build reverse map for decoding
const cp1256ToUnicode = new Array(256).fill(0).map((_, i) => {
  // Default identity for ASCII
  if (i < 0x80) return i;
  return null;
});
// Populate cp1256ToUnicode from unicodeToCp1256
for (const [uHex, byte] of Object.entries(unicodeToCp1256)) {
  const u = Number(uHex);
  cp1256ToUnicode[byte] = u;
}

function toCp1256Escaped(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    let b = null;
    if (cp <= 0x7F) b = cp;
    else if (unicodeToCp1256[cp]) b = unicodeToCp1256[cp];
    if (b !== null) {
      out.push('\\u00' + b.toString(16).toUpperCase().padStart(2, '0'));
    } else {
      // Fallback: emit UTF-8 bytes as \u00XX if char not in cp1256 map
      const bytes = new TextEncoder().encode(ch);
      for (const bb of bytes) {
        out.push('\\u00' + bb.toString(16).toUpperCase().padStart(2, '0'));
      }
    }
  }
  return out.join('');
}

function decodeCp1256Escaped(escaped) {
  // Accepts strings like "\u00CA\u00D5..." or raw bytes in that escaped form.
  const re = /\\u00([0-9A-Fa-f]{2})/g;
  const bytes = [];
  let m;
  while ((m = re.exec(escaped)) !== null) {
    bytes.push(parseInt(m[1], 16));
  }
  // Map bytes through cp1256ToUnicode
  let out = '';
  for (const b of bytes) {
    const u = cp1256ToUnicode[b];
    if (u === null || u === undefined) {
      out += String.fromCharCode(b); // best-effort fallback
    } else {
      out += String.fromCharCode(u);
    }
  }
  return out;
}

// Minimal UI wiring (if you added the HTML below)
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('inputText');
  const encBtn = document.getElementById('encodeBtn');
  const decBtn = document.getElementById('decodeBtn');
  const out = document.getElementById('outputText');
  const copyInputBtn = document.getElementById('copyInputBtn');
  const copyOutputBtn = document.getElementById('copyOutputBtn');
  const clearBtn = document.getElementById('clearBtn');

  function setOutput(val) {
    if (out) out.value = val;
  }

  if (encBtn) encBtn.addEventListener('click', () => {
    setOutput(toCp1256Escaped(input.value));
  });
  if (decBtn) decBtn.addEventListener('click', () => {
    setOutput(decodeCp1256Escaped(input.value));
  });

  if (copyInputBtn) copyInputBtn.addEventListener('click', async () => {
    if (!input) return;
    try {
      await navigator.clipboard.writeText(input.value);
      copyInputBtn.textContent = 'Copied';
      setTimeout(() => copyInputBtn.textContent = 'Copy Input', 1200);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  });

  if (copyOutputBtn) copyOutputBtn.addEventListener('click', async () => {
    if (!out) return;
    try {
      await navigator.clipboard.writeText(out.value);
      copyOutputBtn.textContent = 'Copied';
      setTimeout(() => copyOutputBtn.textContent = 'Copy Output', 1200);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (input) input.value = '';
    if (out) out.value = '';
  });

  // Example default
  if (input && out && !input.value) input.value = '';
  if (out && !out.value) out.value = '';
});