import { formatDate, formatNumber } from './utils.js';

console.log('Charts Module Loaded');

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        family: 'Inter',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Inter',
                        size: 13
                    }
                }
            }
        };
        
        this.colors = {
            primary: '#4F46E5',
            secondary: '#64748B',
            success: '#22C55E',
            danger: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
            light: '#F3F4F6',
            dark: '#1F2937'
        };
    }

    initialize() {
        this.loadChartLibrary().catch(error => {
            console.error('Failed to load Chart.js:', error);
        });
    }

    async loadChartLibrary() {
        if (window.Chart) return;

        await import('https://cdn.jsdelivr.net/npm/chart.js');
        console.log('Chart.js loaded');
    }

    createChart(elementId, type, data, options = {}) {
        console.log(`Creating ${type} chart:`, elementId);
        
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element not found: ${elementId}`);
            return null;
        }

        const ctx = element.getContext('2d');
        const chartOptions = {
            ...this.chartDefaults,
            ...options
        };

        const chart = new Chart(ctx, {
            type,
            data,
            options: chartOptions
        });

        this.charts.set(elementId, chart);
        return chart;
    }

    updateChart(elementId, newData, newOptions = {}) {
        console.log(`Updating chart: ${elementId}`);
        
        const chart = this.charts.get(elementId);
        if (!chart) {
            console.error(`Chart not found: ${elementId}`);
            return;
        }

        if (newData) {
            Object.assign(chart.data, newData);
        }

        if (newOptions) {
            Object.assign(chart.options, newOptions);
        }

        chart.update();
    }

    destroyChart(elementId) {
        console.log(`Destroying chart: ${elementId}`);
        
        const chart = this.charts.get(elementId);
        if (chart) {
            chart.destroy();
            this.charts.delete(elementId);
        }
    }

    // Predefined chart types
    createPatientStatisticsChart(elementId, data) {
        return this.createChart(elementId, 'line', {
            labels: data.map(d => formatDate(d.date)),
            datasets: [{
                label: 'Total Patients',
                data: data.map(d => d.totalPatients),
                borderColor: this.colors.primary,
                backgroundColor: this.colors.primary + '20',
                fill: true
            }, {
                label: 'New Admissions',
                data: data.map(d => d.newAdmissions),
                borderColor: this.colors.success,
                backgroundColor: this.colors.success + '20',
                fill: true
            }, {
                label: 'Discharges',
                data: data.map(d => d.discharges),
                borderColor: this.colors.warning,
                backgroundColor: this.colors.warning + '20',
                fill: true
            }]
        }, {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatNumber(value)
                    }
                }
            }
        });
    }

    createDepartmentOccupancyChart(elementId, data) {
        return this.createChart(elementId, 'bar', {
            labels: data.map(d => d.department),
            datasets: [{
                label: 'Current Patients',
                data: data.map(d => d.currentPatients),
                backgroundColor: this.colors.primary,
                borderRadius: 4
            }, {
                label: 'Capacity',
                data: data.map(d => d.capacity),
                backgroundColor: this.colors.light,
                borderRadius: 4
            }]
        }, {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatNumber(value)
                    }
                }
            }
        });
    }

    createStaffDistributionChart(elementId, data) {
        return this.createChart(elementId, 'doughnut', {
            labels: data.map(d => d.role),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: [
                    this.colors.primary,
                    this.colors.success,
                    this.colors.warning,
                    this.colors.info
                ]
            }]
        });
    }

    createMedicationUsageChart(elementId, data) {
        return this.createChart(elementId, 'line', {
            labels: data.map(d => formatDate(d.date)),
            datasets: data.medications.map(med => ({
                label: med.name,
                data: med.usage,
                borderColor: med.color || this.colors.primary,
                tension: 0.4
            }))
        });
    }

    createIncidentTrendsChart(elementId, data) {
        return this.createChart(elementId, 'bar', {
            labels: data.map(d => formatDate(d.date)),
            datasets: [{
                label: 'Incidents',
                data: data.map(d => d.count),
                backgroundColor: this.colors.danger,
                borderRadius: 4
            }]
        }, {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        });
    }

    createPatientAgeDistributionChart(elementId, data) {
        return this.createChart(elementId, 'bar', {
            labels: data.map(d => d.ageGroup),
            datasets: [{
                label: 'Patients',
                data: data.map(d => d.count),
                backgroundColor: this.colors.info,
                borderRadius: 4
            }]
        });
    }

    createStaffShiftDistributionChart(elementId, data) {
        return this.createChart(elementId, 'pie', {
            labels: data.map(d => d.shift),
            datasets: [{
                data: data.map(d => d.staffCount),
                backgroundColor: [
                    this.colors.primary,
                    this.colors.success,
                    this.colors.warning
                ]
            }]
        });
    }

    createInventoryLevelsChart(elementId, data) {
        return this.createChart(elementId, 'bar', {
            labels: data.map(d => d.item),
            datasets: [{
                label: 'Current Stock',
                data: data.map(d => d.currentStock),
                backgroundColor: this.colors.primary,
                borderRadius: 4
            }, {
                label: 'Minimum Required',
                data: data.map(d => d.minRequired),
                backgroundColor: this.colors.danger,
                borderRadius: 4
            }]
        });
    }

    // Helper methods
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    generateGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color + 'FF');
        gradient.addColorStop(1, color + '00');
        return gradient;
    }
}

// Create and export singleton instance
const chartManager = new ChartManager();
export default chartManager;