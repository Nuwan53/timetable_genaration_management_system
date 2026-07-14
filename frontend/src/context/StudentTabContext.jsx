/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const StudentTabContext = createContext(null);

export function StudentTabProvider({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <StudentTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </StudentTabContext.Provider>
  );
}

export const useStudentTab = () => useContext(StudentTabContext);
