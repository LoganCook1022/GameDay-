const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const runs = [];
function para(text, opts = {}) {
  const style = opts.style ? `<w:pPr><w:pStyle w:val="${opts.style}"/></w:pPr>` : '';
  const b = opts.bold ? '<w:rPr><w:b/></w:rPr>' : '';
  const i = opts.italic ? '<w:rPr><w:i/></w:rPr>' : '';
  const rpr = opts.bold ? b : (opts.italic ? i : '');
  runs.push(`<w:p>${style}<w:r>${rpr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`);
}
function heading(text, level) {
  runs.push(`<w:p><w:pPr><w:pStyle w:val="Heading${level}"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`);
}

// simple inline bold **x** parsing
function richPara(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const r = parts.map(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(p.slice(2, -2))}</w:t></w:r>`;
    }
    return `<w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r>`;
  }).join('');
  runs.push(`<w:p>${r}</w:p>`);
}

function cell(text, opts = {}) {
  const shade = opts.header ? '<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>' : '';
  const b = opts.header ? '<w:rPr><w:b/></w:rPr>' : '';
  const parts = ' ' + text;
  const r = parts.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(p.slice(2, -2))}</w:t></w:r>`;
    }
    return `<w:r>${b}<w:t xml:space="preserve">${esc(p)}</w:t></w:r>`;
  }).join('');
  return `<w:tc><w:tcPr>${shade}<w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p>${r}</w:p></w:tc>`;
}

function table(rows) {
  let xml = '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>';
  for (const edge of ['top','left','bottom','right','insideH','insideV']) {
    xml += `<w:${edge} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`;
  }
  xml += '</w:tblBorders></w:tblPr>';
  rows.forEach((row, ri) => {
    xml += '<w:tr>';
    row.forEach(c => { xml += cell(c, { header: ri === 0 }); });
    xml += '</w:tr>';
  });
  xml += '</w:tbl>';
  runs.push(xml);
}

// ---- Build document content from markdown ----
const srcFile = process.argv[2] || 'DELIVERABLE-WEEK5.md';
const outFile = srcFile.replace(/\.md$/, '.docx');
const md = fs.readFileSync(path.join(__dirname, srcFile), 'utf8').split('\n');

let i = 0;
function parseTable(start) {
  const rows = [];
  let j = start;
  while (j < md.length && md[j].trim().startsWith('|')) {
    const line = md[j].trim();
    if (/^\|[\s\-:|]+\|$/.test(line)) { j++; continue; }
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
    rows.push(cells);
    j++;
  }
  return { rows, next: j };
}

while (i < md.length) {
  const line = md[i];
  const t = line.trim();
  if (t === '') { i++; continue; }
  if (t === '---') { i++; continue; }
  if (t.startsWith('```')) {
    i++;
    const buf = [];
    while (i < md.length && !md[i].trim().startsWith('```')) { buf.push(md[i]); i++; }
    i++;
    buf.forEach(l => para(l, { style: 'NoSpacing' }));
    continue;
  }
  if (t.startsWith('|')) {
    const { rows, next } = parseTable(i);
    table(rows);
    i = next;
    continue;
  }
  if (t.startsWith('#### ')) { heading(t.slice(5), 4); i++; continue; }
  if (t.startsWith('### ')) { heading(t.slice(4), 3); i++; continue; }
  if (t.startsWith('## ')) { heading(t.slice(3), 2); i++; continue; }
  if (t.startsWith('# ')) { heading(t.slice(2), 1); i++; continue; }
  if (t.startsWith('> ')) { para(t.slice(2), { italic: true }); i++; continue; }
  if (/^\d+\.\s/.test(t)) { richPara(t.replace(/^\d+\.\s/, '')); i++; continue; }
  if (t.startsWith('- ')) { para(t.slice(2)); i++; continue; }
  richPara(t);
  i++;
}

const body = runs.join('');

const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="NoSpacing"><w:name w:val="No Spacing"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
</w:styles>`;

const outPath = path.join(__dirname, outFile);
const out = fs.createWriteStream(outPath);
const archive = archiver('zip', { zlib: { level: 9 } });
out.on('close', () => console.log('Wrote', outPath));
archive.pipe(out);
archive.append(contentTypes, { name: '[Content_Types].xml' });
archive.append(rels, { name: '_rels/.rels' });
archive.append(docRels, { name: 'word/_rels/document.xml.rels' });
archive.append(docXml, { name: 'word/document.xml' });
archive.append(styles, { name: 'word/styles.xml' });
archive.finalize();
