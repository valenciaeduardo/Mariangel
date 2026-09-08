const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'img', 'extra');
const HTML = path.join(ROOT, 'index.html');

fs.mkdirSync(IMG_DIR, { recursive: true });

const html = fs.readFileSync(HTML, 'utf8');
const start = html.indexOf('const comidaExtra');
const end = html.indexOf('\n        };\n', start); // cierre de comidaExtra
const block = html.slice(start, end);

const entries = [];
const blocks = [...block.matchAll(/'([^']+)':\s*\[([^\]]+)\],?\n/g)];
for (const b of blocks) {
    const key = b[1];
    const arr = b[2].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
    if (arr.length >= 3) entries.push({ key, capital: arr[0], food: arr[1], desc: arr[2] });
}

function slugify(name) {
    return (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const TRA = {
    'Afghanistan': 'Kabuli pulao', 'Albania': 'byrek', 'Algeria': 'couscous', 'Andorra': 'escudella',
    'Angola': 'muamba', 'Antigua and Barbuda': 'pepperpot', 'Armenia': 'khorovats', 'Austria': 'Wiener Schnitzel',
    'Azerbaijan': 'plov', 'The Bahamas': 'conch salad', 'Bahrain': 'machboos', 'Bangladesh': 'hilsa',
    'Barbados': 'cou-cou flying fish', 'Belarus': 'draniki', 'Belize': 'rice and beans', 'Benin': 'akassa',
    'Bhutan': 'ema datshi', 'Bosnia and Herzegovina': 'cevapi', 'Botswana': 'seswaa', 'Brunei': 'ambuyat',
    'Bulgaria': 'banitsa', 'Burkina Faso': 'tô', 'Burundi': 'ibiharage', 'Cabo Verde': 'cachupa',
    'Cambodia': 'amok', 'Cameroon': 'ndole', 'Central African Republic': 'kanda', 'Chad': 'boule de mil',
    'Comoros': 'langouste', 'Republic of the Congo': 'saka saka', 'Democratic Republic of the Congo': 'fufu',
    'Curaçao': 'keshi yena', 'Cyprus': 'souvlaki', 'Czechia': 'svíčková', 'Denmark': 'smørrebrød',
    'Djibouti': 'fah-fah', 'Dominica': 'callaloo', 'Dominican Republic': 'la bandera', 'East Timor': 'ikan pepes',
    'Egypt': 'koshari', 'El Salvador': 'pupusa', 'Equatorial Guinea': 'garbanzo stew', 'Eritrea': 'zigni',
    'Estonia': 'verivorst', 'Eswatini': 'sidvudvu', 'Ethiopia': 'doro wat', 'Fiji': 'kokoda',
    'Finland': 'kalakukko', 'France': 'coq au vin', 'Gabon': 'poulet nyembwe', 'Gambia': 'domoda',
    'Georgia': 'khachapuri', 'Germany': 'sauerbraten', 'Ghana': 'jollof rice', 'Greece': 'moussaka',
    'Grenada': 'oil down', 'Guatemala': 'pepián', 'Guinea': 'yassa', 'Guinea-Bissau': 'mancarra',
    'Guyana': 'pepperpot', 'Haiti': 'griot', 'Honduras': 'baleada', 'Hungary': 'goulash',
    'Iceland': 'plokkfiskur', 'India': 'biryani', 'Indonesia': 'rendang', 'Iran': 'koobideh',
    'Iraq': 'masgouf', 'Ireland': 'irish stew', 'Israel': 'shakshuka', 'Italy': 'risotto milanese',
    'Jamaica': 'jerk chicken', 'Japan': 'sushi', 'Jordan': 'mansaf', 'Kazakhstan': 'beshbarmak',
    'Kenya': 'ugali nyama', 'Kiribati': 'palusami', 'Kuwait': 'machboos', 'Kyrgyzstan': 'lagman',
    'Laos': 'larb', 'Latvia': 'pelmeni', 'Lebanon': 'tabbouleh', 'Lesotho': 'papa maize porridge',
    'Liberia': 'jollof rice', 'Libya': 'couscous beef', 'Liechtenstein': 'käsknöpfle', 'Lithuania': 'cepelinai',
    'Luxembourg': 'judd mat gaardebounen', 'Madagascar': 'romazava', 'Malawi': 'nshima', 'Malaysia': 'nasi lemak',
    'Maldives': 'mas huni', 'Mali': 'peanut stew', 'Malta': 'pastizzi', 'Mauritania': 'thieboudienne',
    'Mauritius': 'dholl puri', 'Mexico': 'tacos al pastor', 'Federated States of Micronesia': 'breadfruit',
    'Moldova': 'mămăligă', 'Mongolia': 'buuz', 'Montenegro': 'njeguški steak', 'Morocco': 'tajine',
    'Mozambique': 'matapa', 'Myanmar': 'mohinga', 'Namibia': 'potjiekos', 'Nauru': 'coconut fish',
    'Nepal': 'dal bhat', 'Netherlands': 'stamppot', 'New Zealand': 'hangi', 'Nicaragua': 'gallo pinto',
    'Niger': 'djerma rice', 'Nigeria': 'egusi', 'North Korea': 'naengmyeon', 'North Macedonia': 'tavče gravče',
    'Norway': 'fårikål', 'Oman': 'shuwa', 'Pakistan': 'nihari', 'Palau': 'tinola',
    'Papua New Guinea': 'mumu', 'Paraguay': 'chipa', 'Peru': 'ceviche', 'Philippines': 'adobo',
    'Poland': 'pierogi', 'Portugal': 'bacalhau', 'Qatar': 'machboos', 'Romania': 'sarmale',
    'Russia': 'borscht', 'Rwanda': 'brochettes', 'Saint Kitts and Nevis': 'goat water', 'Saint Lucia': 'saltfish',
    'Saint Vincent and the Grenadines': 'breadfruit', 'Samoa': 'palusami', 'San Marino': 'torta tre monti',
    'Saudi Arabia': 'kabsa', 'Senegal': 'thieboudienne', 'Republic of Serbia': 'ćevapi', 'Seychelles': 'coconut curry',
    'Sierra Leone': 'groundnut stew', 'Singapore': 'hainanese chicken rice', 'Slovakia': 'bryndzové halušky',
    'Slovenia': 'potica', 'Solomon Islands': 'ulu curry', 'Somalia': 'bariis iskukaris', 'South Korea': 'kimchi jjigae',
    'South Sudan': 'kisra', 'Spain': 'paella', 'Sri Lanka': 'kottu roti', 'Sudan': 'ful medames',
    'Suriname': 'pom', 'Sweden': 'köttbullar', 'Switzerland': 'rösti', 'Syria': 'kibbeh',
    'Taiwan': 'beef noodle soup', 'Tajikistan': 'qurutob', 'United Republic of Tanzania': 'ugali samaki',
    'Thailand': 'pad thai', 'Togo': 'fufu sauce gombo', 'Tonga': 'lu pulu', 'Trinidad and Tobago': 'doubles',
    'Tunisia': 'harissa couscous', 'Turkey': 'köfte', 'Turkmenistan': 'palow', 'Tuvalu': 'palusami',
    'Uganda': 'matoke', 'Ukraine': 'varenyky', 'United Arab Emirates': 'harees', 'United Kingdom': 'fish and chips',
    'Uruguay': 'asado', 'Uzbekistan': 'plov', 'Vanuatu': 'lap lap', 'Vatican': 'pasta gricia',
    'Venezuela': 'arepa', 'Vietnam': 'pho', 'Yemen': 'saltah', 'Zambia': 'nshima', 'Zimbabwe': 'sadza',
    'Panama': 'sancocho', 'Argentina': 'asado', 'Australia': 'lamington', 'Brazil': 'feijoada',
    'Bolivia': 'salteñas', 'Chile': 'pastel de choclo', 'Colombia': 'bandeja paisa', 'Costa Rica': 'gallo pinto',
    'Cuba': 'ropa vieja', 'Ecuador': 'encebollado', 'Greece': 'moussaka', 'Greenland': 'kiviak',
    'Haiti': 'griot', 'Ireland': 'irish stew', 'Israel': 'shakshuka', 'Jamaica': 'ackee saltfish',
    'Kosovo': 'flija', 'Monaco': 'barbagiuan', 'Northern Cyprus': 'kleftiko', 'Palestine': 'maqluba',
    'Puerto Rico': 'mofongo', 'Saint Helena': 'fishcakes', 'Somaliland': 'canjeero', 'South Africa': 'bobotie',
    'Western Sahara': 'couscous camel', 'Hong Kong S.A.R.': 'dim sum', 'Macao S.A.R': 'minchi',
    'Faroe Islands': 'ræstur fiskur', 'Isle of Man': 'queenies', 'Falkland Islands': 'fish pie',
    'Antarctica': 'expedition ration', 'French Polynesia': 'poisson cru', 'New Caledonia': 'bougna',
    'Cook Islands': 'ika mata', 'Guam': 'kelaguen', 'American Samoa': 'palusami', 'Northern Mariana Islands': 'chamorro bbq',
    'Aruba': 'keshi yena', 'Saint Martin': 'accras', 'Saint Barthelemy': 'accras de morue',
    'United States Virgin Islands': 'callaloo', 'Sint Maarten': 'johnnycakes', 'Bermuda': 'codfish potatoes',
    'Cayman Islands': 'turtle stew', 'Greenland': 'kiviak', 'Gibraltar': 'calentita', 'Jersey': 'jersey wonders',
    'Guernsey': 'bean jar', 'Anguilla': 'crayfish', 'Montserrat': 'goat water', 'Marshall Islands': 'breadfruit',
    'Saint Helena': 'fish cakes', 'Pitcairn Islands': 'breadfruit pie', 'Aland': 'pannkakor', 'Norfolk Island': 'plum pudin',
    'South Georgia and the Islands': 'mero caldo', 'French Southern and Antarctic Lands': 'expedition food',
    'United States Minor Outlying Islands': 'tuna', 'Heard Island and McDonald Islands': 'expedition rations',
    'Indian Ocean Territories': 'fish', 'Coral Sea Islands': 'tuna', 'Spratly Islands': 'fish',
    'Clipperton Island': 'crab', 'Ashmore and Cartier Islands': 'reef fish', 'Bajo Nuevo Bank (Petrel Is.)': 'fish',
    'Serranilla Bank': 'conch', 'Scarborough Reef': 'tuna', 'Baykonur Cosmodrome': 'shchi', 'Dhekelia Sovereign Base Area': 'souvla',
    'Akrotiri Sovereign Base Area': 'halloumi', 'US Naval Base Guantanamo Bay': 'moros y cristianos',
    'Brazilian Island': 'amazon fish', 'Cyprus No Mans Area': 'rations', 'Siachen Glacier': 'mountain rations',
    'Southern Patagonian Ice Field': 'cordero', 'Bir Tawil': 'rations', 'Wallis and Futuna': 'palusami',
    'Niue': 'takihi', 'Tokelau': 'fekei', 'Saint Pierre and Miquelon': 'morue', 'Turks and Caicos Islands': 'conch fritters',
    'British Virgin Islands': 'fungi fish', 'Saint Vincent and the Grenadines': 'breadfruit', 'Nauru': 'coconut fish',
    'Timor-Leste': 'batar daan', 'Curaçao': 'keshi yena'
};

function fetchJSON(url, attempt) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                if (res.statusCode === 429 && (attempt || 0) < 6) {
                    return setTimeout(() => fetchJSON(url, (attempt || 0) + 1).then(resolve, reject), 8000);
                }
                return reject(new Error('HTTP ' + res.statusCode));
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    });
}

