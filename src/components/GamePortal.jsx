import { useState, useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import UserProfile from "./UserProfile";
import AdminDashboard from "./AdminDashboard";
import Leaderboard from "./LeaderBoard";

const GAME_URL = import.meta.env.VITE_GAME_URL || null;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || "";
export default function GamePortal({ user }) {

    const [userData, setUserData] = useState(null);
    const [gameLoaded, setGameLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("game");

    useEffect(() => {
        const userRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUserData(snapshot.data());
            }
        });

        return () => unsubscribe();
    }, [user.uid]);

    const iframeRef = useRef(null);
    const retryTimer = useRef(null);
    const authAcknowledged = useRef(null);

    const sendAuthToGame = useCallback(async () => {
        if (!iframeRef.current?.contentWindow || !user || authAcknowledged.current) return;

        try {
            const idToken = await user.getIdToken();
            const payload = {
                type: "firebase-auth",
                displayName: user.displayName || user.email || "Player",
                idToken,
                projectId: FIREBASE_PROJECT_ID
            };
            iframeRef.current.contentWindow.postMessage(payload, "*");
            console.log("Auth token sent to iframe... waiting for ack");
        } catch (err) {
            console.error("Failed to send auth...", err);
        }
    }, [user]);

    const activeSessionRef = useRef(null);

    useEffect(() => {
        const handleMessage = async (event) => {
            if (event.data?.type === "firebase-auth-ack") {
                authAcknowledged.current = true;
                if (retryTimer.current) {
                    clearInterval(retryTimer.current);
                    retryTimer.current = null;
                }
            }
            if (event.data?.type === "game_start") {
                try {
                    const sessionDoc = await addDoc(collection(db, "telemetry_sessions"), {
                        userId: user.uid,
                        userEmail: user.email || "",
                        userName: user.displayName || user.email || "Player",
                        startTime: serverTimestamp(),
                        status: "playing"
                    });
                    activeSessionRef.current = sessionDoc.id;
                } catch (err) {
                }
            }
            if (event.data?.type === "game_end") {
                if (activeSessionRef.current) {
                    try {
                        await updateDoc(doc(db, "telemetry_sessions", activeSessionRef.current), {
                            endTime: serverTimestamp(),
                            score: event.data.score || 0,
                            pipesPassed: event.data.pipesPassed || 0,
                            status: "completed"
                        });
                        activeSessionRef.current = null;
                        
                        const currentHigh = userData?.highscore || 0;
                        const newScore = event.data.score || 0;
                        const currentGamesPlayed = userData?.gamesPlayed || 0;
                        
                        await updateDoc(doc(db, "users", user.uid), {
                            gamesPlayed: currentGamesPlayed + 1,
                            ...(newScore > currentHigh ? { highscore: newScore } : {})
                        });
                    } catch (err) {
                    }
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [user, userData]);

    const handleGameLoaded = useCallback(() => {
        setGameLoaded(true);
        authAcknowledged.current = false;
        sendAuthToGame();

        retryTimer.current = setInterval(sendAuthToGame, 2000);

        setTimeout(() => {
            if (retryTimer.current) {
                clearInterval(retryTimer.current);
                retryTimer.current = null;
                if (!authAcknowledged.current) {
                    console.warn("Game never acknowledged auth after 30s. Did you put the FirebaseManager in the scene?");
                }
            }
        }, 30000);
    }, [sendAuthToGame]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.log("Sign out error", err);
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px', alignItems: 'center' }}>
                <button onClick={() => setActiveTab("profile")} className="btn-primary" style={{ padding: '10px' }}>Profile</button>
                <button onClick={() => setActiveTab("game")} className="btn-primary" style={{ padding: '10px' }}>Game</button>
                {userData?.role === 'admin' && (
                    <button onClick={() => setActiveTab("admin")} className="btn-primary" style={{ padding: '10px' }}>Admin Dashboard</button>
                )}
                <button onClick={handleSignOut} className="btn-signout" style={{ padding: '10px', marginLeft: 'auto' }}>Sign Out</button>
            </div>

            {activeTab === "profile" && <UserProfile userData={userData} handleSignOut={handleSignOut} />}
            
            {activeTab === "game" && (
                <div className="portal-container">
                    <div className="game-area">
                        <iframe
                            ref={iframeRef}
                            src={GAME_URL}
                            title="Sponder Bird"
                            className={`game-frame ${gameLoaded ? "visible" : "hidden"}`}
                            allow="fullscreen"
                            onLoad={ handleGameLoaded }
                        />
                    </div>
                    <Leaderboard currentUserId={user.uid} />
                </div>
            )}
            
            {activeTab === "admin" && <AdminDashboard userData={userData} />}
        </div>
    )
}