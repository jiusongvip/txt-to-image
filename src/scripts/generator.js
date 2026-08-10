// Toast notification system
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const colors = { success: 'bg-emerald-600', error: 'bg-red-500', info: 'bg-zinc-800' };
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 ' + (colors[type] || colors.info) + ' text-white text-sm px-5 py-3 rounded-full shadow-lg z-50 transition-all duration-300 opacity-0 translate-y-4';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.classList.remove('opacity-0', 'translate-y-4'); });
  setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-4'); setTimeout(() => toast.remove(), 300); }, 2500);
}

// DOM refs
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileMeta = document.getElementById('file-meta');
const textPreview = document.getElementById('text-preview');
const convertBtn = document.getElementById('convert-btn');
const resultSection = document.getElementById('result-section');
const resultPlaceholder = document.getElementById('result-placeholder');
const resultImage = document.getElementById('result-image');
const downloadBtn = document.getElementById('download-btn');
const outputFormat = document.getElementById('output-format');
const fontSize = document.getElementById('font-size');
const fontFamily = document.getElementById('font-family');
const bgColor = document.getElementById('bg-color');
const textColor = document.getElementById('text-color');
const padding = document.getElementById('padding');
const aspectRatioSelect = document.getElementById('aspect-ratio');
const statusLive = document.getElementById('generation-status');

// Text input mode refs
const tabUpload = document.getElementById('tab-upload');
const tabText = document.getElementById('tab-text');
const uploadMode = document.getElementById('upload-mode');
const textMode = document.getElementById('text-mode');
const textInput = document.getElementById('text-input');
const textCharCount = document.getElementById('text-char-count');

// Bold/italic refs
const boldBtn = document.getElementById('bold-btn');
const italicBtn = document.getElementById('italic-btn');

// ============== Syntax Highlighting ==============
// Language map: file extension -> highlight.js language id
const langMap = {
  js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  c: 'c', cpp: 'cpp', h: 'c', php: 'php', swift: 'swift', kt: 'kotlin',
  html: 'xml', css: 'css', scss: 'scss', json: 'json', xml: 'xml',
  yml: 'yaml', yaml: 'yaml', sql: 'sql', sh: 'bash', bat: 'dos', ps1: 'powershell',
  md: 'markdown', markdown: 'markdown',
  ini: 'ini', cfg: 'ini', conf: 'nginx', env: 'ini', toml: 'ini',
  csv: undefined, log: undefined, txt: undefined, text: undefined
};

// VS Code Dark+ theme colors for highlight.js CSS classes
const hljsTheme = {
  'hljs-keyword':  '#569cd6', 'hljs-built_in': '#4ec9b0',
  'hljs-type':     '#4ec9b0', 'hljs-literal':  '#569cd6',
  'hljs-number':   '#b5cea8', 'hljs-regexp':   '#d16969',
  'hljs-string':   '#ce9178', 'hljs-subst':    '#dcdcdc',
  'hljs-symbol':   '#b5cea8', 'hljs-class':    '#4ec9b0',
  'hljs-function': '#dcdcaa', 'hljs-title':    '#dcdcaa',
  'hljs-params':   '#dcdcdc',
  'hljs-comment':  '#6a9955', 'hljs-doctag':   '#608b4e',
  'hljs-meta':     '#9b9b9b', 'hljs-meta-keyword': '#9b9b9b',
  'hljs-section':  '#569cd6', 'hljs-tag':      '#569cd6',
  'hljs-name':     '#569cd6', 'hljs-attr':     '#9cdcfe',
  'hljs-attribute':'#9cdcfe', 'hljs-variable': '#9cdcfe',
  'hljs-bullet':   '#d7ba7d', 'hljs-code':     '#ce9178',
  'hljs-emphasis': '#dcdcdc', 'hljs-strong':   '#dcdcdc',
  'hljs-formula':  '#dcdcdc', 'hljs-link':     '#569cd6',
  'hljs-quote':    '#6a9955', 'hljs-selector-tag': '#d7ba7d',
  'hljs-selector-id': '#d7ba7d', 'hljs-selector-class': '#d7ba7d',
  'hljs-selector-attr': '#d7ba7d', 'hljs-selector-pseudo': '#d7ba7d',
  'hljs-template-tag': '#569cd6', 'hljs-template-variable': '#9cdcfe',
  'hljs-addition': '#b5cea8', 'hljs-deletion': '#d16969',
  'hljs-operator': '#d4d4d4', 'hljs-punctuation': '#d4d4d4',
  'hljs-property': '#9cdcfe',
};

