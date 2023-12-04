// only runs on server

import type { ReqRes } from '#root/renderer/types';
import { getContext } from 'telefunc';

export const getPokemon = async (): Promise<{
  results: { name: string; url: string }[];
}> => {
  const { req, res } = getContext<ReqRes>();

  const response = await fetch('https://pokeapi.co/api/v2/pokemon');
  /* Or with an ORM:
  const movies = Movie.findAll() */
  /* Or with SQL:
  const movies = sql`SELECT * FROM movies;` */

  return response.json();
};
