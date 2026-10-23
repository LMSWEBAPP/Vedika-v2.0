import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check possible locations for the Vedika Mascot executable
    const possiblePaths = [
      path.join(process.cwd(), '..', 'vedika-desktop-pet', 'Vedika-Mascot.exe'),
      path.join(process.cwd(), 'vedika-desktop-pet', 'Vedika-Mascot.exe'),
      path.join(process.cwd(), 'public', 'downloads', 'Vedika-Mascot.exe'),
      path.join(process.cwd(), 'public', 'Vedika-Mascot.exe'),
    ];

    let targetPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (!targetPath) {
      return NextResponse.json(
        { error: 'Vedika Mascot executable binary not found on server.' },
        { status: 404 }
      );
    }

    const stat = fs.statSync(targetPath);
    const fileStream = fs.createReadStream(targetPath);

    const headers = new Headers();
    headers.set('Content-Disposition', 'attachment; filename="Vedika-Mascot.exe"');
    headers.set('Content-Type', 'application/vnd.microsoft.portable-executable');
    headers.set('Content-Length', stat.size.toString());
    headers.set('Cache-Control', 'public, max-age=3600');

    // Convert node readstream to web ReadableStream
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
  } catch (error) {
    console.error('[API/Mascot/Download] Error serving executable:', error);
    return NextResponse.json(
      { error: 'Failed to download mascot executable.' },
      { status: 500 }
    );
  }
}
