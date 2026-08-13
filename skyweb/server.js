const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// X-UI පැනල් විස්තර 
const XUI_HOST = 'https://vpn.skymode.xyz:2053';
const SUB_PATH = '/Gux6MzwBCzjA0isz0G'; 
const XUI_USERNAME = 'admin';
const XUI_PASSWORD = 'Praveen#123MA';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

// සැබෑ CPU භාවිතය ගණනය කිරීම
function getCpuUsage() {
    const cpus = os.cpus();
    let idleMs = 0;
    let totalMs = 0;
    cpus.forEach(core => {
        for (let type in core.times) {
            totalMs += core.times[type];
        }
        idleMs += core.times.idle;
    });
    return Math.round(((totalMs - idleMs) / totalMs) * 100);
}

// සැබෑ Memory භාවිතය ගණනය කිරීම
function getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return Math.round((usedMem / totalMem) * 100);
}

async function getXUICookie() {
    const baseUrl = `${XUI_HOST}${SUB_PATH}/`;
    const loginUrl = `${XUI_HOST}${SUB_PATH}/login`;

    try {
        const getRes = await axios.get(baseUrl, { httpsAgent });
        const html = getRes.data;
        let initialCookie = '';
        
        const setCookieHeader = getRes.headers['set-cookie'];
        if (setCookieHeader) {
            const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader.join(';') : setCookieHeader;
            const match = cookieStr.match(/(3x-ui=[^;]+)/);
            if (match) initialCookie = match[1];
        }

        let csrfToken = '';
        const csrfMatch = html.match(/name=["']csrf-token["']\s+content=["']([^"']+)["']/i) || html.match(/(?:csrfToken|csrf-token|x-csrf-token)['"]?\s*[:=]\s*['"]([^'"]+)['"]/i);
        if (csrfMatch) {
            csrfToken = csrfMatch[1];
        }

        const formData = new URLSearchParams();
        formData.append('username', XUI_USERNAME);
        formData.append('password', XUI_PASSWORD);
        formData.append('twoFactorCode', '');

        const postHeaders = { 
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (initialCookie) postHeaders['Cookie'] = initialCookie;
        if (csrfToken) postHeaders['X-CSRF-Token'] = csrfToken;

        const postRes = await axios.post(loginUrl, formData.toString(), {
            headers: postHeaders,
            httpsAgent,
            validateStatus: (status) => status >= 200 && status < 500
        });

        if (postRes.status === 200 && postRes.data.success) {
            const finalCookieHeader = postRes.headers['set-cookie'];
            if (finalCookieHeader) {
                const cookieStr = Array.isArray(finalCookieHeader) ? finalCookieHeader.join(';') : finalCookieHeader;
                const cookieMatch = cookieStr.match(/(3x-ui=[^;]+)/);
                return cookieMatch ? cookieMatch[1] : cookieStr.split(';')[0];
            }
            return initialCookie || null;
        } else {
            return null;
        }
    } catch (error) {
        console.error('❌ Login Error:', error.message);
        return null;
    }
}

app.post('/api/check-subscription', async (req, res) => {
    const { subscriptionLink } = req.body;

    if (!subscriptionLink) {
        return res.status(400).json({ success: false, message: 'ලින්ක් එකක් ලබා දී නැත.' });
    }

    try {
        const cookie = await getXUICookie();
        if (!cookie) {
            return res.status(500).json({ success: false, message: 'X-UI පැනලය සමඟ සම්බන්ධ වීම අසාර්ථක විය.' });
        }

        const inboundsUrl = `${XUI_HOST}${SUB_PATH}/panel/api/inbounds/list`;
        const inboundsRes = await axios.get(inboundsUrl, {
            headers: { 
                'Accept': 'application/json, text/plain, */*',
                'Cookie': cookie,
                'X-Requested-With': 'XMLHttpRequest'
            },
            httpsAgent,
            validateStatus: (status) => status >= 200 && status < 500
        });

        if (inboundsRes.status !== 200 || !inboundsRes.data.success) {
            return res.status(400).json({ success: false, message: 'දත්ත ලබා ගැනීම අසාර්ථක විය.' });
        }

        const inbounds = inboundsRes.data.obj || [];
        let foundClientStats = null;
        let matchedInbound = null;
        let matchedClient = null;

        for (const inbound of inbounds) {
            let clientsList = [];
            try {
                const settings = typeof inbound.settings === 'string' ? JSON.parse(inbound.settings) : inbound.settings;
                clientsList = settings.clients || [];
            } catch (e) {
                clientsList = inbound.clients || [];
            }

            const clientStatsList = inbound.clientStats || [];

            for (const client of clientsList) {
                const clientId = client.id || client.uuid;
                const clientEmail = client.email;
                if (
                    (clientId && subscriptionLink.includes(clientId)) ||
                    (clientEmail && subscriptionLink.includes(clientEmail))
                ) {
                    matchedClient = client;
                    break;
                }
            }

            if (matchedClient) {
                matchedInbound = inbound;
                foundClientStats = clientStatsList.find(s => s.email === matchedClient.email) || {
                    total: matchedClient.total || 0,
                    up: 0,
                    down: 0,
                    expiryTime: matchedClient.expiryTime || 0,
                    enable: matchedClient.enable !== undefined ? matchedClient.enable : true
                };
                break;
            }
        }

        if (!foundClientStats || !matchedInbound || !matchedClient) {
            return res.status(404).json({ success: false, message: 'මෙම ලින්ක් එකට අදාළ පරිශීලකයෙකු හමු නොවීය.' });
        }

        const totalBytes = foundClientStats.total > 0 ? foundClientStats.total : (matchedClient.total || 0);
        const totalGb = totalBytes > 0 ? (totalBytes / (1024 * 1024 * 1024)).toFixed(2) : '0';
        
        const upBytes = foundClientStats.up || 0;
        const downBytes = foundClientStats.down || 0;
        const usedBytes = upBytes + downBytes;
        const usedGb = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
        
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 MB';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const uploadedFormatted = formatBytes(upBytes);
        const downloadedFormatted = formatBytes(downBytes);
        
        let remainingGb = 0;
        if (totalBytes > 0) {
            remainingGb = (totalGb - usedGb > 0 ? (totalGb - usedGb).toFixed(2) : '0');
        } else {
            remainingGb = 'Unlimited';
        }
        
        const percent = totalGb > 0 && totalGb !== '0' ? Math.round((usedGb / totalGb) * 100) : 0;

        let expiryTime = foundClientStats.expiryTime || matchedClient.expiryTime || 0;
        let expiryDate = 'Unlimited';
        let expiryTimestamp = 0;
        let activationDate = '2026-08-01';

        if (expiryTime > 0) {
            if (expiryTime < 10000000000) expiryTime *= 1000;
            expiryTimestamp = expiryTime;
            expiryDate = new Date(expiryTime).toISOString().slice(0, 10);
            
            // දෝෂය නිවැරදි කරන ලද ස්ථානය (ටොකන් දෝෂ ඉවත් කර ඇත)
            const actDate = new Date(expiryTime - (30 * 24 * 60 * 60 * 1000));
            activationDate = actDate.toISOString().slice(0, 10);
        }

        const planName = matchedInbound.remark || 'Skymode Pro Plan';
        const protocol = (matchedInbound.protocol || 'VLESS').toUpperCase();
        
        let serverLocation = 'Singapore Server 01';
        const remarkLower = planName.toLowerCase();
        if (remarkLower.includes('us') || remarkLower.includes('america')) serverLocation = 'United States (US)';
        else if (remarkLower.includes('sg') || remarkLower.includes('singapore')) serverLocation = 'Singapore (SG)';
        else if (remarkLower.includes('uk') || remarkLower.includes('london')) serverLocation = 'United Kingdom (UK)';

        const ipLimit = matchedClient.ipLimit || 5;
        const isEnabled = foundClientStats.enable !== false && matchedClient.enable !== false;

        const uploadSpeed = (Math.random() * 3.5 + 0.5).toFixed(2) + ' MB/s';
        const downloadSpeed = (Math.random() * 12.5 + 2.1).toFixed(2) + ' MB/s';

        res.json({
            success: true,
            planName: planName,
            protocol: protocol,
            serverName: serverLocation,
            totalGb: totalGb === '0' ? 'Unlimited' : parseFloat(totalGb),
            usedGb: parseFloat(usedGb),
            remainingGb: remainingGb === 'Unlimited' ? 'Unlimited' : parseFloat(remainingGb),
            percent: percent,
            uploadedFormatted: uploadedFormatted,
            downloadedFormatted: downloadedFormatted,
            activationDate: activationDate,
            expiryDate: expiryDate,
            expiryTimestamp: expiryTimestamp,
            deviceLimit: ipLimit,
            isEnabled: isEnabled,
            cpuUsage: getCpuUsage(),
            memUsage: getMemoryUsage(),
            uploadSpeed: uploadSpeed,
            downloadSpeed: downloadSpeed
        });

    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ success: false, message: 'සේවාදායකයේ අභ්‍යන්තර දෝෂයක් සිදු විය.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});