import Leaderboard from "./LeaderBoard";

export default function UserProfile({ userData, handleSignOut }) {
    if (!userData) {
        return <div className="portal-container"><p>Loading profile...</p></div>;
    }

    return (
        <div className="portal-container">
            <div className="login-card" style={{ marginBottom: '20px' }}>
                <h2 className="card-title">User Profile</h2>
                <div style={{ textAlign: 'left', marginTop: '10px' }}>
                    <p><strong>Username:</strong> {userData.displayName || "Player"}</p>
                    <p><strong>Email:</strong> {userData.email}</p>
                    <p><strong>Role:</strong> {userData.role || "player"}</p>
                    <p><strong>High Score:</strong> {userData.highscore || 0}</p>
                    <p><strong>Games Played:</strong> {userData.gamesPlayed || 0}</p>
                </div>
            </div>
            
            <Leaderboard currentUserId={userData.uid} />
        </div>
    );
}
