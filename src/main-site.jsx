// The real app: connected to Supabase.
import { App } from './App.jsx';
import { api } from './lib/api-supabase.js';

document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';
ReactDOM.createRoot(document.getElementById('root')).render(<App api={api} />);
