import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

export default function Navbar({ onDateChange, selectedDate }) {
  const [error, setError] = useState(null);
   const[sortByDate,setSortByDate]=useState("");
  const handleSortByDate = async (date) => {
    if (!date) return;
    try {
      onDateChange(date);
    } catch (err) {
      setError(err.message);
    }
  };
   const handleResetToToday = () => {
    setSortByDate(null);  // Reset date filter to today
    setOffset(0); // Reset offset to load from the start
    setArticles([]); // Clear articles
  };

  return (
    <nav className="flex justify-between items-center w-full mx-auto max-w-3xl px-4 py-4 relative">
     
      <div>
        <Link to="/">
          <h1 className="text-4xl font-quadrillion text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-violet-700"
          onClick={handleResetToToday} 
          >
            BuzzBrief
          </h1>
        </Link>
      </div>

      
      <div className="relative">
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-700 to-violet-700 blur-sm z-0"
        ></div>
        <DatePicker
          selected={sortByDate}
          onChange={handleSortByDate}
          dateFormat="yyyy-MM-dd"
          className="relative z-10 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none cursor-pointer bg-white"
          maxDate={new Date()}
          placeholderText="Select a date"
        />
      </div>
    </nav>
  );
}
