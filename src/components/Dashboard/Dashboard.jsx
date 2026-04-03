
import React from "react";
import { useStore } from "../../store/useStore";
import { LineChart, Line, XAxis, Tooltip } from "recharts";

export default function Dashboard(){
  const { transactions } = useStore();
  const data = transactions.map(t=>({date:t.date, amount:t.amount}));
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2>Dashboard</h2>
      <LineChart width={300} height={200} data={data}>
        <XAxis dataKey="date"/>
        <Tooltip/>
        <Line dataKey="amount"/>
      </LineChart>
    </div>
  )
}
