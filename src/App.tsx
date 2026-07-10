import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <Authenticator>
      <CalendarPage />
    </Authenticator>
  );
}

export default App;