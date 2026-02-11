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

        // Dynamically find app directory (handles root-level or src-level)
        let appDir = path.join(rootDir, 'app');
        if (!fs.existsSync(appDir)) {
            appDir = path.join(rootDir, 'src', 'app');
        }

        if (!fs.existsSync(appDir)) {
            console.error('App directory not found during audit at:', rootDir);
        }

        // Helper to scan directory for specific files recursively
        const scanDir = (dir: string, fileTarget: string): string[] => {
            let results: string[] = [];
            if (!fs.existsSync(dir)) return results;

            try {
                const list = fs.readdirSync(dir);
                for (const file of list) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);

                    if (stat && stat.isDirectory()) {
                        // Skip hidden folders like .next, node_modules etc
                        if (file.startsWith('.') || file === 'node_modules') continue;
                        results = results.concat(scanDir(fullPath, fileTarget));
                    } else if (file === fileTarget) {
                        // Calculate relative route from appDir
                        let route = path.relative(appDir, dir);
                        route = route.split(path.sep).join('/');
                        // Clean up Next.js special route segments (e.g., (dashboard), [id])
                        // But keep them for visibility in audit
                        results.push(route === '' ? '/' : `/${route}`);
                    }
                }
            } catch (e) {
                console.error(`Error scanning directory ${dir}:`, e);
            }
            return results;
        };

        // 1. Page Audit (Find all page.tsx or page.js)
        const pages = [
            ...scanDir(appDir, 'page.tsx'),
            ...scanDir(appDir, 'page.js'),
            ...scanDir(appDir, 'page.jsx')
        ];

        // 2. API Audit (Find all route.ts or route.js inside app/api)
        const apiRoutes = [
            ...scanDir(path.join(appDir, 'api'), 'route.ts'),
            ...scanDir(path.join(appDir, 'api'), 'route.js')
        ];

        // 3. Environment Audit (Critical Vars)
        const criticalEnvVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'NODE_ENV',
            'NEXTAUTH_SECRET',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'NEXT_PUBLIC_APP_URL'
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
            { name: 'Prisma ORM', status: 'HEALTHY', details: 'Connected' },
            { name: 'Environment', status: envAudit.every(e => e.status === 'HEALTHY') ? 'HEALTHY' : 'CHECK_REQUIRED', details: `${envAudit.filter(e => e.status === 'HEALTHY').length}/${envAudit.length} Critical Vars` }
        ];

        const auditResult = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPages: [...new Set(pages)].length,
                totalApis: [...new Set(apiRoutes)].length,
                envStatus: envAudit.every(e => e.status === 'HEALTHY') ? 'HEALTHY' : 'CHECK_REQUIRED',
                infraStatus: infrastructure.every(i => i.status === 'HEALTHY') ? 'HEALTHY' : 'DEGRADED'
            },
            pages: [...new Set(pages)].sort(),
            apis: [...new Set(apiRoutes)].sort(),
            environment: envAudit,
            infrastructure
        };

        // PERSIST AUDIT TO DATABASE
        try {
            await prismadb.log.create({
                data: {
                    action: 'UPDATE', // Using UPDATE as a generic placeholder for SYSTEM_AUDIT
                    userId: authData.user.id,
                    context: {
                        type: 'SYSTEM_AUDIT',
                        summary: auditResult.summary,
                        pagesCount: auditResult.summary.totalPages,
                        apisCount: auditResult.summary.totalApis,
                        details: 'Automated System-wide Audit Completed'
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
                    userAgent: request.headers.get('user-agent') || 'System'
                }
            });
        } catch (dbError) {
            console.error('Failed to save audit log:', dbError);
        }

        return NextResponse.json(auditResult);
    } catch (error) {
        console.error('System audit error:', error);
        return NextResponse.json(
            { error: 'Failed to perform system audit' },
            { status: 500 }
        );
    }
}
