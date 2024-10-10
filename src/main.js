import { PuppeteerCrawler, ProxyConfiguration, Request } from 'crawlee';
import { router } from './routes.js';

const startUrls = ['https://wolt.com/en/deu/berlin/restaurant/goldies-smashburger#burgers-2'];


const createRequest = (url) => new Request ({label: 'menu', url });

const crawler = new PuppeteerCrawler({
    requestHandler: router,
    maxRequestsPerCrawl: 20,
});

const requests = startUrls.map((url => createRequest(url)))

await crawler.run(requests);


