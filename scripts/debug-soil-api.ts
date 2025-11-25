
async function debugSoil() {
    const lat = 52.0;
    const lng = 5.0;
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lng}&property=sand&property=clay&property=silt&depth=0-30cm&value=mean`;

    console.log("Fetching:", url);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Error status:", res.status);
            return;
        }
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

debugSoil();
