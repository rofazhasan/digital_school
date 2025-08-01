#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const APP_URL = process.env.APP_URL || 'https://digitalsch.netlify.app';
const HEALTH_ENDPOINT = `${APP_URL}/api/health`;
const EXAMS_ENDPOINT = `${APP_URL}/api/exams`;

// Performance monitoring class
class PerformanceMonitor {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const protocol = url.startsWith('https') ? https : http;
            
            const req = protocol.request(url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;
                    
                    resolve({
                        statusCode: res.statusCode,
                        responseTime,
                        data: JSON.parse(data),
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                reject({
                    error: error.message,
                    responseTime
                });
            });

            req.setTimeout(30000, () => {
                req.destroy();
                reject({
                    error: 'Request timeout',
                    responseTime: 30000
                });
            });

            req.end();
        });
    }

    async testHealthEndpoint() {
        console.log('🏥 Testing health endpoint...');
        try {
            const result = await this.makeRequest(HEALTH_ENDPOINT);
            console.log(`✅ Health check: ${result.responseTime}ms (Status: ${result.statusCode})`);
            return result;
        } catch (error) {
            console.log(`❌ Health check failed: ${error.error} (${error.responseTime}ms)`);
            return error;
        }
    }

    async testExamsEndpoint() {
        console.log('📚 Testing exams endpoint...');
        try {
            const result = await this.makeRequest(EXAMS_ENDPOINT);
            console.log(`✅ Exams endpoint: ${result.responseTime}ms (Status: ${result.statusCode})`);
            return result;
        } catch (error) {
            console.log(`❌ Exams endpoint failed: ${error.error} (${error.responseTime}ms)`);
            return error;
        }
    }

    async runPerformanceTest(iterations = 5) {
        console.log(`🚀 Starting performance test (${iterations} iterations)...\n`);
        
        const healthResults = [];
        const examsResults = [];

        for (let i = 1; i <= iterations; i++) {
            console.log(`\n--- Iteration ${i}/${iterations} ---`);
            
            const healthResult = await this.testHealthEndpoint();
            const examsResult = await this.testExamsEndpoint();
            
            healthResults.push(healthResult);
            examsResults.push(examsResult);
            
            // Wait 2 seconds between iterations
            if (i < iterations) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        this.analyzeResults(healthResults, examsResults);
    }

    analyzeResults(healthResults, examsResults) {
        console.log('\n📊 Performance Analysis');
        console.log('=====================\n');

        // Health endpoint analysis
        const successfulHealth = healthResults.filter(r => !r.error);
        if (successfulHealth.length > 0) {
            const avgHealthTime = successfulHealth.reduce((sum, r) => sum + r.responseTime, 0) / successfulHealth.length;
            const minHealthTime = Math.min(...successfulHealth.map(r => r.responseTime));
            const maxHealthTime = Math.max(...successfulHealth.map(r => r.responseTime));
            
            console.log('🏥 Health Endpoint:');
            console.log(`  Average: ${avgHealthTime.toFixed(2)}ms`);
            console.log(`  Min: ${minHealthTime}ms`);
            console.log(`  Max: ${maxHealthTime}ms`);
            console.log(`  Success Rate: ${(successfulHealth.length / healthResults.length * 100).toFixed(1)}%`);
        }

        // Exams endpoint analysis
        const successfulExams = examsResults.filter(r => !r.error);
        if (successfulExams.length > 0) {
            const avgExamsTime = successfulExams.reduce((sum, r) => sum + r.responseTime, 0) / successfulExams.length;
            const minExamsTime = Math.min(...successfulExams.map(r => r.responseTime));
            const maxExamsTime = Math.max(...successfulExams.map(r => r.responseTime));
            
            console.log('\n📚 Exams Endpoint:');
            console.log(`  Average: ${avgExamsTime.toFixed(2)}ms`);
            console.log(`  Min: ${minExamsTime}ms`);
            console.log(`  Max: ${maxExamsTime}ms`);
            console.log(`  Success Rate: ${(successfulExams.length / examsResults.length * 100).toFixed(1)}%`);
        }

        // Performance recommendations
        console.log('\n💡 Recommendations:');
        const avgExamsTime = successfulExams.length > 0 ? 
            successfulExams.reduce((sum, r) => sum + r.responseTime, 0) / successfulExams.length : 0;
        
        if (avgExamsTime > 5000) {
            console.log('  ⚠️  Exams endpoint is slow (>5s). Consider:');
            console.log('     - Adding database indexes');
            console.log('     - Implementing caching');
            console.log('     - Optimizing database queries');
        } else if (avgExamsTime > 2000) {
            console.log('  ⚠️  Exams endpoint is moderately slow (>2s). Consider:');
            console.log('     - Adding caching for frequently accessed data');
            console.log('     - Optimizing database queries');
        } else {
            console.log('  ✅ Performance is good!');
        }

        if (successfulHealth.length < healthResults.length || successfulExams.length < examsResults.length) {
            console.log('  ⚠️  Some requests failed. Check:');
            console.log('     - Database connectivity');
            console.log('     - Server logs');
            console.log('     - Network connectivity');
        }
    }
}

// Run the performance test
async function main() {
    const monitor = new PerformanceMonitor();
    
    try {
        await monitor.runPerformanceTest(5);
    } catch (error) {
        console.error('Performance test failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = PerformanceMonitor; 