// Default text color (used when no hljs class matches)
const DEFAULT_HL_COLOR = '#d4d4d4';

function detectLanguage(name) {
  const ext = name.split('.').pop().toLowerCase();
  return langMap[ext] || null;
}

let cachedTokens = null;
let cachedContentHash = '';

function tokenizeCode(content, ext) {
  // Return cached if content hasn't changed
  const hash = content.length + '|' + content.slice(0, 100);
  if (cachedTokens && cachedContentHash === hash) return cachedTokens;
  cachedContentHash = hash;

  const lang = detectLanguage(currentFileName);
  if (!lang) { cachedTokens = null; return null; }

  try {
    // Use highlight.js to get HTML with color spans
    let html;
    if (typeof hljs !== 'undefined') {
      const result = lang ? hljs.highlight(content, { language: lang, ignoreIllegals: true }) : hljs.highlightAuto(content);
      html = result.value;
    } else {
      return null;
    }

    // Parse HTML -> flat token array [{text, color, isNewline}]
    const tokens = [];
    const div = document.createElement('div');
    div.innerHTML = html;

    function walk(node, parentColor) {
      if (node.nodeType === 3) { // Text node
        const text = node.textContent;
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '\n') {
            tokens.push({ text: '\n', color: parentColor || DEFAULT_HL_COLOR, isNewline: true });
          } else {
            // Group consecutive non-newline chars
            let j = i;
            while (j < text.length && text[j] !== '\n') j++;
            tokens.push({ text: text.slice(i, j), color: parentColor || DEFAULT_HL_COLOR, isNewline: false });
            i = j - 1;
          }
        }
        return;
      }
      if (node.nodeType !== 1) return; // Skip non-elements
      // Determine color from class
      let color = parentColor;
      const cls = node.className || '';
      for (const [hljsClass, hljsColor] of Object.entries(hljsTheme)) {
        if (cls.includes(hljsClass)) { color = hljsColor; break; }
      }
      node.childNodes.forEach(child => walk(child, color));
    }
    walk(div, DEFAULT_HL_COLOR);

    cachedTokens = tokens.length > 0 ? tokens : null;
    return cachedTokens;
  } catch (e) {
    cachedTokens = null;
    return null;
  }
}

// Token-based text rendering with word wrapping
function renderTokensToLines(ctx, tokens, maxLineWidth) {
  const lines = [];        // Array of {tokens: [{text, color}], width: number}
  let currentLine = [];
  let currentX = 0;

  for (const tok of tokens) {
    if (tok.isNewline) {
      lines.push({ tokens: currentLine, width: currentX });
      currentLine = [];
      currentX = 0;
      continue;
    }

    const tokWidth = ctx.measureText(tok.text).width;

    if (currentX + tokWidth <= maxLineWidth) {
      currentLine.push(tok);
      currentX += tokWidth;
    } else if (tokWidth > maxLineWidth) {
      // Token too wide for a line — character-level wrapping
      let remaining = tok.text;
      while (remaining.length > 0) {
        let chunk = remaining;
        while (ctx.measureText(chunk).width > maxLineWidth && chunk.length > 1) {
          chunk = chunk.slice(0, -1);
        }
        if (currentX + ctx.measureText(chunk).width > maxLineWidth && currentLine.length > 0) {
          lines.push({ tokens: currentLine, width: currentX });
          currentLine = [];
          currentX = 0;
        }
        currentLine.push({ text: chunk, color: tok.color, isNewline: false });
        currentX += ctx.measureText(chunk).width;
        remaining = remaining.slice(chunk.length);
        if (remaining.length > 0 && chunk.length === 0) break;
      }
    } else {
      // Token fits on next line
      lines.push({ tokens: currentLine, width: currentX });
      currentLine = [tok];
      currentX = tokWidth;
    }
  }
  if (currentLine.length > 0) lines.push({ tokens: currentLine, width: currentX });
  return lines;
}

