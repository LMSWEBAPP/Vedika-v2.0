import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const GITHUB_EXE_URL = 'https://github.com/LMSWEBAPP/Vedika-v2.0/raw/main/vedika-desktop-pet/Vedika-Mascot.exe';

export async function GET(request) {
  try {
    const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);

    const possiblePaths = [
      path.join(process.cwd(), '..', 'vedika-desktop-pet', 'Vedika-Mascot.exe'),
      path.join(process.cwd(), 'vedika-desktop-pet', 'Vedika-Mascot.exe'),
      path.join(process.cwd(), 'public', 'downloads', 'Vedika-Mascot.exe'),
    ];

    let targetPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (targetPath) {
      const stat = fs.statSync(targetPath);
      // Check if it's a Git LFS pointer text file (< 1MB)
      if (stat.size < 1000000) {
        const fd = fs.openSync(targetPath, 'r');
        const buffer = Buffer.alloc(200);
        fs.readSync(fd, buffer, 0, 200, 0);
        fs.closeSync(fd);
        if (buffer.toString('utf8').includes('git-lfs')) {
          console.log('[API/Mascot/Download] Local file is a Git LFS pointer. Redirecting to GitHub CDN binary.');
          return NextResponse.redirect(GITHUB_EXE_URL, 302);
        }
      }

      // Vercel serverless functions have a strict 4.5MB payload limit, redirect to CDN
      if (isVercel) {
        return NextResponse.redirect(GITHUB_EXE_URL, 302);
      }

      // Local development with full binary: stream directly
      const fileStream = fs.createReadStream(targetPath);
      const headers = new Headers();
      headers.set('Content-Disposition', 'attachment; filename="Vedika-Mascot.exe"');
      headers.set('Content-Type', 'application/vnd.microsoft.portable-executable');
      headers.set('Content-Length', stat.size.toString());
      headers.set('Cache-Control', 'public, max-age=3600');

      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        }
      });

      return new NextResponse(webStream, { headers });
    }

    // Default fallback: redirect to authentic GitHub CDN
    return NextResponse.redirect(GITHUB_EXE_URL, 302);
  } catch (error) {
    console.error('[API/Mascot/Download] Redirecting to GitHub CDN on error:', error);
    return NextResponse.redirect(GITHUB_EXE_URL, 302);
  }
}
