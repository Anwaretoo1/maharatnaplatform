import { redirect } from 'next/navigation';

// Redirect old /craftsmen route to new /instructors route
export async function GET() {
  redirect('/instructors');
}