// Draw a token-based line on canvas
function drawTokenLine(ctx, line, x, y) {
  let cx = x;
  for (const tok of line.tokens) {
    ctx.fillStyle = tok.color;
    ctx.fillText(tok.text, cx, y);
    cx += ctx.measureText(tok.text).width;
  }
}

// Map aspect ratio to [width, height] in pixels. auto = [800, 0] (height calculated from content)
function getDimensionsFromRatio(ratio) {
  if (ratio === 'auto') return [800, 0];
  const map = {
    '1:1':  [800, 800], '4:3':  [960, 720], '16:9': [1280, 720],
    '3:2':  [900, 600], '9:16': [450, 800], '3:4':  [600, 800]
  };
  return map[ratio] || [1280, 720];
}

let fileContent = '';
let currentFileName = '';
let currentMode = 'upload';
let isBold = false;
let isItalic = false;
let lastCanvas = null;
let lastMime = 'image/png';
let lastFormat = 'png';

function setStatus(msg) { if (statusLive) statusLive.textContent = msg; }

function setupDownload(canvas, mime, format) {
  lastCanvas = canvas; lastMime = mime; lastFormat = format;
  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL(mime, 0.95);
    const baseName = currentFileName.replace(/\.[^.]+$/, '') || 'text-image';
    const outName = baseName + '.' + format;
    a.download = outName; a.click();
    showToast('Downloaded: ' + outName, 'success');
  };
}

function getFontStack(family) {
  const map = {
    'JetBrains Mono': "'JetBrains Mono', monospace", 'Fira Code': "'Fira Code', monospace",
    'monospace': 'monospace', 'Inter': "'Inter', sans-serif",
    'sans-serif': 'sans-serif', 'Lora': "'Lora', serif",
    'serif': 'serif', 'cursive': 'cursive'
  };
  return map[family] || 'monospace';
}

const customFonts = ['JetBrains Mono', 'Fira Code', 'Inter', 'Lora'];
const fontWeights = ['400', '700'];
const fontStyles = ['normal', 'italic'];
const fontsReady = Promise.all(
  customFonts.flatMap(family =>
    fontWeights.flatMap(w =>
      fontStyles.map(s =>
        document.fonts.load(s + ' ' + w + ' 14px ' + family).catch(() => {})
      )
    )
  )
).then(() => document.fonts.ready);

function buildFontStr(family, size, bold, italic) {
  const weight = bold ? '700' : '400';
  const style = italic ? 'italic' : 'normal';
  return style + ' ' + weight + ' ' + size + 'px ' + getFontStack(family);
}

function createHiDPICanvas(w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = w * dpr;
  canvas.height = h > 0 ? h * dpr : 1;
  canvas.style.width = w + 'px';
  canvas.style.height = h > 0 ? h + 'px' : 'auto';
  const ctx = canvas.getContext('2d');
  if (h > 0) ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx, dpr };
}

