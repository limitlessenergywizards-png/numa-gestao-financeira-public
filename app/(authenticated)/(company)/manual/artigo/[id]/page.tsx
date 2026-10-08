import { HelpArticleClient } from './client';

export default function Page() {
  return <HelpArticleClient />;
}

export async function generateStaticParams() {
  // Placeholder — real articles are fetched client-side from Supabase
  return [{ id: 'placeholder' }];
}
