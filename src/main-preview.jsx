// The design preview: sample content, no accounts.
import { App } from './App.jsx';
import { api } from './lib/api-sample.js';

document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';
ReactDOM.createRoot(document.getElementById('root')).render(<App api={api} />);
