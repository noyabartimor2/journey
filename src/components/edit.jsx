// Content editing in place (admins, and everyone in the preview).
// When editing is on, texts on the day page become typeable; changes are kept as a draft
// until "שמירה" sends the whole day to the database.
const { useRef, useEffect, useLayoutEffect } = React;

// A piece of text that can be typed into directly when `editing` is on.
// Multiline: each line of the box is one item (used for short stacked lines and quotes).
export function Editable({ as: Tag = 'span', value, onChange, editing, multiline, className, placeholder, children, ...rest }) {
  const ref = useRef(null);
  const text = multiline ? (value || []).join('\n') : (value || '');

  // Keep the box in sync with the draft, but never while she's typing in it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== text) el.innerText = text;
  }, [text, editing]);

  if (!editing) return <Tag className={className} {...rest}>{children !== undefined ? children : value}</Tag>;

  const commit = () => {
    const raw = ref.current.innerText.replace(/ /g, ' ');
    const next = multiline ? raw.split('\n').map((l) => l.trim()).filter(Boolean) : raw.replace(/\s*\n\s*/g, ' ').trim();
    if (JSON.stringify(next) !== JSON.stringify(multiline ? value || [] : value || '')) onChange(next);
  };
  const onKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
  };
  return (
    <Tag ref={ref} className={`${className || ''} editable`} contentEditable="plaintext-only" suppressContentEditableWarning
      dir="auto" data-placeholder={placeholder || 'לכתוב כאן…'} onBlur={commit} onKeyDown={onKeyDown} {...rest} />
  );
}

const TYPES = [
  { id: 'p', label: 'פסקה' },
  { id: 'b', label: 'משפט מודגש' },
  { id: 'h', label: 'כותרת קטנה' },
  { id: 'lines', label: 'שורות קצרות' },
  { id: 'quotes', label: 'ציטוטים' },
];

export function typeOf(it) {
  if (typeof it === 'string') return 'p';
  return ['b', 'h', 'lines', 'quotes', 'audio', 'widget'].find((k) => it[k] !== undefined) || 'p';
}
function textOf(it) {
  const t = typeOf(it);
  if (t === 'p') return [it];
  if (t === 'lines' || t === 'quotes') return it[t];
  return [it[t]];
}
function asType(it, type) {
  const lines = textOf(it);
  if (type === 'lines' || type === 'quotes') return { [type]: lines };
  const s = lines.join(' ');
  return type === 'p' ? s : { [type]: s };
}

// The small toolbar above each text piece while editing.
export function PieceTools({ items, index, onChange }) {
  const it = items[index];
  const type = typeOf(it);
  const set = (next) => onChange(next);
  const move = (d) => {
    const j = index + d;
    if (j < 0 || j >= items.length) return;
    const next = items.slice(); [next[index], next[j]] = [next[j], next[index]]; set(next);
  };
  const add = () => { const next = items.slice(); next.splice(index + 1, 0, ''); set(next); };
  const remove = () => {
    if ((type === 'audio' || type === 'widget') && !confirm('למחוק את הרכיב הזה מהיום?')) return;
    set(items.filter((_, i) => i !== index));
  };
  const editableType = type !== 'audio' && type !== 'widget';
  return (
    <div className="piece-tools" contentEditable={false}>
      {editableType ? (
        <select aria-label="סוג הטקסט" value={type} onChange={(e) => { const next = items.slice(); next[index] = asType(it, e.target.value); set(next); }}>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      ) : <span className="piece-kind">{type === 'audio' ? '🎧 הקלטה' : '✨ רכיב אינטראקטיבי'}</span>}
      <span className="spacer" />
      <button type="button" onClick={() => move(-1)} disabled={index === 0} aria-label="להזיז למעלה">↑</button>
      <button type="button" onClick={() => move(1)} disabled={index === items.length - 1} aria-label="להזיז למטה">↓</button>
      <button type="button" onClick={add} aria-label="להוסיף פסקה מתחת">＋</button>
      <button type="button" onClick={remove} aria-label="למחוק">🗑</button>
    </div>
  );
}

// Bottom bar while editing: how many days changed, save / discard / finish.
export function EditBar({ changed, saving, error, onSave, onDiscard, onExit, isPreview, changedLabel }) {
  return (
    <div className="edit-bar" role="region" aria-label="עריכת תוכן">
      <div className="edit-bar-text">
        <strong>מצב עריכה</strong>
        <span>{error ? error : saving ? 'שומרת…' : changed ? (changedLabel || `${changed === 1 ? 'יום אחד' : `${changed} ימים`} עם שינויים שלא נשמרו`) : 'לוחצים על כל טקסט ומקלידים. **כוכביות** = הדגשה.'}</span>
        {isPreview && <span className="note">בתצוגה המקדימה השינויים לא נשמרים באמת.</span>}
      </div>
      <div className="edit-bar-actions">
        {changed > 0 && <button className="btn quiet" onClick={onDiscard} disabled={saving}>ביטול</button>}
        {changed > 0
          ? <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? 'שומרת…' : 'שמירה'}</button>
          : <button className="btn primary" onClick={onExit}>סיום</button>}
      </div>
    </div>
  );
}

// Warn before leaving the page with unsaved edits.
export function useUnsavedWarning(active) {
  useEffect(() => {
    if (!active) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [active]);
}
