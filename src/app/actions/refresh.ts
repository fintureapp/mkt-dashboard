'use server';

import { revalidatePath, updateTag } from 'next/cache';

export async function refreshInsights() {
  updateTag('meta:insights');
  revalidatePath('/', 'layout');
}
