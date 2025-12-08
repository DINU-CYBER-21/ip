// Global variables
let map = null;
let marker = null;
let currentIP = null;

// නිදහස් API endpoints
const FREE_APIS = [
    'https://ipapi.co/json/',
    'https://ipinfo.io/json',
    'https://api.ipify.org?format=json'
];

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 1000);
    initMap();
    getIP();
});

// Initialize Leaflet map
function initMap() {
    if (!map) {
        map = L.map('map').setView([7.8731, 80.7718], 7); // Sri Lanka center
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        
        // Add Sri Lanka marker
        L.marker([6.9271, 79.8612])
            .addTo(map)
            .bindPopup('කොළඹ, ශ්‍රී ලංකා')
            .openPopup();
    }
}

// Get user's IP address
async function getIP() {
    try {
        showLoading(true);
        
        // Try multiple free APIs
        let ipData = null;
        for (const apiUrl of FREE_APIS) {
            try {
                const response = await fetch(apiUrl);
                if (response.ok) {
                    ipData = await response.json();
                    break;
                }
            } catch (error) {
                console.log(`API ${apiUrl} failed, trying next...`);
                continue;
            }
        }
        
        if (!ipData) {
            throw new Error('සියලුම API අසමත් විය');
        }
        
        // Process data based on API response format
        processIPData(ipData);
        
    } catch (error) {
        console.error('දෝෂය:', error);
        showError('IP ලිපිනය ලබා ගැනීමට නොහැකි විය');
    } finally {
        showLoading(false);
    }
}

// Process IP data from different APIs
function processIPData(data) {
    // Extract IP address
    let ip = data.ip || data.query;
    currentIP = ip;
    
    // Display IP
    document.getElementById('ip-address').textContent = ip || '-';
    document.getElementById('isp').textContent = data.org || data.isp || '-';
    document.getElementById('ip-type').textContent = data.version || 'IPv4';
    
    // Extract location data
    const country = data.country_name || data.country || '-';
    const city = data.city || '-';
    const region = data.region || data.regionName || '-';
    const countryCode = data.country_code || data.countryCode || '-';
    const lat = data.latitude || data.lat;
    const lon = data.longitude || data.lon;
    
    // Update UI
    document.getElementById('country').textContent = country;
    document.getElementById('city').textContent = city;
    document.getElementById('region').textContent = region;
    document.getElementById('country-code').textContent = countryCode;
    document.getElementById('latitude').textContent = lat ? lat.toFixed(6) : '-';
    document.getElementById('longitude').textContent = lon ? lon.toFixed(6) : '-';
    
    // Update map if coordinates exist
    if (lat && lon) {
        updateMap(lat, lon, `${city}, ${country}`);
    }
    
    // Check security (basic check)
    checkSecurity(data);
}

// Update map with coordinates
function updateMap(lat, lon, locationName) {
    if (marker) {
        map.removeLayer(marker);
    }
    
    map.setView([lat, lon], 13);
    marker = L.marker([lat, lon]).addTo(map);
    
    if (locationName) {
        marker.bindPopup(`📍 ${locationName}`).openPopup();
    }
    
    // Add accuracy circle
    L.circle([lat, lon], {
        color: '#1e3c72',
        fillColor: '#4CAF50',
        fillOpacity: 0.2,
        radius: 2000
    }).addTo(map);
}