// ============== Rendering Engine ==============
// Returns needed height when imgH is 0 (auto mode)
function renderContentToCanvas(canvas, ctx, content, fFamily, fSize, pad, bg, fg, imgW, imgH) {
  const fontStr = buildFontStr(fFamily, fSize, isBold, isItalic);
  ctx.font = fontStr;
  const lineHeight = fSize * 1.5;
  const maxLineWidth = imgW - pad * 2;
  const MAX_TOTAL_LINES = 5000;
  const isAuto = imgH === 0;

  // First pass: measure lines
  let totalLines;
  const tokens = tokenizeCode(content, currentFileName);

  if (tokens) {
    const visualLines = renderTokensToLines(ctx, tokens, maxLineWidth);
    totalLines = Math.min(visualLines.length, MAX_TOTAL_LINES);
  } else {
    const lines = content.split('\n');
    const wrappedCounts = [];
    lines.forEach(line => {
      if (line === '') { wrappedCounts.push(1); return; }
      let remaining = line;
      let count = 0;
      while (remaining.length > 0) {
        let chunk = remaining;
        while (ctx.measureText(chunk).width > maxLineWidth && chunk.length > 1) chunk = chunk.slice(0, -1);
        count++;
        remaining = remaining.slice(chunk.length);
        if (remaining.length > 0 && chunk.length === 0) break;
      }
      wrappedCounts.push(count);
    });
    totalLines = Math.min(wrappedCounts.reduce((a, b) => a + b, 0), MAX_TOTAL_LINES);
  }

  // Compute effective height
  const effectiveH = isAuto ? (pad * 2 + totalLines * lineHeight) : imgH;
  const maxLines = isAuto ? totalLines : Math.floor((imgH - pad * 2) / lineHeight);

  // If auto mode, resize canvas
  if (isAuto) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = imgW * dpr;
    canvas.height = effectiveH * dpr;
    canvas.style.width = imgW + 'px';
    canvas.style.height = effectiveH + 'px';
    ctx.scale(dpr, dpr);
  }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, imgW, effectiveH);

  if (tokens) {
    const visualLines = renderTokensToLines(ctx, tokens, maxLineWidth);
    const displayLines = visualLines.slice(0, Math.min(maxLines, MAX_TOTAL_LINES));
    const needsTruncation = visualLines.length > maxLines;

    ctx.textBaseline = 'top';
    displayLines.forEach((line, i) => {
      drawTokenLine(ctx, line, pad, pad + i * lineHeight);
    });

    if (needsTruncation && !isAuto) {
      const truncY = Math.max(pad, effectiveH - pad - lineHeight);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'italic 400 ' + (fSize - 2) + 'px ' + getFontStack(fFamily);
      ctx.fillText('... content truncated, ' + (visualLines.length - displayLines.length) + ' lines not shown', pad, truncY);
    }
    return;
  }

  // Plain text
  ctx.fillStyle = fg;
  ctx.font = fontStr;
  const lines = content.split('\n');
  const wrappedLines = [];
  lines.forEach(line => {
    if (line === '') { wrappedLines.push(''); return; }
    let remaining = line;
    while (remaining.length > 0) {
      let chunk = remaining;
      while (ctx.measureText(chunk).width > maxLineWidth && chunk.length > 1) chunk = chunk.slice(0, -1);
      wrappedLines.push(chunk);
      remaining = remaining.slice(chunk.length);
      if (remaining.length > 0 && chunk.length === 0) break;
    }
  });
  const displayLines = wrappedLines.slice(0, Math.min(maxLines, MAX_TOTAL_LINES));
  const needsTruncation = wrappedLines.length > maxLines;

  ctx.textBaseline = 'top';
  displayLines.forEach((line, i) => {
    ctx.fillText(line, pad, pad + i * lineHeight);
  });

  if (needsTruncation && !isAuto) {
    const truncY = Math.max(pad, effectiveH - pad - lineHeight);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'italic 400 ' + (fSize - 2) + 'px ' + getFontStack(fFamily);
    ctx.fillText('... content truncated, ' + (wrappedLines.length - displayLines.length) + ' lines not shown', pad, truncY);
  }
}

