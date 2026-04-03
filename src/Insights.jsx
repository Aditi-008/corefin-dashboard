import React from "react";
import { useStore } from "../../store/useStore";

export default function Insights() {
  const { transactions } = useStore();

  const map = {};
  transactions.forEach(t => {
    if (t.type === "expense") {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
  });

  const highest = Object.entries(map).sort((a,b)=>b[1]-a[1])[0];

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-4 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-2">Insights</h3>

      {highest ? (
        <p>
          You spend most on <b>{highest[0]}</b> (₹{highest[1]})
        </p>
      ) : (
        <p>No data</p>
      )}
    </div>
  );
}