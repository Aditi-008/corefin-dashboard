
import React from "react";
import { useStore } from "../../store/useStore";

export default function Transactions(){
  const { transactions } = useStore();
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2>Transactions</h2>
      {transactions.map(t=>(
        <div key={t.id}>{t.category} ₹{t.amount}</div>
      ))}
    </div>
  )
}
