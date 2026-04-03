import React, { useState } from "react";
import { useStore } from "../../store/useStore";

export default function Transactions() {
  const { transactions, role } = useStore();
  const [search, setSearch] = useState("");

  const filtered = transactions
  .filter(t =>
    t.category?.toLowerCase().includes(search.toLowerCase()) ||
    t.type?.toLowerCase().includes(search.toLowerCase()) ||
    t.date?.includes(search) ||
    String(t.amount).includes(search)
  )
  .sort((a, b) => {
    let va = a[sortField], vb = b[sortField];
    if (sortField === "amount") { va = +va; vb = +vb; }

    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-4 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-4">Transactions</h3>

      <input
        type="text"
        placeholder="Search..."
        className="p-2 border rounded w-full mb-4 dark:bg-gray-700"
        onChange={(e) => setSearch(e.target.value)}
      />

      {role === "admin" && (
        <button className="mb-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          + Add Transaction
        </button>
      )}

      <table className="w-full text-center">
        <thead>
          <tr className="text-gray-500">
            <th>Date</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Type</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map(t => (
            <tr key={t.id} className="border-t hover:bg-gray-100 dark:hover:bg-gray-700">
              <td>{t.date}</td>
              <td>₹{t.amount}</td>
              <td>{t.category}</td>
              <td>{t.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}