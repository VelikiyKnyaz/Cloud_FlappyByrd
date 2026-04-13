import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const LEADERBOARD_LIMIT = 10;

export default function Leaderboard({ currentUserId }) {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "users"), orderBy('highScore', "desc"), limit(LEADERBOARD_LIMIT));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id, ...doc.data(),
            }));

            setLeaders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="leaderboard-card">
                <h2 className="card-title">Leaderboard</h2>
                <div className="card-loading">
                    <div className="spinner" />
                </div>
            </div>
        )
    }

    return (
        <div className="leaderboard-card">
            <div className="card-header">
                <h2 className="card-title">Leaderboard</h2>
                <div className="card-badge">Top {LEADERBOARD_LIMIT}</div>
            </div>

            {leaders.length === 0 ? (
                <p>No scores yet :).</p>
            ) : (
                    <div className="leaderboard-list">
                        {leaders.map((player, index) => {
                            const isCurrentUser = player.id === currentUserId;
                            const rankClass =
                                index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : "";

                            return (
                                <div key={player.id} className={`leaderboard-row ${isCurrentUser ? "is-you" : ""}`}>
                                    <span className={`rank ${rankClass}`}>
                                        { index + 1 }
                                    </span>
                                    <div className="leader-info">
                                        <span className="leader-name">
                                            {player.displayName || "Anonymous"}
                                            {isCurrentUser && <span className="you-tag">YOU</span> }
                                        </span>
                                        
                                    </div>

                                    <div className="leader-stats">
                                        <span className="leader-score">{player.highScore ?? 0}</span>
                                        <span className="leader-games">{player.gamesPlayed ?? 0}</span>
                                    </div>

                                </div>
                                )
                        }) }
                    </div>
            )}
        </div>
    )
}