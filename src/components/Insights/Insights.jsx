
import React from "react";
import { useStore } from "../../store/useStore";

export default function Insights(){
  const { transactions } = useStore();
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2>Insights</h2>
      <p>Total: {transactions.length}</p>
    </div>
  )
}
