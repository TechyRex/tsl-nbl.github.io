// Global variables and functions
let sampleData = [];
let driverData = {};
let generatedCode = '';
let codeExpiry = null;

// Initialize data
function loadSampleData() {
    // Create sample data
    const drivers = [
        'James Okafor', 'Musa Ibrahim', 'Chinedu Okoro', 'Adebayo Tunde',
        'Johnbull Efosa', 'Suleiman Bala', 'Emeka Nwosu', 'Fatima Abdullahi'
    ];
    
    const products = [
        'Star Lager Beer - 50cl Bottle', 'Gulder Beer - 60cl Bottle',
        'Legend Stout - 60cl Bottle', '33 Export Beer - 60cl Bottle',
        'Hero Lager Beer - 50cl Bottle', 'Star Radler - 50cl Can',
        'Trophy Lager - 50cl Bottle', 'Goldberg Lager - 50cl Bottle'
    ];
    
    const customers = [
        'Shoprite Ikeja', 'Spar Victoria Island', 'Next Supermarket', 
        'Ebeano Supermarket', 'Justrite Superstore', 'Prince Ebeano',
        'Hubmart Stores', 'Market Square'
    ];
    
    sampleData = [];
    driverData = {};
    
    // Generate data for the last 90 days
    const today = new Date();
    for (let i = 0; i < 50; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        
        const driver = drivers[Math.floor(Math.random() * drivers.length)];
        const quantityLoaded = Math.floor(Math.random() * 500) + 100;
        const quantityReceived = quantityLoaded - Math.floor(Math.random() * 30);
        const shortageValue = Math.floor(Math.random() * 50000) + 5000;
        const liableAmount = Math.floor(shortageValue * (Math.random() > 0.7 ? 0.5 : 0));
        
        const record = {
            id: i + 1,
            date: date.toISOString().split('T')[0],
            shipmentNumber: `SH${10000 + i}`,
            customerName: customers[Math.floor(Math.random() * customers.length)],
            truckNumber: `TSL${Math.floor(Math.random() * 900) + 100}`,
            staffId: `TSL${1000 + i % 100}`,
            driverName: driver,
            productDescription: products[Math.floor(Math.random() * products.length)],
            quantityLoaded: quantityLoaded,
            quantityReceived: quantityReceived,
            customerReject: Math.floor(Math.random() * 10),
            rejectsValue: Math.floor(Math.random() * 20000),
            returnReceived: Math.floor(Math.random() * 15),
            driversLiable: liableAmount > 0 ? 'Yes' : 'No',
            liableAmount: liableAmount,
            totalShortage: shortageValue,
            notes: i % 5 === 0 ? 'Driver reported damage in transit' : ''
        };
        
        sampleData.push(record);
        
        // Update driver data
        if (!driverData[driver]) {
            driverData[driver] = {
                trips: 0,
                totalShortage: 0,
                liableAmount: 0,
                tripsThisMonth: 0,
                monthShortage: 0
            };
        }
        
        driverData[driver].trips++;
        driverData[driver].totalShortage += shortageValue;
        driverData[driver].liableAmount += liableAmount;
        
        // Check if this month
        const recordDate = new Date(record.date);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
            driverData[driver].tripsThisMonth++;
            driverData[driver].monthShortage += shortageValue;
        }
    }
}

function updateHomeStats() {
    if (!document.getElementById('totalTrips')) return;
    
    const totalTrips = sampleData.length;
    const totalShortage = sampleData.reduce((sum, record) => sum + record.totalShortage, 0);
    const totalDrivers = Object.keys(driverData).length;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const currentMonthTrips = sampleData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).length;
    
    document.getElementById('totalTrips').textContent = totalTrips.toLocaleString();
    document.getElementById('totalShortage').textContent = `₦${totalShortage.toLocaleString()}`;
    document.getElementById('totalDrivers').textContent = totalDrivers;
    document.getElementById('currentMonth').textContent = currentMonthTrips;
}

function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) {
            code += '-';
        }
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    generatedCode = code;
    codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (document.getElementById('generatedCode')) {
        document.getElementById('generatedCode').textContent = code;
        document.getElementById('codeExpiry').textContent = codeExpiry.toLocaleString();
        document.getElementById('codeGenerated').textContent = new Date().toLocaleString();
    }
    
    showNotification('New access code generated successfully!', 'success');
    
    // Save to localStorage
    const codes = JSON.parse(localStorage.getItem('tslCodes') || '[]');
    codes.push({
        code: code,
        generated: new Date().toISOString(),
        expires: codeExpiry.toISOString(),
        status: 'active'
    });
    localStorage.setItem('tslCodes', JSON.stringify(codes));
    
    loadRecentCodes();
}

function copyCode() {
    if (!generatedCode) {
        showNotification('Please generate a code first', 'error');
        return;
    }
    
    navigator.clipboard.writeText(generatedCode)
        .then(() => showNotification('Code copied to clipboard!', 'success'))
        .catch(err => showNotification('Failed to copy code', 'error'));
}

function validateCode() {
    const enteredCode = document.getElementById('accessCode')?.value.trim();
    
    if (!enteredCode) {
        showNotification('Please enter an access code', 'error');
        return;
    }
    
    const codePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    if (!codePattern.test(enteredCode)) {
        showNotification('Invalid code format. Use XXXX-XXXX-XXXX', 'error');
        return;
    }
    
    // Check if code is valid in localStorage
    const codes = JSON.parse(localStorage.getItem('tslCodes') || '[]');
    const validCode = codes.find(c => 
        c.code === enteredCode && 
        new Date(c.expires) > new Date()
    );
    
    if (!validCode && enteredCode !== generatedCode) {
        showNotification('Invalid or expired access code', 'error');
        return;
    }
    
    showNotification('Access granted! Redirecting...', 'success');
    setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
    }, 1500);
}

function loadRecentCodes() {
    if (!document.getElementById('recentCodesTable')) return;
    
    const codes = JSON.parse(localStorage.getItem('tslCodes') || '[]');
    const table = document.getElementById('recentCodesTable');
    table.innerHTML = '';
    
    // Show recent codes (last 5)
    codes.slice(-5).reverse().forEach(code => {
        const row = document.createElement('tr');
        const expires = new Date(code.expires);
        const now = new Date();
        const isExpired = expires < now;
        
        row.innerHTML = `
            <td><code>${code.code}</code></td>
            <td>${new Date(code.generated).toLocaleString()}</td>
            <td>${expires.toLocaleString()}</td>
            <td>
                <span class="badge ${isExpired ? 'badge-danger' : 'badge-success'}">
                    ${isExpired ? 'Expired' : 'Active'}
                </span>
            </td>
        `;
        table.appendChild(row);
    });
}

function showNotification(message, type) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSampleData();
    
    // Check if we need to load recent codes
    if (document.getElementById('recentCodesTable')) {
        loadRecentCodes();
    }
    
    // Check if we need to update home stats
    updateHomeStats();
});
