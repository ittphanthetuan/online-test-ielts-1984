import mockQuestion from './mock-question2'
// import mockQuestion from './mock-questions.json'

export async function GET() {
  return Response.json(mockQuestion)
}