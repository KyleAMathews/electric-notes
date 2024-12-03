import React from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';

function App() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <Editor />
    </div>
  );
}

export default App;