// Check VPN/Proxy status (basic)
function checkSecurity(data) {
    const vpnStatus = document.getElementById('vpn-status');
    const proxyStatus = document.getElementById('proxy-status');
    
    // Simple checks
    const org = (data.org || '').toLowerCase();
    const isp = (data.isp || '').toLowerCase();
    
    const isDatacenter = org.includes('host') || 
                        org.includes('data') || 
                        org.includes('server') ||
                        org.includes('cloud') ||
                        isp.includes('host') ||
                        isp.includes('data');
    
    if (isDatacenter) {
        vpnStatus.innerHTML = '<i class="fas fa-user-shield"></i> VPN/Proxy: හැකි ඉඩක් ඇත';
        vpnStatus.style.borderLeftColor = '#ff9800';
    } else {
        vpnStatus.innerHTML = '<i class="fas fa-user-shield"></i> VPN/Proxy: හඳුනාගත නොමැත';
        vpnStatus.style.borderLeftColor = '#4CAF50';
    }
    
    // Check for mobile network
    const isMobile = org.includes('mobile') || 
                    isp.includes('mobile') ||
                    org.includes('lanka') ||
                    isp.includes('dialog') ||
                    isp.includes('mobitel') ||
                    isp.includes('airtel') ||
                    isp.includes('hutch');
    
    if (isMobile) {
        proxyStatus.innerHTML = '<i class="fas fa-server"></i> ජාලය: ජංගම දුරකථන';
        proxyStatus.style.borderLeftColor = '#2196F3';
    } else if (isDatacenter) {
        proxyStatus.innerHTML = '<i class="fas fa-server"></i> ජාලය: දත්ත මධ්‍යස්ථානය';
        proxyStatus.style.borderLeftColor = '#ff9800';
    } else {
        proxyStatus.innerHTML = '<i class="fas fa-server"></i> ජාලය: නිවැසියා';
        proxyStatus.style.borderLeftColor = '#4CAF50';
    }
}

// Lookup custom IP
async function lookupIP() {
    const customIP = document.getElementById('custom-ip').value.trim();
    
    if (!customIP) {
        alert('කරුණාකර IP ලිපිනයක් ඇතුළත් කරන්න');
        return;
    }
    
    // Validate IP format
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(customIP)) {
        alert('වලංගු IP ලිපිනයක් ඇතුළත් කරන්න');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`https://ipapi.co/${customIP}/json/`);
        
        if (!response.ok) {
            throw new Error('IP ලිපිනය හමු නොවීය');
        }
        
        const data = await response.json();
        if (data.error) {
            throw new Error(data.reason || 'IP ලිපිනය හමු නොවීය');
        }
        
        processIPData(data);
        document.getElementById('ip-address').textContent = customIP;
        currentIP = customIP;
        
    } catch (error) {
        console.error('දෝෂය:', error);
        showError(error.message || 'IP ලිපිනය පරීක්ෂා කිරීමට නොහැකි විය');
    } finally {
        showLoading(false);
    }
}

// Center map on user location
function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                updateMap(lat, lon, 'ඔබගේ වර්තමාන ස්ථානය');
            },
            (error) => {
                alert('ස්ථානය ලබා ගැනීමට නොහැකි විය. GPS සක්‍රිය කරන්න.');
            }
        );
    } else {
        alert('ඔබගේ බ්‍රවුසරය GPS සහාය නොදක්වයි');
    }
}

// Copy IP to clipboard
function copyIP() {
    if (!currentIP) {
        alert('පිටපත් කිරීමට IP ලිපිනයක් නොමැත');
        return;
    }
    
    navigator.clipboard.writeText(currentIP).then(() => {
        alert('IP ලිපිනය පිටපත් කරන ලදී: ' + currentIP);
    }).catch(err => {
        console.error('පිටපත් කිරීමේ දෝෂය:', err);
    });
}

// Update current time
function updateTime() {
    const now = new Date();
    const options = {
        timeZone: 'Asia/Colombo',
        hour12: false,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long'
    };
    
    const formatter = new Intl.DateTimeFormat('si-LK', options);
    const formatted = formatter.format(now);
    document.getElementById('current-time').textContent = formatted;
}

// Show loading state
function showLoading(isLoading) {
    const btn = document.querySelector('.refresh-btn');
    const ipDisplay = document.getElementById('ip-address');
    
    if (isLoading) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ලබා ගනිමින්...';
        btn.disabled = true;
        if (ipDisplay.textContent === 'ලබා ගනිමින්...') {
            ipDisplay.textContent = 'පූරණය වෙමින්...';
        }
    } else {
        btn.innerHTML = '<i class="fas fa-redo"></i> යාවත්කාලීන කරන්න';
        btn.disabled = false;
    }
}

// Show error message
function showError(message) {
    const ipDisplay = document.getElementById('ip-address');
    ipDisplay.textContent = 'දෝෂයක්';
    ipDisplay.style.color = '#dc3545';
    
    // Reset after 5 seconds
    setTimeout(() => {
        ipDisplay.style.color = '';
    }, 5000);
      }
