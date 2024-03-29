import type { PageContext } from '#root/renderer/types';

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContext) {
  const response = await fetch(
    'https://petstore.swagger.io/v2/store/inventory',
  ).then((response) => response.json());
  /* Or with an ORM:
  const movies = Movie.findAll() */
  /* Or with SQL:
  const movies = sql`SELECT * FROM movies;` */

  return {
    pageContext: {
      pageProps: {
        response,
      },
    },
  };
}