// ============== Tab Switching ==============
function switchToUpload() {
  currentMode = 'upload';
  tabUpload.className = 'px-4 py-2.5 text-sm font-medium text-emerald-600 border-b-2 border-emerald-500 -mb-px transition-colors';
  tabText.className = 'px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors';
  uploadMode.classList.remove('hidden'); textMode.classList.add('hidden');
  convertBtn.disabled = !fileContent;
  if (!fileContent) convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
}
function switchToText() {
  currentMode = 'text';
  tabText.className = 'px-4 py-2.5 text-sm font-medium text-emerald-600 border-b-2 border-emerald-500 -mb-px transition-colors';
  tabUpload.className = 'px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors';
  textMode.classList.remove('hidden'); uploadMode.classList.add('hidden');
  fileInfo.classList.add('hidden');
  if (dropZone) dropZone.classList.remove('hidden');
  const val = textInput?.value || '';
  fileContent = val; currentFileName = 'text-image';
  convertBtn.disabled = val.trim().length === 0;
  if (val.trim().length === 0) convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
  else convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  doLivePreview();
}
if (tabUpload) tabUpload.addEventListener('click', switchToUpload);
if (tabText) tabText.addEventListener('click', switchToText);

// ============== Live Preview ==============
let livePreviewTimer = null;
function doLivePreview() {
  if (currentMode !== 'text') return;
  const val = textInput?.value || '';
  fileContent = val; currentFileName = 'text-image';
  if (textCharCount) textCharCount.textContent = val.length.toLocaleString() + ' characters' + (val.length > 0 ? ', ' + val.split('\n').length + ' lines' : '');
  const hasContent = val.trim().length > 0;
  convertBtn.disabled = !hasContent;
  if (hasContent) convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  else convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
  clearTimeout(livePreviewTimer);
  if (hasContent) livePreviewTimer = setTimeout(() => renderPreview(val), 300);
}
if (textInput) textInput.addEventListener('input', doLivePreview);

function renderPreview(content) {
  if (currentMode !== 'text') return;
  if (!resultSection) return;
  resultSection.classList.remove('hidden');
  const fSize = parseInt(fontSize?.value) || 14;
  const fFamily = fontFamily?.value || 'JetBrains Mono';
  const pad = parseInt(padding?.value) || 40;
  const bg = bgColor?.value || '#ffffff';
  const fg = textColor?.value || '#1a1a1a';
  const [imgW, imgH] = getDimensionsFromRatio(aspectRatioSelect?.value);

  fontsReady.then(() => {
    const { canvas, ctx } = createHiDPICanvas(imgW, imgH);
    renderContentToCanvas(canvas, ctx, content, fFamily, fSize, pad, bg, fg, imgW, imgH);

    const mime = (outputFormat?.value === 'jpg') ? 'image/jpeg' : (outputFormat?.value === 'webp') ? 'image/webp' : 'image/png';
    const fmt = outputFormat?.value || 'png';
    resultImage.src = canvas.toDataURL(mime, 0.92);
    resultImage.alt = 'Live preview of your text rendered as an image';
    resultPlaceholder.classList.add('hidden');
    resultImage.classList.remove('hidden');
    setupDownload(canvas, mime, fmt);
  });
}

// ============== Bold/Italic ==============
if (boldBtn) boldBtn.addEventListener('click', () => {
  isBold = !isBold;
  boldBtn.classList.toggle('bg-emerald-100', isBold);
  boldBtn.classList.toggle('border-emerald-400', isBold);
  boldBtn.classList.toggle('text-emerald-700', isBold);
  if (currentMode === 'text' && fileContent) doLivePreview();
});
if (italicBtn) italicBtn.addEventListener('click', () => {
  isItalic = !isItalic;
  italicBtn.classList.toggle('bg-emerald-100', isItalic);
  italicBtn.classList.toggle('border-emerald-400', isItalic);
  italicBtn.classList.toggle('text-emerald-700', isItalic);
  if (currentMode === 'text' && fileContent) doLivePreview();
});

// ============== File Upload ==============
if (dropZone) dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-emerald-400', 'bg-emerald-50'); });
if (dropZone) dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-emerald-400', 'bg-emerald-50'); });
if (dropZone) dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('border-emerald-400', 'bg-emerald-50'); const file = e.dataTransfer.files[0]; if (file) handleFile(file); });
if (dropZone) dropZone.addEventListener('click', () => fileInput.click());
if (fileInput) fileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) handleFile(file); });

