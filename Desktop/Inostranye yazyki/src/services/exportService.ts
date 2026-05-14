import { Dictionary, Word } from '../types';

export function exportDictionaryCSV(dict: Dictionary): void {
  const header = 'term,translation,phonetic,partOfSpeech,examples,tags,difficulty';
  const rows = dict.words.map(w =>
    [
      `"${w.term.replace(/"/g, '""')}"`,
      `"${w.translation.replace(/"/g, '""')}"`,
      `"${(w.phonetic || '').replace(/"/g, '""')}"`,
      `"${(w.partOfSpeech || '').replace(/"/g, '""')}"`,
      `"${w.examples.join('|').replace(/"/g, '""')}"`,
      `"${w.tags.join('|').replace(/"/g, '""')}"`,
      w.difficulty,
    ].join(',')
  );
  const csv = [header, ...rows].join('\n');
  downloadFile(`${dict.name}.csv`, csv, 'text/csv;charset=utf-8;');
}

export function exportDictionaryJSON(dict: Dictionary): void {
  const json = JSON.stringify({ name: dict.name, language: dict.language, words: dict.words }, null, 2);
  downloadFile(`${dict.name}.json`, json, 'application/json');
}

export function exportAllJSON(dictionaries: Dictionary[]): void {
  const json = JSON.stringify({ exported: new Date().toISOString(), dictionaries }, null, 2);
  downloadFile('linguaai-backup.json', json, 'application/json');
}

export function parseCSVImport(text: string, language: Dictionary['language'], nativeLanguage: Dictionary['language']): Omit<Word, 'id'>[] {
  const lines = text.trim().split('\n');
  const start = lines[0].toLowerCase().startsWith('term') ? 1 : 0;
  return lines.slice(start).map(line => {
    const cols = parseCSVLine(line);
    return {
      term: cols[0] || '',
      translation: cols[1] || '',
      phonetic: cols[2] || undefined,
      partOfSpeech: cols[3] || undefined,
      examples: cols[4] ? cols[4].split('|') : [],
      tags: cols[5] ? cols[5].split('|') : [],
      difficulty: (cols[6] as Word['difficulty']) || 'beginner',
      language,
      nativeLanguage,
    };
  }).filter(w => w.term && w.translation);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function speakWord(text: string, lang: string): void {
  if (!('speechSynthesis' in window)) return;
  const LANG_CODES: Record<string, string> = {
    en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
    it: 'it-IT', zh: 'zh-CN', ja: 'ja-JP', pt: 'pt-BR',
  };
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_CODES[lang] || 'en-US';
  utterance.rate = 0.85;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
