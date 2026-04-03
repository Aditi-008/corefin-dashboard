import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [showUser, setShowUser] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [page, setPage] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("daily");

  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const pieRef = useRef(null);
  const pieInstance = useRef(null);

  useEffect(() => { localStorage.setItem("transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("theme", darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => {
    const close = () => setShowUser(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (page !== "dashboard") return;
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const grouped = {};
    transactions.forEach((t) => {
      let key;
      if (view === "daily") key = t.date;
      else if (view === "monthly") key = t.date.slice(0, 7);
      else key = t.date.slice(0, 4);
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      if (t.type === "income") grouped[key].income += t.amount;
      else grouped[key].expense += t.amount;
    });
    const labels = Object.keys(grouped).sort();
    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Income", data: labels.map(l => grouped[l].income), borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.2)", tension: 0.4, fill: true },
          { label: "Expense", data: labels.map(l => grouped[l].expense), borderColor: "#fb7185", backgroundColor: "rgba(251,113,133,0.2)", tension: 0.4, fill: true }
        ]
      }
    });
  }, [transactions, page, view]);

  useEffect(() => {
    if (page !== "dashboard") return;
    if (!pieRef.current) return;
    if (pieInstance.current) pieInstance.current.destroy();
    const expenses = transactions.filter(t => t.type === "expense");
    if (expenses.length === 0) return;
    const catMap = {};
    expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const labels = Object.keys(catMap);
    const data = labels.map(l => catMap[l]);
    const colors = ["#a78bfa","#fb7185","#34d399","#fbbf24","#60a5fa","#f472b6","#4ade80","#f97316"];
    pieInstance.current = new Chart(pieRef.current, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
      options: { plugins: { legend: { position: "right" } }, cutout: "65%" }
    });
  }, [transactions, page]);

  if (!user) return <Login setUser={setUser} darkMode={darkMode} />;

  const income = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthExp = transactions.filter(t => t.type === "expense" && t.date?.startsWith(thisMonth)).reduce((a, b) => a + b.amount, 0);
  const lastMonthExp = transactions.filter(t => t.type === "expense" && t.date?.startsWith(lastMonth)).reduce((a, b) => a + b.amount, 0);
  const monthDiff = thisMonthExp - lastMonthExp;
  const monthDiffText = lastMonthExp === 0 ? "No data for last month"
    : monthDiff > 0 ? `📈 Spent ₹${monthDiff} more than last month`
    : monthDiff < 0 ? `📉 Spent ₹${Math.abs(monthDiff)} less than last month`
    : "Same spending as last month";
  const topCat = (() => {
    const catMap = {};
    transactions.filter(t => t.type === "expense").forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `🏷 Most spent category: ${sorted[0][0]} (₹${sorted[0][1]})` : null;
  })();

  const filtered = transactions
    .filter(t => {
      const q = search.toLowerCase().trim();
      const cleanCat = t.category?.replace(/[^\w\s]/g, "").toLowerCase().trim();
      const matchesSearch = !q || (cleanCat?.includes(q) || t.type?.toLowerCase().includes(q) || t.date?.includes(q) || String(t.amount).includes(q));
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesCat = categoryFilter === "all" || t.category === categoryFilter;
      return matchesSearch && matchesType && matchesCat;
    })
    .sort((a, b) => {
      const va = sortField === "amount" ? Number(a.amount) : a[sortField];
      const vb = sortField === "amount" ? Number(b.amount) : b[sortField];
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };
  const sortIcon = (field) => sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : " ⇅";
  const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];

  const downloadCSV = () => {
    const csv = [["Date","Amount","Type","Category"], ...transactions.map(t => [t.date, t.amount, t.type, t.category])].map(e => e.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = "corefin-report.csv";
    a.click();
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Delete your account? All data will be lost. This cannot be undone.")) {
      localStorage.removeItem("user");
      localStorage.removeItem("transactions");
      setUser(null);
    }
  };

  const addTransaction = (tx) => { setTransactions([tx, ...transactions]); setShowModal(false); };
  const deleteTransaction = (id) => setTransactions(transactions.filter(t => t.id !== id));

  const bg = darkMode ? "bg-gradient-to-br from-[#0f0f1a] via-[#1a1b2e] to-[#2a2b3d] text-white" : "bg-gradient-to-br from-gray-100 to-gray-200 text-black";
  const card = darkMode ? "bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg" : "bg-white shadow-md";
  const sidebar = darkMode ? "bg-[#121225]/80 backdrop-blur-lg border-r border-white/10" : "bg-white border-r";
  const input = darkMode ? "bg-white/10 border border-white/20 text-white" : "bg-white border text-black";
  const topbar = darkMode ? "bg-[#121225]/80 backdrop-blur-lg border-b border-white/10" : "bg-white border-b";
  const selectCls = darkMode ? "bg-[#1f2035] text-white border border-white/20" : "bg-white border text-black";

  return (
    <div className={`flex min-h-screen ${bg}`}>

      {/* SIDEBAR */}
      <div className={`w-64 p-6 ${sidebar}`}>
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent">CoreFin</span>
        </h1>
        <div className="mt-6 space-y-3">
          <p onClick={() => setPage("dashboard")} className="cursor-pointer hover:text-[#a78bfa] transition hover:translate-x-1">Dashboard</p>
          <p onClick={() => setPage("transactions")} className="cursor-pointer hover:text-[#a78bfa] transition hover:translate-x-1">Transactions</p>
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-6 w-full p-2 bg-black text-white rounded">
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* MAIN */}
      <div className="flex-1">

        {/* TOPBAR — search removed */}
        <div className={`flex justify-between items-center p-4 gap-4 ${topbar}`}>
          <h2 className="font-semibold shrink-0">{page.toUpperCase()}</h2>
          <div className="flex gap-4 items-center ml-auto">
            <button onClick={() => setDarkMode(prev => !prev)}>{darkMode ? "☀️" : "🌙"}</button>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowUser(prev => !prev); }}
                className="bg-[#a78bfa] px-3 py-1 rounded text-black">{user.name}</button>
              {showUser && (
                <div className={`absolute right-0 mt-2 w-36 rounded shadow z-10 overflow-hidden ${darkMode ? "bg-[#1a1b2e] text-white border border-white/10" : "bg-white text-black border"}`}>
                  <p className="p-2 cursor-pointer hover:bg-white/10 transition"
                    onClick={(e) => { e.stopPropagation(); setShowUser(false); setShowProfile(true); }}>Profile</p>
                  <p className="p-2 cursor-pointer hover:bg-white/10 transition"
                    onClick={() => { localStorage.removeItem("user"); setUser(null); }}>Logout</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between">
            <select value={view} onChange={(e) => setView(e.target.value)} className={`p-2 rounded ${selectCls}`}>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <div className="flex gap-2">
              <button onClick={downloadCSV} className="bg-green-500 px-4 py-2 rounded text-white">Download</button>
              {role === "admin" && (
                <button onClick={() => setShowModal(true)} className="bg-[#a78bfa] text-black px-4 py-2 rounded">+ Add</button>
              )}
            </div>
          </div>

          {page === "dashboard" && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                <Card title="Income" value={income} card={card} />
                <Card title="Expense" value={expense} card={card} />
                <Card title="Balance" value={income - expense} card={card} />
              </div>
              <div className={`${card} p-6 rounded-2xl`}><canvas ref={chartRef}></canvas></div>
              <div className={`${card} p-6 rounded-2xl`}>
                <h2 className="font-semibold mb-4">Spending by Category</h2>
                {transactions.filter(t => t.type === "expense").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <span className="text-4xl mb-2">🍩</span>
                    <p className="text-sm">No expense data yet. Add transactions to see breakdown.</p>
                  </div>
                ) : (
                  <canvas ref={pieRef} style={{ maxHeight: 280 }}></canvas>
                )}
              </div>
              <div className={`${card} p-6 rounded-2xl`}>
                <h2 className="font-semibold mb-3">Insights</h2>
                <div className="space-y-2 text-sm">
                  <p>💸 Highest single expense: ₹{Math.max(...transactions.filter(t => t.type === "expense").map(t => t.amount), 0)}</p>
                  <p>💰 Total Income: ₹{income}</p>
                  <p>📉 Total Expense: ₹{expense}</p>
                  <p className={monthDiff > 0 ? "text-red-400" : "text-green-400"}>{monthDiffText}</p>
                  {topCat && <p className="text-[#a78bfa]">{topCat}</p>}
                  {income > 0 && <p>🏦 Savings rate: {(((income - expense) / income) * 100).toFixed(1)}%</p>}
                </div>
              </div>
            </>
          )}

          {page === "transactions" && (
            <div className={`${card} p-5 rounded-xl`}>
              {/* Search — only on transactions page */}
              <input
                placeholder="🔍  Search by amount, type, date, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`p-2 rounded w-full mb-4 ${input}`}
              />

              <div className="flex gap-3 mb-4 flex-wrap items-center">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`p-2 rounded text-sm ${selectCls}`}>
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`p-2 rounded text-sm ${selectCls}`}>
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2 ml-auto items-center">
                  <span className="text-xs opacity-40">Sort:</span>
                  <button onClick={() => handleSort("date")}
                    className={`px-3 py-1.5 rounded text-sm border transition ${sortField === "date" ? "bg-[#a78bfa] text-black border-[#a78bfa]" : darkMode ? "border-white/20 hover:bg-white/10" : "border-gray-300 hover:bg-gray-100"}`}>
                    Date {sortField === "date" ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
                  </button>
                  <button onClick={() => handleSort("amount")}
                    className={`px-3 py-1.5 rounded text-sm border transition ${sortField === "amount" ? "bg-[#a78bfa] text-black border-[#a78bfa]" : darkMode ? "border-white/20 hover:bg-white/10" : "border-gray-300 hover:bg-gray-100"}`}>
                    Amount {sortField === "amount" ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
                  </button>
                </div>
              </div>

              <p className="text-xs opacity-40 mb-3">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""} found</p>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-50">
                  <span className="text-5xl mb-3">🔍</span>
                  <p className="font-medium">No transactions found</p>
                  <p className="text-sm mt-1">{transactions.length === 0 ? "Add your first transaction using the + Add button" : "Try a different search term or filter"}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left opacity-60 border-b border-white/10">
                      <th className="pb-2 cursor-pointer select-none" onClick={() => handleSort("date")}>Date{sortIcon("date")}</th>
                      <th className="pb-2 cursor-pointer select-none" onClick={() => handleSort("amount")}>Amount{sortIcon("amount")}</th>
                      <th className="pb-2 cursor-pointer select-none" onClick={() => handleSort("type")}>Type{sortIcon("type")}</th>
                      <th className="pb-2 cursor-pointer select-none" onClick={() => handleSort("category")}>Category{sortIcon("category")}</th>
                      {role === "admin" && <th className="pb-2">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-2">{t.date}</td>
                        <td className="py-2 font-medium">₹{t.amount}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.type === "income" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{t.type}</span>
                        </td>
                        <td className="py-2">{t.category}</td>
                        {role === "admin" && (
                          <td className="py-2">
                            <button onClick={() => deleteTransaction(t.id)} className="text-red-400 hover:text-red-300 transition text-xs border border-red-400/30 px-2 py-0.5 rounded">Delete</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <Modal addTransaction={addTransaction} close={() => setShowModal(false)} />}

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-[#1a1b2e] text-white p-6 rounded-xl w-80 shadow-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">Profile</h2>
              <button onClick={() => setShowProfile(false)} className="opacity-50 hover:opacity-100 text-xl leading-none">✕</button>
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#c084fc] flex items-center justify-center text-2xl font-bold text-black">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="opacity-40 text-xs mb-1">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="opacity-40 text-xs mb-1">Job / Occupation</p>
                <p className="font-medium">{user.job || "—"}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="opacity-40 text-xs mb-1">Total Transactions</p>
                <p className="font-medium">{transactions.length}</p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3">
              <button onClick={handleDeleteAccount}
                className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition text-sm font-semibold">
                🗑 Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, card }) {
  return (
    <div className={`${card} p-6 rounded-2xl hover:scale-105 transition`}>
      <p className="text-gray-400">{title}</p>
      <h2 className="text-2xl font-bold">₹{value}</h2>
    </div>
  );
}

function Login({ setUser, darkMode }) {
  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const handleLogin = () => {
    if (!name.trim()) return;
    const userData = { name: name.trim(), job: job.trim() };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };
  return (
    <div className={`h-screen flex justify-center items-center ${darkMode ? "bg-[#0f0f1a] text-white" : "bg-gray-100 text-black"}`}>
      <div className="bg-white p-6 rounded-xl shadow w-72 space-y-3">
        <h2 className="text-xl font-bold text-center text-[#a78bfa]">CoreFin</h2>
        <p className="text-xs text-center text-gray-400">Sign in to continue</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name *"
          className="p-2 border block w-full rounded text-black" />
        <input value={job} onChange={(e) => setJob(e.target.value)} placeholder="Job / Occupation (optional)"
          className="p-2 border block w-full rounded text-black" />
        <button onClick={handleLogin} className="bg-[#a78bfa] px-4 py-2 rounded w-full text-black font-semibold">Login</button>
      </div>
    </div>
  );
}

function Modal({ close, addTransaction }) {
  const categories = [
    "🍕 Food","🏠 Rent","✈️ Travel","🛍️ Shopping","🧾 Bills",
    "🏥 Health","📚 Education","🎬 Entertainment","🛒 Groceries",
    "🚌 Transport","📱 Subscriptions","💰 Salary","💻 Freelance",
    "📈 Investment","✨ Others"
  ];
  const [form, setForm] = useState({ date: "", amount: "", category: "", customCategory: "", type: "expense" });
  const finalCategory = form.category === "✨ Others" ? form.customCategory : form.category;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-[#1a1b2e] text-white p-6 rounded-xl space-y-3 w-80 shadow-2xl border border-white/10">
        <h2 className="font-semibold text-lg">Add Transaction</h2>
        <input type="date" className="w-full p-2 rounded bg-white/10 border border-white/20" onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input type="number" placeholder="Amount" className="w-full p-2 rounded bg-white/10 border border-white/20" onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, customCategory: "" })}
          className="w-full p-2 rounded bg-[#1f2035] text-white border border-white/20">
          <option value="">Select Category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {form.category === "✨ Others" && (
          <input placeholder="Custom category" className="w-full p-2 rounded bg-white/10 border border-white/20"
            value={form.customCategory} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} />
        )}
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full p-2 rounded bg-[#1f2035] text-white border border-white/20">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <div className="flex gap-2 pt-2">
          <button onClick={() => addTransaction({ ...form, category: finalCategory, id: Date.now(), amount: Number(form.amount) })}
            className="flex-1 bg-[#a78bfa] text-black py-2 rounded font-semibold">Add</button>
          <button onClick={close} className="flex-1 bg-white/10 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}