function download(url, dest, attempt) {
    return new Promise((resolve, reject) => {
        const clean = url.split('&utm_')[0];
        const req = https.get(clean, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, (res) => {
            if (res.statusCode === 429) {
                res.resume();
                if (attempt < 4) {
                    return setTimeout(() => download(url, dest, (attempt || 0) + 1).then(resolve, reject), 6000);
                }
                return reject(new Error('rate limited 429'));
            }
            if (res.statusCode !== 200 || !res.headers['content-type'] || !/image\/(jpeg|jpg|png)/.test(res.headers['content-type'])) {
                res.resume();
                return reject(new Error('bad image: ' + (res.statusCode || res.headers['content-type'])));
            }
            const ws = fs.createWriteStream(dest);
            res.pipe(ws);
            ws.on('finish', () => ws.close(() => resolve(true)));
            ws.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    });
}

async function searchTerm(countryKey, localFood) {
    const term = TRA[countryKey] || localFood;
    const queries = [term + ' food', term + ' cuisine', term, localFood + ' dish'];
    for (let i = 0; i < queries.length; i++) {
        const search = encodeURIComponent(queries[i]);
        const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${search}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`;
        try {
            const j = await fetchJSON(url);
            if (j.query && j.query.pages) {
                const pages = Object.values(j.query.pages).sort((a, b) => parseInt(a.index || 99) - parseInt(b.index || 99));
                for (const p of pages) {
                    const ii = p.imageinfo && p.imageinfo[0];
                    if (ii && ii.thumburl && (ii.thumburl.endsWith('.jpg') || ii.thumburl.includes('.jpg'))) {
                        return { pageid: p.pageid, thumburl: ii.thumburl, title: p.title };
                    }
                }
            }
        } catch (e) { /* try next */ }
        await new Promise(r => setTimeout(r, 400));
    }
    return null;
}

async function main() {
    let mode = process.argv[2] || 'all';
    const limit = process.argv[3] ? parseInt(process.argv[3]) : 0;
    let modeLimit = 0;
    if (/^\d+$/.test(mode)) { modeLimit = parseInt(mode); mode = 'all'; }
    let list = entries;
    let delayMs = 350;

    if (mode === 'retry') {
        const reportPath = path.join(ROOT, 'tools', 'download_report.json');
        const failed = new Set();
        if (fs.existsSync(reportPath)) {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            report.forEach(r => { if (['error', 'not-found', 'too-small'].includes(r.status)) failed.add(r.key); });
        }
        list = entries.filter(e => failed.has(e.key));
        delayMs = 1600;
    } else if (mode === 'listfile') {
        const listPath = process.argv[3];
        const keys = fs.readFileSync(listPath, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        list = entries.filter(e => keys.includes(e.key));
        delayMs = 2500;
    } else if (limit || modeLimit) {
        list = entries.slice(0, limit || modeLimit);
    }

    const results = [];
    let n = 0;
    for (const e of list) {
        n++;
        const dest = path.join(IMG_DIR, slugify(e.key) + '.jpg');
        if (fs.existsSync(dest)) {
            results.push({ key: e.key, status: 'exists', file: path.basename(dest) });
            continue;
        }
        try {
            const hit = await searchTerm(e.key, e.food);
            if (hit) {
                await download(hit.thumburl, dest);
                const size = fs.statSync(dest).size;
                if (size > 5000) {
                    results.push({ key: e.key, status: 'ok', file: path.basename(dest), title: hit.title, size });
                } else {
                    fs.unlinkSync(dest);
                    results.push({ key: e.key, status: 'too-small' });
                }
            } else {
                results.push({ key: e.key, status: 'not-found' });
            }
        } catch (err) {
            results.push({ key: e.key, status: 'error', msg: String(err).slice(0, 80) });
        }
        process.stdout.write(`\r[${n}/${list.length}] ${e.key} -> ${results[results.length - 1].status}`);
        await new Promise(r => setTimeout(r, delayMs));
    }
    const ok = results.filter(r => r.status === 'ok').length;
    const ex = results.filter(r => r.status === 'exists').length;
    const fail = results.filter(r => ['error', 'not-found', 'too-small'].includes(r.status));
    console.log('\n\nTotal:', list.length, '| Descargadas:', ok, '| Ya existian:', ex, '| Fallidas:', fail.length);
    fs.writeFileSync(path.join(ROOT, 'tools', 'download_report.json'), JSON.stringify(results, null, 2));
    if (fail.length) {
        console.log('FALLIDAS:');
        fail.forEach(f => console.log(' -', f.key, '=>', f.status, f.msg || ''));
    }
}

main().catch(e => { console.error(e); process.exit(1); });