// The sales page.
import { SalesPage, ThanksPage } from './screens/Sales.jsx';

document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';
// /join/thanks/ is the page Grow returns her to after paying.
const isThanks = /\/thanks(\/(index\.html)?)?$/.test(location.pathname) || location.hash === '#thanks';
ReactDOM.createRoot(document.getElementById('root')).render(isThanks ? <ThanksPage /> : <SalesPage />);
