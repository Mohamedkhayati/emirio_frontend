import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function DebugAuth() {
    const [debugInfo, setDebugInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem("emirio_token");
                const role = localStorage.getItem("role");
                
                console.log("🔍 DebugAuth - Token:", token ? "Present (length: " + token.length + ")" : "Not found");
                console.log("🔍 DebugAuth - Stored role:", role);
                
                const response = await api.get("/api/admin/debug/auth");
                setDebugInfo(response.data);
            } catch (err) {
                console.error("❌ DebugAuth error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuth();
    }, []);

    if (loading) return <div>Loading debug info...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: "20px", background: "#f0f0f0", margin: "20px", borderRadius: "8px" }}>
            <h3>🔍 Authentication Debug Info</h3>
            <pre style={{ background: "#fff", padding: "10px", overflow: "auto" }}>
                {JSON.stringify(debugInfo, null, 2)}
            </pre>
        </div>
    );
}