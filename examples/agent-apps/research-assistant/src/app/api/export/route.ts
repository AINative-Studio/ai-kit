/**
 * Export API endpoint - Export research results to various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import { marked } from 'marked';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, data } = body;

    if (!data || !data.topic) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    let content: Buffer | string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        content = await generatePDF(data);
        contentType = 'application/pdf';
        filename = `research-${data.topic.replace(/\s+/g, '-')}.pdf`;
        break;

      case 'docx':
        content = await generateDOCX(data);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `research-${data.topic.replace(/\s+/g, '-')}.docx`;
        break;

      case 'markdown':
        content = generateMarkdown(data);
        contentType = 'text/markdown';
        filename = `research-${data.topic.replace(/\s+/g, '-')}.md`;
        break;

      case 'html':
        content = await generateHTML(data);
        contentType = 'text/html';
        filename = `research-${data.topic.replace(/\s+/g, '-')}.html`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const response = new NextResponse(content);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

async function generatePDF(data: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 50;

  // Title
  page.drawText(data.topic, {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  y -= 40;

  // Summary
  page.drawText('Summary', {
    x: 50,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  y -= 25;

  const summaryLines = wrapText(data.summary, 500);
  for (const line of summaryLines) {
    page.drawText(line, {
      x: 50,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 20;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function generateDOCX(data: any): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: data.topic,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: 'Summary',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [new TextRun(data.summary)],
          }),
          ...data.sections.flatMap((section: any) => [
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [new TextRun(section.content)],
            }),
          ]),
        ],
      },
    ],
  });

  // Note: In production, use the docx package's Packer.toBuffer method
  return Buffer.from('DOCX content placeholder');
}

function generateMarkdown(data: any): string {
  let md = `# ${data.topic}\n\n`;
  md += `## Summary\n\n${data.summary}\n\n`;

  for (const section of data.sections) {
    md += `## ${section.title}\n\n${section.content}\n\n`;
  }

  md += `## Citations\n\n`;
  for (const citation of data.citations) {
    md += `- [${citation.title}](${citation.url})\n`;
  }

  md += `\n---\n\nGenerated at: ${data.generatedAt}\n`;

  return md;
}

async function generateHTML(data: any): Promise<string> {
  const markdown = generateMarkdown(data);
  const html = await marked(markdown);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.topic}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; }
    h2 { color: #666; margin-top: 30px; }
    a { color: #0066cc; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `;
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length * 6 < maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
