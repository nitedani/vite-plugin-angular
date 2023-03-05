import { Page } from "@playwright/test";

export const gotoWithRetry = async (page: Page, url: string) => {
  let delay = 100;
  let retries = 0;

  while (retries < 10) {
    try {
      await page.goto(url);
      return;
    } catch (error) {
      if (retries === 9) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
      retries++;
    }
  }
};
