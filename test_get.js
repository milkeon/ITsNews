const https = require('https');
https.get('https://api.codetabs.com/v1/proxy?quest=https://it.donga.com/108663/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const descMatch = data.match(/<meta\\s+(?:name|property)=["'](?:og:)?description["']\\s+content=["']([^"']+)["']/i);
        console.log("DESC:", descMatch ? descMatch[1] : 'NONE');
        const pMatch = data.match(/<p[^>]*>([^<]{40,})<\\/p>/gi);
        console.log("P count:", pMatch ? pMatch.length : 0);
    });
});
