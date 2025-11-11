import { useState } from 'react';

export default function Home() {
    const [keywords, setKeywords] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchKeywords = async () => {
        setLoading(true);
        setKeywords(null);
        try {
            const res = await fetch('/api/keywords');
            const data = await res.json();
            setKeywords(data.keywords);
        } catch (err) {
            setKeywords('Error fetching keywords.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
            <h1>NYTimes News Keywords</h1>
            <button onClick={fetchKeywords} disabled={loading}>
                {loading ? 'Fetching...' : 'Generate Keywords'}
            </button>
            {keywords && (
                <div style={{ marginTop: 20 }}>
                    <h3>Generated Keywords:</h3>
                    <p>{keywords}</p>
                </div>
            )}
        </div>
    );
}
