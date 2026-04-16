import { redirect } from 'next/navigation';

/** L’accueil public est la page d’accueil vitrine (`/home`). */
export default function Page() {
  redirect('/home');
}
