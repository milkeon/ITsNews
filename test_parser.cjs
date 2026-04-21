const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

async function test() {
    try {
        const url = 'https://it.donga.com/108616/';
        console.log("Fetching: ", url);
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
        
        console.log("Status: ", res.status, res.statusText);
        const html = await res.text();
        console.log("HTML length: ", html.length);
        
        if (html.includes('Oops... Request Timeout')) {
            console.log("Got Request Timeout from proxy");
            return;
        }

        const dDoc = new JSDOM(html).window.document;
        const metaDesc = dDoc.querySelector('meta[property="og:description"], meta[name="description"]');
        if (metaDesc && (metaDesc.content || '').trim().length > 10) {
            console.log("META DESC FOUND:");
            console.log((metaDesc.content || '').trim().substring(0, 150) + '...');
        } else {
            console.log("No Meta Desc, looking for <p>");
            const p = Array.from(dDoc.querySelectorAll('p')).find(p => (p.textContent||'').trim().length > 40);
            if (p) console.log("P TAG FOUND:", p.textContent.trim().substring(0, 150) + '...');
            else console.log("NOTHING FOUND");
        }
    } catch(e) {
        console.error(e);
    }
}
test();
