// Tidies an edited day before saving: drops empty paragraphs and empty lines.
function cleanItems(items) {
  return (items || [])
    .map((it) => {
      if (typeof it === 'string') return it.trim();
      if (it.lines) return { lines: it.lines.filter((l) => l.trim()) };
      if (it.quotes) return { quotes: it.quotes.filter((q) => q.trim()) };
      if (it.b !== undefined) return { b: it.b.trim() };
      if (it.h !== undefined) return { h: it.h.trim() };
      return it;
    })
    .filter((it) => (typeof it === 'string' ? it : !(it.lines && !it.lines.length) && !(it.quotes && !it.quotes.length) && it.b !== '' && it.h !== ''));
}

export function clean(day) {
  const d = { ...day, title: (day.title || '').trim(), question: (day.question || '').trim(), intro: cleanItems(day.intro) };
  for (const k of ['task', 'game', 'extra']) if (d[k]) d[k] = { ...d[k], body: cleanItems(d[k].body) };
  return d;
}
