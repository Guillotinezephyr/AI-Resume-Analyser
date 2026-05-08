import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from the document.' },
        { status: 400 }
      );
    }

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Act as an expert Applicant Tracking System (ATS) and Senior Technical Recruiter.
      Analyze the following resume text and provide a JSON response with the following structure:
      {
        "atsScore": <a number from 1 to 10 evaluating the resume's formatting, content, and ATS readability>,
        "feedback": "<a 2-3 sentence constructive feedback on how to improve the resume>",
        "keywords": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"] // extract top 3-5 technical or professional skills/keywords relevant for a job search
      }

      Do not include any other text outside the JSON block. Ensure valid JSON format.

      Resume Text:
      ${extractedText.substring(0, 10000)} // Limiting to avoid huge payloads just in case
    `;

    const response = await model.generateContent(prompt);
    let text = response.response.text();
    
    // Clean up potential markdown formatting in the response (e.g. ```json ... ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const resultData = JSON.parse(text);

    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json(
      { error: 'An error occurred while analyzing the resume.' },
      { status: 500 }
    );
  }
}
