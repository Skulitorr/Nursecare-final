// Charts initialization and management module

/**
 * Initialize all dashboard charts
 */
export function initializeCharts() {
    initializeAttendanceChart();
    initializeMedicationChart();
    initializeStaffChart();
    initializePerformanceChart();
}

/**
 * Initialize attendance chart
 */
function initializeAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.attendanceChart && typeof window.attendanceChart.destroy === 'function') {
        window.attendanceChart.destroy();
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    window.attendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'],
            datasets: [{
                label: 'Mæting',
                data: [85, 82, 88, 90, 85, 78, 75],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            animation: { duration: 750 },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 50,
                    max: 100,
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 5
                    },
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 7
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Initialize medication chart
 */
function initializeMedicationChart() {
    const ctx = document.getElementById('medicationChart');
    if (!ctx) return;
    
    if (window.medicationChart && typeof window.medicationChart.destroy === 'function') {
        window.medicationChart.destroy();
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    window.medicationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gefin', 'Eftir'],
            datasets: [{
                data: [75, 25],
                backgroundColor: ['#10b981', '#d1d5db'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            animation: { duration: 750 },
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        boxWidth: 12,
                        padding: 10
                    }
                }
            }
        }
    });
}

/**
 * Initialize staff chart
 */
function initializeStaffChart() {
    const ctx = document.getElementById('staffChart');
    if (!ctx) return;
    
    if (window.staffChart && typeof window.staffChart.destroy === 'function') {
        window.staffChart.destroy();
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    window.staffChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Morgun', 'Kvöld', 'Nætur', 'Orlof'],
            datasets: [{
                data: [12, 8, 6, 4],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(156, 39, 176, 0.7)',
                    'rgba(107, 114, 128, 0.7)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            animation: { duration: 750 },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 5,
                        stepSize: 1
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Initialize performance chart
 */
function initializePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    if (window.performanceChart && typeof window.performanceChart.destroy === 'function') {
        window.performanceChart.destroy();
    }
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    window.performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maí', 'Jún'],
            datasets: [{
                label: 'Afköst',
                data: [92, 88, 95, 89, 93, 96],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            animation: { duration: 750 },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 80,
                    max: 100,
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 5
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Update chart themes based on dark mode
 */
export function updateChartsForTheme(isDarkMode) {
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    const updateChartTheme = (chart) => {
        if (!chart) return;
        
        // Update scales if they exist
        if (chart.options.scales) {
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.y.grid.color = gridColor;
            }
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
            }
        }
        
        // Update legend if it exists
        if (chart.options.plugins?.legend) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        
        chart.update();
    };
    
    // Update all charts
    updateChartTheme(window.attendanceChart);
    updateChartTheme(window.medicationChart);
    updateChartTheme(window.staffChart);
    updateChartTheme(window.performanceChart);
}