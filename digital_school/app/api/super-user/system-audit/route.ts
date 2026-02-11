import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { getDatabaseClient } from '@/lib/db-init';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const authData = await getTokenFromRequest(request);

        if (!authData || authData.user.role !== 'SUPER_USER') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const prismadb = await getDatabaseClient();
        const rootDir = process.cwd();
        const appDir = path.join(rootDir, 'app');

        // Helper to scan directory for specific files
        const scanDir = (dir: string, fileTarget: string, baseRoute: string): string[] => {
            let results: string[] = [];
            if (!fs.existsSync(dir)) return results;

            const list = fs.readdirSync(dir);
            for (const file of list) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat && stat.isDirectory()) {
                    results = results.concat(scanDir(fullPath, fileTarget, baseRoute));
                } else if (file === fileTarget) {
                    // Calculate relative route
                    let route = path.relative(appDir, dir);
                    route = route.split(path.sep).join('/');
                    results.push(route === '' ? '/' : `/${route}`);
                }
            }
            return results;
        };

        // 1. Page Audit (Find all page.tsx)
        const pages = scanDir(appDir, 'page.tsx', '/');

        // 2. API Audit (Find all route.ts inside app/api)
        const apiRoutes = scanDir(path.join(appDir, 'api'), 'route.ts', '/api');

        // 3. Environment Audit (Critical Vars)
        const criticalEnvVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'NODE_ENV',
            'NEXTAUTH_SECRET',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET'
        ];

        const envAudit = criticalEnvVars.map(key => ({
            key,
            status: process.env[key] ? 'HEALTHY' : 'MISSING',
            isSecret: true
        }));

        // 4. Infrastructure Audit
        let dbStatus = 'HEALTHY';
        let dbLatency = '0ms';
        try {
            const start = Date.now();
            await prismadb.$queryRaw`SELECT 1`;
            dbLatency = `${Date.now() - start}ms`;
        } catch (e) {
            dbStatus = 'DEGRADED';
        }

        const infrastructure = [
            { name: 'PostgreSQL Database', status: dbStatus, details: dbLatency },
            { name: 'Next.js Server', status: 'HEALTHY', details: 'Node.js ' + process.version },
            { name: 'Prisma ORM', status: 'HEALTHY', details: 'Connected' }
        ];

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: pages.length,
                totalApis: apiRoutes.length,
                envStatus: envAudit.every(e => e.status === 'HEALTHY') ? 'HEALTHY' : 'CHECK_REQUIRED',
                infraStatus: infrastructure.every(i => i.status === 'HEALTHY') ? 'HEALTHY' : 'DEGRADED'
            },
            pages: pages.sort(),
            apis: apiRoutes.sort(),
            environment: envAudit,
            infrastructure
        });
    } catch (error) {
        console.error('System audit error:', error);
        return NextResponse.json(
            { error: 'Failed to perform system audit' },
            { status: 500 }
        );
    }
}
