import mockQuestion from './mock-questions.json'

export async function GET() {
  return new Response(JSON.stringify(mockQuestion), {
    status: 200
  })
}