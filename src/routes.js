import { createPuppeteerRouter } from 'crawlee';

export const router = createPuppeteerRouter();

router.addHandler('menu', async ({ request, page, log, pushData }) => {
  const SELECTORS = {
    query: '[class="query-state"]',
  };

  await page.waitForSelector(SELECTORS.query);

  const queryContent = await page.$eval(SELECTORS.query, (el) => el.innerHTML);

  const json = JSON.parse(decodeURIComponent(queryContent));

  const { queries } = json;

  const itemsObj = queries.find(
    (obj) =>
      obj.queryHash ===
      '["venue-assortment","category-listing","goldies-smashburger",null,null,"en","no-user"]'
  );

  const merchantObj = queries.find(
    (obj) => obj.queryHash === '["venue","static","goldies-smashburger","en"]'
  );

  const { venue } = merchantObj.state.data;

  const { data } = itemsObj.state;
  const { categories, items, options } = data;

  const formattedCategories = categories.map(({ description, name, item_ids }) => ({
    items: item_ids,
    name,
    description,
  }));

  const categoriesWithItems = formattedCategories.map((category) => {
    const itemsWithDescription = category.items
      .map((id) => {
        const foundItem = items.find((item) => item.id === id);

        if (!foundItem) return null;

        const { name, description, price, options: child_modifiers } = foundItem;

        const childModifiers = child_modifiers
          .map((modifier) => {
            const foundOption = options.find((option) => option.id === modifier.option_id);

            if (!foundOption) return null;

            const { name, description, price, values } = foundOption;

            const formattedValues = values.map((value) => {
              const { name, description, price, multi_choice_config } = value;
              const { min, max } = multi_choice_config.total_range;

              return { name, description, price, min_selection: min, max_selection: max };
            });

            const { min, max } = values[0].multi_choice_config.total_range;

            return {
              name,
              description,
              price,
              child_modifiers: formattedValues,
              min_selection: min,
              max_selection: max,
            };
          })
          .filter(Boolean);

        return { name, description, price, child_modifiers: childModifiers };
      })
      .filter(Boolean);

    return { ...category, items: itemsWithDescription };
  });

  await pushData({
    url: request.loadedUrl,
    name: venue.name,
    schedule: venue.opening_times_schedule,
    address: `${venue.city}, ${venue.address} ${venue.postal_code}`,
    categories: categoriesWithItems
  });
});
