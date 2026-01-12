const crypto = require("crypto");

function getDirectionIcon(direction) {
    switch(direction) {
        case "DoubleUp":      return "angles-up";
        case "SingleUp":      return "arrow-up";
        case "FortyFiveUp":   return "arrow-turn-up";
        case "Flat":          return "arrow-right";
        case "FortyFiveDown": return "arrow-turn-down";
        case "SingleDown":    return "arrow-down";
        case "DoubleDown":    return "angles-down";
    }
    return "circle";
}

async function fetchData(config) {
    const apiSecretHash = crypto.createHash('sha1')
        .update(config.secret)
        .digest('hex');
    
    const apiUrl = `https://${config.username}.nightscout.cz/API/V1/entries?count=3`;
    
    console.log(`[MMM-Nightscoutcz] Sending request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
        headers: {
            'API-SECRET': apiSecretHash,
            'Accept': 'application/json'
        }
    });

    console.log(`[MMM-Nightscoutcz] Response status: ${response.status}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[MMM-Nightscoutcz] Received ${data.length} entries from API`);

    if (!Array.isArray(data)) {
        throw new Error('Wrong data format received from API');
    }

    if (data.length < 1) {
        throw new Error('No data entries received from API');
    }

    let itemDateTime = new Date(data[0].dateString).toLocaleString(config.locale);
    if (!config.showDate) {
        itemDateTime = new Date(data[0].dateString).toLocaleTimeString(config.locale, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const result = {
        date: itemDateTime,
        sg: Math.round(data[0].sgv / 18),
        direction: data[0].direction,
        directionIcon: getDirectionIcon(data[0].direction),
    };

    console.log(`[MMM-Nightscoutcz] Returning result:`, result);

    return result;
}

module.exports = {
    getDirectionIcon,
    fetchData
};
