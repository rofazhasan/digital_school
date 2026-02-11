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

        // Use multiple strategies to find the app directory
        const searchRoots = [
            process.cwd(),
            path.resolve(process.cwd()),
            path.join(process.cwd(), '..'), // Case where we might be in .next or similar
        ];

        let appDir = '';
        for (const root of searchRoots) {
            const possibleApp = path.join(root, 'app');
            const possibleSrcApp = path.join(root, 'src', 'app');

            if (fs.existsSync(possibleApp)) {
                appDir = possibleApp;
                break;
            } else if (fs.existsSync(possibleSrcApp)) {
                appDir = possibleSrcApp;
                break;
            }
        }

        if (!appDir) {
            // Fallback to searching with a marker file
            console.error('System Audit: App directory not found using standard roots.');
            // If we can't find it, we'll return zero counts but labeled as "UNABLE TO LOCATE APP DIR"
        }

        // Helper to scan directory for specific files recursively
        const scanDir = (dir: string, fileTarget: string): string[] => {
            let results: string[] = [];
            if (!dir || !fs.existsSync(dir)) return results;

            try {
                const list = fs.readdirSync(dir);
                for (const file of list) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.lstatSync(fullPath); // Use lstatSync to handle symlinks safely

                    if (stat && stat.isDirectory()) {
                        // Skip hidden folders and common heavy directories
                        if (file.startsWith('.') || file === 'node_modules' || file === 'public' || file === 'components') continue;
                        results = results.concat(scanDir(fullPath, fileTarget));
                    } else if (file === fileTarget) {
                        let route = path.relative(appDir, dir);
                        route = route.split(path.sep).join('/');
                        results.push(route === '' ? '/' : `/${route}`);
                    }
                }
            } catch (e) {
                // Silently skip unreadable directories
            }
            return results;
        };

        const pages = appDir ? [
            ...scanDir(appDir, 'page.tsx'),
            ...scanDir(appDir, 'page.js'),
            ...scanDir(appDir, 'page.jsx')
        ] : [];

        const apiRoutes = appDir ? [
            ...scanDir(path.join(appDir, 'api'), 'route.ts'),
            ...scanDir(path.join(appDir, 'api'), 'route.js')
        ] : [];

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
            { name: 'App Directory', status: appDir ? 'HEALTHY' : 'NOT_FOUND', details: appDir || 'Check Server Config' }
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

        // Persist audit log
        try {
            await prismadb.log.create({
                data: {
                    action: 'UPDATE',
                    userId: authData.user.id,
                    context: {
                        type: 'SYSTEM_AUDIT',
                        summary: auditResult.summary,
                        pagesCount: auditResult.summary.totalPages,
                        apisCount: auditResult.summary.totalApis,
                        appDir: appDir
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
                    userAgent: request.headers.get('user-agent') || 'System'
                }
            });
        } catch (err) { }

        return NextResponse.json(auditResult);
    } catch (error) {
        console.error('System audit error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
