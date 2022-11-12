// only runs on server

import { getContext } from 'telefunc';
import { ReqRes } from 'types_';

export const getPets = async () => {
  const { req, res } = getContext<ReqRes>();

  const response: {
    results: { name: string; url: string }[];
  } = await fetch('https://pokeapi.co/api/v2/pokemon').then((response) =>
    response.json()
  );
  /* Or with an ORM:
  const movies = Movie.findAll() */
  /* Or with SQL:
  const movies = sql`SELECT * FROM movies;` */

  return response;
};