function handleFile(file) {
  cachedTokens = null; cachedContentHash = '';
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) { showToast('File too large. Maximum 10MB.', 'error'); return; }
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['txt', 'md', 'log', 'csv', 'text', 'json', 'xml', 'yml', 'yaml', 'cfg', 'ini', 'conf', 'html', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp', 'h', 'rb', 'go', 'rs'];
  if (!allowed.includes(ext) && file.type && !file.type.startsWith('text/') && file.type !== 'application/json') {
    showToast('Unsupported file type. Please use a text file.', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    fileContent = ev.target.result; currentFileName = file.name;
    fileName.textContent = file.name;
    const kb = (file.size / 1024).toFixed(1);
    const lines = fileContent.split('\n').length;
    fileMeta.textContent = kb + ' KB, ' + lines + ' lines';
    const preview = fileContent.slice(0, 2000);
    textPreview.textContent = preview + (fileContent.length > 2000 ? '\n\n... (truncated preview)' : '');
    fileInfo.classList.remove('hidden'); dropZone.classList.add('hidden');
    convertBtn.disabled = false; convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    setStatus('File loaded: ' + file.name);
    showToast('File loaded: ' + file.name, 'success');
  };
  reader.onerror = () => { showToast('Failed to read file.', 'error'); };
  reader.readAsText(file);
}

// ============== Converter Presets ==============
// One-click recommended settings
window.preset = function(type) {
  if (!fontFamily || !fontSize || !bgColor || !textColor || !aspectRatioSelect || !outputFormat) return;
  const presets = {
    code:   { font: 'JetBrains Mono', size: '14', bg: '#1e1e1e', fg: '#e0e0e0', ratio: 'auto', fmt: 'png' },
    doc:    { font: 'Inter', size: '16', bg: '#ffffff', fg: '#1a1a1a', ratio: '16:9', fmt: 'png' },
    social: { font: 'Fira Code', size: '16', bg: '#1e1e1e', fg: '#e0e0e0', ratio: '16:9', fmt: 'png' }
  };
  const p = presets[type]; if (!p) return;
  fontFamily.value = p.font; fontFamily.dispatchEvent(new Event('change'));
  fontSize.value = p.size;
  bgColor.value = p.bg; bgColor.nextElementSibling.textContent = p.bg;
  textColor.value = p.fg; textColor.nextElementSibling.textContent = p.fg;
  aspectRatioSelect.value = p.ratio;
  outputFormat.value = p.fmt;
  if (currentMode === 'text' && fileContent) doLivePreview();
};

// ============== Demo Loader ==============
// Called by demo buttons to auto-fill the upload area
window.loadDemo = function(url, name) {
  cachedTokens = null; cachedContentHash = '';
  showToast('Loading ' + name + '...', 'info');
  fetch(url)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(text => {
      fileContent = text; currentFileName = name;
      fileName.textContent = name;
      const kb = (new Blob([text]).size / 1024).toFixed(1);
      const lines = text.split('\n').length;
      fileMeta.textContent = kb + ' KB, ' + lines + ' lines';
      const preview = text.slice(0, 2000);
      textPreview.textContent = preview + (text.length > 2000 ? '\n\n... (truncated preview)' : '');
      fileInfo.classList.remove('hidden'); dropZone.classList.add('hidden');
      convertBtn.disabled = false; convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      // Switch to upload mode
      currentMode = 'upload';
      tabUpload.className = 'px-4 py-2.5 text-sm font-medium text-emerald-600 border-b-2 border-emerald-500 -mb-px transition-colors';
      tabText.className = 'px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors';
      uploadMode.classList.remove('hidden'); textMode.classList.add('hidden');
      setStatus('Demo loaded: ' + name);
      showToast('Demo loaded: ' + name, 'success');
    })
    .catch(err => { showToast('Failed to load demo: ' + err.message, 'error'); });
};

// Reset
const resetBtn = document.getElementById('reset-btn');
if (resetBtn) resetBtn.addEventListener('click', () => {
  fileContent = ''; currentFileName = '';
  cachedTokens = null; cachedContentHash = '';
  fileInfo.classList.add('hidden');
  if (dropZone) dropZone.classList.remove('hidden');
  resultSection.classList.add('hidden');
  convertBtn.disabled = true; convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
  fileInput.value = '';
  if (textInput) textInput.value = '';
  if (textCharCount) textCharCount.textContent = '0 characters';
  setStatus(''); showToast('Reset. Upload a new file.', 'info');
});

// ============== Convert Button ==============
if (convertBtn) convertBtn.addEventListener('click', () => {
  const content = currentMode === 'text' ? (textInput?.value || '') : fileContent;
  if (!content || (currentMode === 'text' && content.trim().length === 0)) {
    showToast(currentMode === 'text' ? 'Please type or paste some text first.' : 'Please upload a file first.', 'error');
    return;
  }
  fileContent = content;
  convertBtn.disabled = true; convertBtn.classList.add('opacity-50', 'cursor-not-allowed');
  resultSection.classList.remove('hidden');
  resultPlaceholder.classList.remove('hidden'); resultImage.classList.add('hidden');
  resultPlaceholder.innerHTML = '<div class="flex flex-col items-center gap-4"><div class="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><p class="text-zinc-400 text-sm">Converting to image...</p></div>';
  resultSection.scrollIntoView({ behavior: 'smooth' });
  setStatus('Converting text to image...');

  setTimeout(() => {
    fontsReady.then(() => {
    try {
      const fSize = parseInt(fontSize.value) || 14;
      const fFamily = fontFamily.value || 'JetBrains Mono';
      const pad = parseInt(padding.value) || 40;
      const bg = bgColor.value || '#ffffff';
      const fg = textColor.value || '#1a1a1a';
      const format = outputFormat.value || 'png';
      const [imgW, imgH] = getDimensionsFromRatio(aspectRatioSelect?.value);
      const { canvas, ctx } = createHiDPICanvas(imgW, imgH);

      renderContentToCanvas(canvas, ctx, fileContent, fFamily, fSize, pad, bg, fg, imgW, imgH);

      const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      resultImage.src = canvas.toDataURL(mime, 0.92);
      resultImage.alt = 'Converted image: ' + currentFileName;
      resultPlaceholder.classList.add('hidden'); resultImage.classList.remove('hidden');
      resultImage.classList.add('animate-in');
      setupDownload(canvas, mime, format);
      setStatus('Conversion complete: ' + currentFileName);
      showToast('Image ready! Scroll down to preview.', 'success');
    } catch (err) {
      showToast('Error converting file. Please try again.', 'error');
      setStatus('Conversion failed');
    } finally {
      convertBtn.disabled = false; convertBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    });
  }, 300);
});

// Settings change triggers
if (fontSize) fontSize.addEventListener('change', () => { if (currentMode === 'text' && fileContent) doLivePreview(); });
if (fontFamily) fontFamily.addEventListener('change', () => { if (currentMode === 'text' && fileContent) doLivePreview(); });
if (bgColor) bgColor.addEventListener('input', () => { if (currentMode === 'text' && fileContent) doLivePreview(); });
if (textColor) textColor.addEventListener('input', () => { if (currentMode === 'text' && fileContent) doLivePreview(); });
if (padding) padding.addEventListener('change', () => { if (currentMode === 'text' && fileContent) doLivePreview(); });
if (aspectRatioSelect) aspectRatioSelect.addEventListener('change', () => { if (currentMode === 'text' && fileContent) doLivePreview(); });

// Back to top
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('opacity-0', window.scrollY < 600);
    backToTop.classList.toggle('pointer-events-none', window.scrollY < 600);
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
