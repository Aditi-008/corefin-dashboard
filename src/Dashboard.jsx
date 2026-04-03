import React from "react";
import { useStore } from "../../store/useStore";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, Tooltip, PieChart, Pie } from "recharts";

export default function Dashboard() {
  const { transactions } = useStore();

  const income = transactions.filter(t => t.type === "income").reduce((a,b)=>a+b.amount,0);
  const expense = transactions.filter(t => t.type === "expense").reduce((a,b)=>a+b.amount,0);
  const balance = income - expense;

  const data = transactions.map(t => ({ date: t.date, amount: t.amount }));

  const Card = ({ title, value, color }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-5 rounded-2xl shadow bg-gradient-to-r ${color} text-white`}
    >
      <p>{title}</p>
      <h2 className="text-2xl font-bold mt-2">₹{value}</h2>
    </motion.div>
  );

  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Balance" value={balance} color="from-indigo-500 to-indigo-700" />
        <Card title="Income" value={income} color="from-green-500 to-green-700" />
        <Card title="Expenses" value={expense} color="from-red-500 to-red-700" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-4 rounded-2xl shadow">
          <h4 className="mb-2 font-semibold">Trend</h4>
          <LineChart width={350} height={250} data={data}>
            <XAxis dataKey="date" />
            <Tooltip />
            <Line dataKey="amount" stroke="#6366f1" strokeWidth={3} />
          </LineChart>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg p-4 rounded-2xl shadow">
          <h4 className="mb-2 font-semibold">Categories</h4>
          <PieChart width={300} height={250}>
            <Pie
              data={[
                { name: "Income", value: income },
                { name: "Expense", value: expense }
              ]}
              dataKey="value"
            />
          </PieChart>
        </div>

      </div>
    </div>
  );
}