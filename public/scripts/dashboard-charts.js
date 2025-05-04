// Dashboard Charts Initialization
import chartManager from './charts.js';

console.log('Dashboard Charts Module Loaded');

// Sample data for charts (in a real app, this would come from API)
const sampleInventoryData = [
    { item: 'Gloves', currentStock: 540, minRequired: 200 },
    { item: 'Masks', currentStock: 320, minRequired: 150 },
    { item: 'Syringes', currentStock: 188, minRequired: 100 },
    { item: 'Bandages', currentStock: 250, minRequired: 120 },
    { item: 'Alcohol Wipes', currentStock: 110, minRequired: 100 }
];

const sampleMedicationData = {
    labels: ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
    datasets: [{
        label: 'Given',
        data: [30, 40, 28, 35, 42, 25],
        backgroundColor: '#3a86ff',
        borderColor: '#3a86ff'
    },
    {
        label: 'Scheduled',
        data: [33, 40, 30, 38, 42, 30],
        backgroundColor: '#ff006e',
        borderColor: '#ff006e'
    }]
};

const samplePatientHealthData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
        {
            label: 'Average Temperature',
            data: [36.8, 36.9, 37.1, 36.8, 36.7, 36.9, 37.0],
            borderColor: '#3a86ff',
            backgroundColor: 'rgba(58, 134, 255, 0.1)',
            fill: true
        },
        {
            label: 'Average Heart Rate',
            data: [75, 78, 76, 79, 77, 75, 74],
            borderColor: '#ff006e',
            backgroundColor: 'rgba(255, 0, 110, 0.1)',
            fill: true,
            yAxisID: 'y1'
        }
    ]
};

// Initialize dashboard charts
function initDashboardCharts() {
    console.debug("Initializing dashboard charts");
    
    try {
        // Initialize medication chart
        if (document.getElementById('medicationChart')) {
            console.debug("Loading medication chart");
            const medicationChart = new Chart(
                document.getElementById('medicationChart'),
                {
                    type: 'line',
                    data: sampleMedicationData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                }
            );
            console.debug("Medication chart loaded");
        }
        
        // Initialize inventory chart
        if (document.getElementById('inventoryChart')) {
            console.debug("Loading inventory chart");
            const inventoryChart = new Chart(
                document.getElementById('inventoryChart'),
                {
                    type: 'bar',
                    data: {
                        labels: sampleInventoryData.map(d => d.item),
                        datasets: [{
                            label: 'Current Stock',
                            data: sampleInventoryData.map(d => d.currentStock),
                            backgroundColor: '#3a86ff',
                            borderRadius: 4
                        }, {
                            label: 'Minimum Required',
                            data: sampleInventoryData.map(d => d.minRequired),
                            backgroundColor: '#ff006e',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                }
            );
            console.debug("Inventory chart loaded");
        }
        
        // Initialize patient health chart
        if (document.getElementById('patientHealthChart')) {
            console.debug("Loading patient health chart");
            const patientHealthChart = new Chart(
                document.getElementById('patientHealthChart'),
                {
                    type: 'line',
                    data: samplePatientHealthData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        },
                        scales: {
                            y: {
                                title: {
                                    display: true,
                                    text: 'Temperature (°C)'
                                }
                            },
                            y1: {
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Heart Rate (BPM)'
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        }
                    }
                }
            );
            console.debug("Patient health chart loaded");
        }
        
        console.debug("All charts loaded successfully");
        return true;
    } catch (error) {
        console.error("Error initializing dashboard charts:", error);
        return false;
    }
}

// Export the init function
export { initDashboardCharts };