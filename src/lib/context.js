// Shared app context: which data source we use (real database or preview samples).
export const AppContext = React.createContext({ api: null, isPreview: true });
export const useApp = () => React.useContext(AppContext);
