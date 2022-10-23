// only runs on server

import { getContext } from 'telefunc';
import { ReqRes } from 'types_';

export const getPets = async () => {
  const { req, res } = getContext<ReqRes>();

  const response = await fetch(
    'https://petstore.swagger.io/v2/store/inventory'
  ).then((response) => response.json());
  /* Or with an ORM:
  const movies = Movie.findAll() */
  /* Or with SQL:
  const movies = sql`SELECT * FROM movies;` */

  return response;
};
