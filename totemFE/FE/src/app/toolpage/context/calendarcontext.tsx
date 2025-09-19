"use client";

import { createContext, useContext, useState } from "react";

interface CalendarContextType {
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export const CalendarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  return (
    <CalendarContext.Provider
      value={{ selectedDate, setSelectedDate, currentMonth, setCurrentMonth }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};
