import { useState, useEffect } from "react";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard({ userData }) {
    const [usersStats, setUsersStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const q = query(collection(db, "users"), orderBy('highscore', "desc"), limit(10));
                const snapshot = await getDocs(q);
                let data = [];
                snapshot.forEach(doc => {
                    const u = doc.data();
                    data.push({
                        name: u.displayName || u.email || "Player",
                        gamesPlayed: u.gamesPlayed || 0,
                        highscore: u.highscore || 0
                    });
                });
                setUsersStats(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
                setLoading(false);
            }
        };

        if (userData?.role === 'admin') {
            fetchStats();
        }
    }, [userData]);

    if (userData?.role !== 'admin') {
        return (
            <div className="portal-container" style={{ textAlign: "center", marginTop: "20px" }}>
                <h2>Access Denied</h2>
                <p>You must be an admin to view this page.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="portal-container"><p>Loading admin data...</p></div>;
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#19FF5A', '#A319FF', '#FF5A19', '#5A19FF'];

    return (
        <div className="portal-container" style={{ paddingBottom: '50px' }}>
            <h2 className="card-title" style={{ textAlign: "center", margin: "20px 0" }}>Admin Dashboard</h2>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>
                
                <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px" }}>
                    <h3 style={{ textAlign: "center", marginBottom: "20px" }}>High Scores by User</h3>
                    <BarChart width={600} height={300} data={usersStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke="#ccc" />
                        <YAxis stroke="#ccc" />
                        <Tooltip wrapperStyle={{ backgroundColor: "#333", color: "#fff" }} />
                        <Legend />
                        <Bar dataKey="highscore" fill="#8884d8" name="High Score" />
                    </BarChart>
                </div>

                <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px" }}>
                    <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Games Played Share</h3>
                    <PieChart width={400} height={400}>
                        <Pie
                            data={usersStats}
                            dataKey="gamesPlayed"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            fill="#82ca9d"
                            label
                        >
                            {usersStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip wrapperStyle={{ backgroundColor: "#333", color: "#fff" }} />
                        <Legend />
                    </PieChart>
                </div>

            </div>
        </div>
    );
}
