const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

async function testFetch() {
    const id = "1";
    const startDate = "2026-06-12T05:32:53.000Z";
    let deviceId = id;
    try {
        const latestRes = await fetch(`${BACKEND_URL}/api/v1/datalogs/latest?device_type=HYDROPONIC_RACKS`, { cache: "no-store" });
        if (latestRes.ok) {
            const latestRows = await latestRes.json();
            const rackRecord = latestRows.find((r) => r.rack_id === Number(id));
            if (rackRecord && rackRecord.device_id) {
                deviceId = rackRecord.device_id.toString();
            }
        }
    } catch (e) {
        console.error("Failed to map rack_id to device_id:", e);
    }

    const fetchUrl = `${BACKEND_URL}/api/v1/datalogs/${deviceId}?start_date=${encodeURIComponent(startDate)}&limit=1000`;
    console.log("Fetching:", fetchUrl);
    try {
        const res = await fetch(fetchUrl, { cache: "no-store" });
        console.log("res.ok:", res.ok);
        console.log("res.status:", res.status);
        if (!res.ok) {
            console.log(await res.text());
        } else {
            const data = await res.json();
            console.log("Data length:", data.length);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testFetch();
