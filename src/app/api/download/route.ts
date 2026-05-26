import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { resolve, normalize } from 'path';

const ALLOWED_DIR = '/home/z';

export async function GET(req: NextRequest) {
  const fileParam = req.nextUrl.searchParams.get('file');

  if (!fileParam || !fileParam.endsWith('.zip')) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  // Safely resolve the path and verify it stays within ALLOWED_DIR
  const resolvedPath = resolve(ALLOWED_DIR, normalize(fileParam));

  if (!resolvedPath.startsWith(ALLOWED_DIR + '/')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const fileStat = await stat(resolvedPath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const buffer = await readFile(resolvedPath);
    const filename = fileParam.split('/').pop() || 'download.zip';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
